import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas';
import * as projCtrl from '../controllers/projects.controller';

export const projectRoutes = Router();

projectRoutes.get('/', projCtrl.getProjects);
projectRoutes.post('/', requireRole('manager'), validate(createProjectSchema), projCtrl.createProject);
projectRoutes.get('/:id', projCtrl.getProject);
projectRoutes.put('/:id', requireRole('manager'), validate(updateProjectSchema), projCtrl.updateProject);
projectRoutes.delete('/:id', requireRole('admin'), projCtrl.deleteProject);
projectRoutes.get('/:id/stats', projCtrl.getProjectStats);
