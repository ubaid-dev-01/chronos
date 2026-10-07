import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { updateOrgSchema } from '../validators/schemas';
import * as orgsCtrl from '../controllers/orgs.controller';

export const orgRoutes = Router();

orgRoutes.get('/me', orgsCtrl.getOrg);
orgRoutes.put('/me', requireRole('admin'), validate(updateOrgSchema), orgsCtrl.updateOrg);
orgRoutes.get('/me/members', orgsCtrl.getOrgMembers);
orgRoutes.get('/me/integrations', requireRole('admin'), orgsCtrl.getIntegrations);
