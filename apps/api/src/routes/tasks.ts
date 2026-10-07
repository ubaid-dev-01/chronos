import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { requirePermission } from '../middleware/permissions';
import { validate } from '../middleware/validate';
import {
  createTaskListSchema,
  updateTaskListSchema,
  createTaskItemSchema,
  updateTaskItemSchema,
} from '../validators/schemas';
import * as tasksCtrl from '../controllers/tasks.controller';

export const taskRoutes = Router();

taskRoutes.use(requirePermission('tasksEnabled'));
taskRoutes.get('/mine', tasksCtrl.getMyTasks);
taskRoutes.get('/lists', tasksCtrl.getTaskLists);
taskRoutes.post('/lists', requireRole('manager'), validate(createTaskListSchema), tasksCtrl.createTaskList);
taskRoutes.patch('/lists/:id', requireRole('manager'), validate(updateTaskListSchema), tasksCtrl.updateTaskList);
taskRoutes.delete('/lists/:id', requireRole('manager'), tasksCtrl.deleteTaskList);

taskRoutes.get('/lists/:listId/items', tasksCtrl.getTaskItems);
taskRoutes.post('/lists/:listId/items', validate(createTaskItemSchema), tasksCtrl.createTaskItem);
taskRoutes.patch('/items/:id', validate(updateTaskItemSchema), tasksCtrl.updateTaskItem);
taskRoutes.delete('/items/:id', tasksCtrl.deleteTaskItem);
