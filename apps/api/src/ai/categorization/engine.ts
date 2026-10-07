import { Project, TimeLog } from '@chronos/db';
import { RuleEngine, RuleMatch } from './rules';

interface CategorizationResult {
  projectId: string;
  projectName: string;
  confidence: number;
  method: 'rule' | 'history' | 'none';
  reasoning: string;
}

export class CategorizationEngine {
  private rules = new RuleEngine();

  async categorize(
    orgId: string, userId: string, windowTitle: string, processName: string
  ): Promise<CategorizationResult | null> {
    const projects = await Project.find({ orgId, isActive: true }).lean();
    if (projects.length === 0) return null;

    // Strategy 1: Rule-based matching
    const ruleMatch = this.rules.match(windowTitle, processName, projects);
    if (ruleMatch && ruleMatch.confidence >= 0.7) {
      return { ...ruleMatch, method: 'rule' };
    }

    // Strategy 2: Historical pattern matching
    const historyMatch = await this.matchByHistory(userId, windowTitle, processName);
    if (historyMatch && historyMatch.confidence >= 0.5) {
      return { ...historyMatch, method: 'history' };
    }

    return null;
  }

  private async matchByHistory(
    userId: string, windowTitle: string, processName: string
  ): Promise<RuleMatch | null> {
    const keywords = this.extractKeywords(windowTitle);
    if (!keywords) return null;

    const recentLogs = await TimeLog.find({
      userId, processName,
      windowTitle: { $regex: keywords, $options: 'i' },
    }).sort({ startTime: -1 }).limit(10).populate('projectId', 'name').lean() as any[];

    if (recentLogs.length === 0) return null;

    const counts = new Map<string, { count: number; name: string }>();
    for (const log of recentLogs) {
      const pid = log.projectId?._id?.toString();
      const pname = log.projectId?.name;
      if (!pid) continue;
      const c = counts.get(pid) || { count: 0, name: pname };
      c.count++;
      counts.set(pid, c);
    }

    let best: { id: string; count: number; name: string } | null = null;
    for (const [id, data] of counts) {
      if (!best || data.count > best.count) best = { id, count: data.count, name: data.name };
    }

    if (!best) return null;
    return {
      projectId: best.id, projectName: best.name,
      confidence: Math.min(1.0, best.count / recentLogs.length),
      reasoning: `${best.count}/${recentLogs.length} similar historical sessions`,
    };
  }

  private extractKeywords(title: string): string {
    const parts = title.split(/[\s\-–—|/\\]+/);
    return parts.filter(p => p.length > 2 && !['the', 'and', 'for', 'new', 'tab'].includes(p.toLowerCase()))
      .slice(0, 3).join('|');
  }
}
