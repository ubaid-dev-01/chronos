import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import {
  readLocalScreenshot,
  verifyLocalFileAccess,
} from '../services/screenshot.service';

/** Public signed access to locally stored screenshots (dev / no-S3 mode) */
export const getLocalScreenshot = asyncHandler(async (req: Request, res: Response) => {
  const key = `${req.params.orgId}/${req.params.timelogId}/${req.params.file}`;
  const expires = parseInt(String(req.query.expires), 10);
  const sig = String(req.query.sig ?? '');

  if (!verifyLocalFileAccess(key, expires, sig)) {
    throw new ApiError(403, 'Invalid or expired file link');
  }

  if (key.includes('..')) throw new ApiError(400, 'Invalid path');

  try {
    const buffer = await readLocalScreenshot(key);
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  } catch {
    throw new ApiError(404, 'Screenshot not found');
  }
});
