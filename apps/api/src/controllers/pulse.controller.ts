import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getRecentActivityFeed } from '../websocket';

/**
 * GET /pulse/feed recent Team Pulse activity events for this org.
 * Live updates arrive over WebSocket (`activity_feed` event); this endpoint
 * just seeds the page with recent history on first load.
 */
export const getActivityFeed = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10) || 50, 50);
  const feed = getRecentActivityFeed(req.orgId!, limit);
  res.json({ success: true, data: feed });
});
