import { Router } from 'express';
import * as downloadsCtrl from '../controllers/downloads.controller';
import * as filesCtrl from '../controllers/files.controller';
import * as publicApiCtrl from '../controllers/public-api.controller';
import { authenticateApiKey, requireApiKeyScope } from '../middleware/api-key-auth';
import { publicApiLimiter } from '../middleware/rate-limit';

export const publicRoutes = Router();

publicRoutes.get('/downloads', downloadsCtrl.getDownloads);
publicRoutes.get(
  '/files/screenshots/:orgId/:timelogId/:file',
  filesCtrl.getLocalScreenshot
);

/**
 * Public REST API authenticated with an org-scoped API key (see
 * `middleware/api-key-auth.ts`), not the regular user JWT. Keys are managed
 * via the authenticated `/v1/api-keys` endpoints (admin only).
 *
 *   GET /v1/public/timelogs   scope: timelogs:read
 *   GET /v1/public/projects   scope: projects:read
 *   GET /v1/public/users      scope: users:read
 */
const publicApi = Router();
publicApi.use(authenticateApiKey, publicApiLimiter);
publicApi.get('/timelogs', requireApiKeyScope('timelogs:read'), publicApiCtrl.getPublicTimeLogs);
publicApi.get('/projects', requireApiKeyScope('projects:read'), publicApiCtrl.getPublicProjects);
publicApi.get('/users', requireApiKeyScope('users:read'), publicApiCtrl.getPublicUsers);

publicRoutes.use('/public', publicApi);
