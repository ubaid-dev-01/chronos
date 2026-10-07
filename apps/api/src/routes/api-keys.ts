import { Router } from 'express';
import * as apiKeysCtrl from '../controllers/api-keys.controller';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createApiKeySchema } from '../validators/schemas';

export const apiKeyRoutes = Router();

apiKeyRoutes.get('/', requireRole('admin'), apiKeysCtrl.listApiKeys);
apiKeyRoutes.post('/', requireRole('admin'), validate(createApiKeySchema), apiKeysCtrl.createApiKeyHandler);
apiKeyRoutes.delete('/:id', requireRole('admin'), apiKeysCtrl.revokeApiKey);
