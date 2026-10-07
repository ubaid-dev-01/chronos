export interface RuleMatch {
  projectId: string;
  projectName: string;
  confidence: number;
  reasoning: string;
}

export class RuleEngine {
  match(windowTitle: string, processName: string, projects: any[]): RuleMatch | null {
    const title = windowTitle.toLowerCase();

    for (const project of projects) {
      const name = project.name.toLowerCase();
      const slug = name.replace(/\s+/g, '-');

      // Exact project name in title
      if (title.includes(name) || title.includes(slug)) {
        return {
          projectId: project._id.toString(), projectName: project.name,
          confidence: 0.95, reasoning: `Title contains "${project.name}"`,
        };
      }

      // IDE workspace pattern: "file - workspace - VS Code"
      const idePatterns = [
        /- (.+?) - visual studio code/i,
        /- (.+?) - webstorm/i,
        /- (.+?) - intellij/i,
        /\[(.+?)\]/,
      ];

      for (const pattern of idePatterns) {
        const m = windowTitle.match(pattern);
        if (m) {
          const folder = m[1].toLowerCase().trim();
          if (folder.includes(slug) || slug.includes(folder)) {
            return {
              projectId: project._id.toString(), projectName: project.name,
              confidence: 0.9, reasoning: `IDE workspace "${m[1]}" matches "${project.name}"`,
            };
          }
        }
      }

      // Multi-word partial match
      const words = name.split(/\s+/).filter((w: string) => w.length > 2);
      const matched = words.filter((w: string) => title.includes(w));
      if (matched.length >= 2 || (words.length === 1 && matched.length === 1)) {
        return {
          projectId: project._id.toString(), projectName: project.name,
          confidence: 0.7, reasoning: `Keywords: ${matched.join(', ')}`,
        };
      }
    }
    return null;
  }
}
