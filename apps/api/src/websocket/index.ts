import { Server as HttpServer } from 'http';
import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { WSEvent, WSPresencePayload, ActivityFeedEvent } from '@chronos/types';
import { User, verifyAccessToken } from '@chronos/db';
import { logger } from '../utils/logger';
import { env } from '../config/env';

let io: Server | null = null;

type PresenceRecord = WSPresencePayload & { orgId: string };

const presenceMap = new Map<string, PresenceRecord>();

function presenceKey(orgId: string, userId: string) {
  return `${orgId}:${userId}`;
}

// Team Pulse: a small in-memory ring buffer of recent activity per org, so the
// dashboard has something to show on initial load (not just live events).
const FEED_BUFFER_SIZE = 50;
const activityFeedByOrg = new Map<string, ActivityFeedEvent[]>();

async function authenticateSocket(socket: Socket): Promise<void> {
  const header = socket.handshake.headers.authorization;
  const token =
    (socket.handshake.auth as { token?: string } | undefined)?.token ||
    (typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : undefined);

  if (!token) {
    throw new Error('Missing auth token');
  }

  const payload = await verifyAccessToken(token);
  const user = (await User.findById(payload.sub).lean()) as {
    _id: unknown;
    orgId: unknown;
    isActive?: boolean;
    displayName?: string;
  } | null;

  if (!user || user.isActive === false) {
    throw new Error('Unauthorized');
  }

  socket.data.userId = String(user._id);
  socket.data.orgId = String(user.orgId);
  socket.data.displayName = user.displayName;
}

export function initWebSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(async (socket, next) => {
    try {
      await authenticateSocket(socket);
      next();
    } catch (err) {
      logger.debug(`WS auth failed: ${socket.id}`);
      next(err instanceof Error ? err : new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WS connected: ${socket.id}`);

    socket.on(WSEvent.JOIN_ORG, async () => {
      const orgId = socket.data.orgId as string;
      const userId = socket.data.userId as string;
      const room = `org:${orgId}`;
      await socket.join(room);
      await socket.join(`user:${userId}`);
      logger.debug(`${userId} joined room ${room}`);

      const teamPresence = Array.from(presenceMap.values()).filter(
        (p) => p.orgId === orgId
      );
      socket.emit(WSEvent.TEAM_STATUS, teamPresence);
    });

    socket.on(WSEvent.LEAVE_ORG, async () => {
      const orgId = socket.data.orgId as string;
      await socket.leave(`org:${orgId}`);
    });

    socket.on(WSEvent.STATUS_UPDATE, (data: WSPresencePayload) => {
      const orgId = socket.data.orgId as string;
      const userId = socket.data.userId as string;
      const payload: PresenceRecord = {
        ...data,
        userId,
        orgId,
      };
      presenceMap.set(presenceKey(orgId, userId), payload);
      socket.to(`org:${orgId}`).emit(WSEvent.PRESENCE_UPDATE, payload);
    });

    socket.on(WSEvent.HEARTBEAT, () => {
      const orgId = socket.data.orgId as string;
      const userId = socket.data.userId as string;
      const presence = presenceMap.get(presenceKey(orgId, userId));
      if (presence) {
        presence.status = 'active';
        io?.to(`org:${orgId}`).emit(WSEvent.PRESENCE_UPDATE, presence);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`WS disconnected: ${socket.id}`);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function emitToOrg(orgId: string, event: string, data: any) {
  io?.to(`org:${orgId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

/**
 * Update a user's Team Pulse presence and broadcast it to the org.
 */
export function updatePresence(orgId: string, payload: WSPresencePayload) {
  presenceMap.set(presenceKey(orgId, payload.userId), { ...payload, orgId });
  io?.to(`org:${orgId}`).emit(WSEvent.PRESENCE_UPDATE, payload);
}

export function getPresence(userId: string): WSPresencePayload | undefined {
  for (const record of presenceMap.values()) {
    if (record.userId === userId) return record;
  }
  return undefined;
}

export function getIO(): Server | null {
  return io;
}

export function getSocketClientCount(): number {
  return io?.engine?.clientsCount ?? 0;
}

export function getActivePresenceCount(): number {
  return presenceMap.size;
}

/** Push a Team Pulse event: buffered per-org and broadcast live over WS. */
export function emitActivityFeed(orgId: string, event: Omit<ActivityFeedEvent, 'id' | 'orgId' | 'timestamp'>) {
  const full: ActivityFeedEvent = {
    ...event,
    id: randomUUID(),
    orgId,
    timestamp: Date.now(),
  };

  const buffer = activityFeedByOrg.get(orgId) ?? [];
  buffer.push(full);
  if (buffer.length > FEED_BUFFER_SIZE) buffer.shift();
  activityFeedByOrg.set(orgId, buffer);

  io?.to(`org:${orgId}`).emit(WSEvent.ACTIVITY_FEED, full);
  return full;
}

/** Recent buffered Team Pulse events for initial page load. */
export function getRecentActivityFeed(orgId: string, limit = FEED_BUFFER_SIZE): ActivityFeedEvent[] {
  const buffer = activityFeedByOrg.get(orgId) ?? [];
  return buffer.slice(-limit).reverse();
}
