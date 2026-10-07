import { Project, TimeLog, TaskList, Task } from '@chronos/db';
import { BurnoutEngine } from '../ai/burnout/engine';

export type HealthStatus = 'green' | 'yellow' | 'red';

export interface ProjectHealth {
  projectId: string;
  name: string;
  colorHex: string;
  status: HealthStatus;
  healthScore: number;
  hoursLogged: number;
  budgetHours: number | null;
  budgetUsedPercent: number | null;
  taskCompletionRate: number | null;
  totalTasks: number;
  completedTasks: number;
  avgBurnoutScore: number | null;
  contributorCount: number;
}

interface LeanProjectDoc {
  _id: unknown;
  name: string;
  colorHex: string;
  budgetHours?: number;
}

const burnoutEngine = new BurnoutEngine();

function statusForScore (score: number): HealthStatus {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Per-project health score blending budget burn rate, task completion, and
 * the burnout risk of people currently contributing to the project.
 */
export async function getProjectHealth (orgId: string, startMs: number, endMs: number): Promise<ProjectHealth[]> {
  const projects = (await Project.find({ orgId, isActive: true })
    .select('name colorHex budgetHours')
    .lean()) as unknown as LeanProjectDoc[];

  if (projects.length === 0) return [];

  const results: ProjectHealth[] = [];

  for (const project of projects) {
    const projectId = String(project._id);

    const logs = (await TimeLog.find({
      orgId,
      projectId,
      startTime: { $gte: startMs, $lte: endMs },
    })
      .select('userId startTime endTime')
      .lean()) as unknown as Array<{ userId: unknown; startTime: number; endTime?: number }>;

    const hoursLoggedMs = logs.reduce((sum, l) => sum + Math.max((l.endTime ?? l.startTime) - l.startTime, 0), 0);
    const hoursLogged = Math.round((hoursLoggedMs / 3600000) * 10) / 10;

    const budgetHours = project.budgetHours ?? null;
    const budgetUsedPercent = budgetHours ? Math.round((hoursLogged / budgetHours) * 1000) / 10 : null;
    const budgetScore = budgetHours == null
      ? 100
      : Math.max(0, 100 - Math.max(0, budgetUsedPercent! - 100));

    const lists = await TaskList.find({ orgId, projectId }).select('_id').lean();
    const listIds = lists.map(l => l._id);
    const totalTasks = listIds.length > 0 ? await Task.countDocuments({ orgId, listId: { $in: listIds } }) : 0;
    const completedTasks = listIds.length > 0
      ? await Task.countDocuments({ orgId, listId: { $in: listIds }, isComplete: true })
      : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : null;
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

    const contributorIds = [...new Set(logs.map(l => String(l.userId)))];
    let avgBurnoutScore: number | null = null;
    let burnoutScore = 100;
    if (contributorIds.length > 0) {
      const scores = await Promise.all(
        contributorIds.map(userId => burnoutEngine.analyzeUser(userId, '', orgId))
      );
      avgBurnoutScore = Math.round(
        scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      );
      burnoutScore = 100 - avgBurnoutScore;
    }

    const healthScore = Math.round(budgetScore * 0.4 + taskScore * 0.3 + burnoutScore * 0.3);

    results.push({
      projectId,
      name: project.name,
      colorHex: project.colorHex,
      status: statusForScore(healthScore),
      healthScore: Math.max(0, Math.min(100, healthScore)),
      hoursLogged,
      budgetHours,
      budgetUsedPercent,
      taskCompletionRate,
      totalTasks,
      completedTasks,
      avgBurnoutScore,
      contributorCount: contributorIds.length,
    });
  }

  return results.sort((a, b) => a.healthScore - b.healthScore);
}
