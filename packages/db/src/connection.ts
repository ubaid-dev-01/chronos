import dns from 'node:dns';
import { Resolver } from 'node:dns/promises';
import mongoose from 'mongoose';

dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI || '';

/** systemd-resolved (127.0.0.53) often REFUSEs MongoDB Atlas SRV lookups from Next.js. */
const PUBLIC_DNS_SERVERS = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof global & { mongoose?: MongooseCache };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

let legacyIndexesChecked = false;

/** Clerk was removed; old unique clerkId indexes break password signup (null dup key). */
async function dropLegacyClerkIndexes (): Promise<void> {
  if (legacyIndexesChecked) return;
  legacyIndexesChecked = true;

  const db = mongoose.connection.db;
  if (!db) return;

  try {
    const users = db.collection('users');
    const indexes = await users.indexes();
    for (const idx of indexes) {
      if (idx.key && 'clerkId' in idx.key && idx.name) {
        await users.dropIndex(idx.name);
        console.warn(`[chronos/db] Dropped legacy users index: ${idx.name}`);
      }
    }
  } catch (err) {
    console.warn('[chronos/db] Could not drop legacy clerkId index:', err);
  }
}

type SrvRecord = { name: string; port: number; priority: number; weight: number };

export function buildStandardMongoUri (
  srvUri: string,
  srv: SrvRecord[],
  txt: string[]
): string {
  const parsed = new URL(srvUri.replace(/^mongodb\+srv:\/\//i, 'https://'));
  const hosts = [...srv]
    .sort((a, b) => a.priority - b.priority || b.weight - a.weight)
    .map((r) => `${r.name.replace(/\.$/, '')}:${r.port}`)
    .join(',');

  const params = new URLSearchParams(parsed.search);
  params.set('tls', 'true');
  for (const chunk of txt.join('&').split('&')) {
    const eq = chunk.indexOf('=');
    if (eq === -1) continue;
    const key = chunk.slice(0, eq).trim();
    const value = chunk.slice(eq + 1).trim();
    if (key && value && !params.has(key)) params.set(key, value);
  }
  if (!params.has('authSource')) params.set('authSource', 'admin');

  const auth = parsed.username
    ? `${encodeURIComponent(decodeURIComponent(parsed.username))}:${encodeURIComponent(decodeURIComponent(parsed.password))}@`
    : '';
  const path = parsed.pathname || '/';
  return `mongodb://${auth}${hosts}${path}?${params.toString()}`;
}

async function resolveMongoSrvUri (uri: string): Promise<string> {
  if (!/^mongodb\+srv:\/\//i.test(uri)) return uri;

  const hostname = new URL(uri.replace(/^mongodb\+srv:\/\//i, 'https://')).hostname;
  const resolver = new Resolver();
  resolver.setServers(PUBLIC_DNS_SERVERS);

  const lookupSrv = async (): Promise<SrvRecord[]> => {
    try {
      return await resolver.resolveSrv(`_mongodb._tcp.${hostname}`);
    } catch {
      return dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
    }
  };

  const srv = await lookupSrv();
  if (!srv.length) {
    throw new Error(`No MongoDB SRV records found for ${hostname}`);
  }

  let txt: string[] = [];
  try {
    txt = (await resolver.resolveTxt(hostname)).flat();
  } catch {
    try {
      txt = (await dns.promises.resolveTxt(hostname)).flat();
    } catch {
      txt = ['authSource=admin'];
    }
  }

  return buildStandardMongoUri(uri, srv, txt);
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = await resolveMongoSrvUri(MONGODB_URI);
      return mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        family: 4,
      });
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  await dropLegacyClerkIndexes();
  return cached.conn;
}

export { mongoose };
