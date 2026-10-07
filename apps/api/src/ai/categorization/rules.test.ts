import { describe, expect, it } from 'vitest';
import { RuleEngine } from './rules';

const projects = [
  { _id: 'p1', name: 'Chronos' },
  { _id: 'p2', name: 'Marketing Site' },
];

describe('RuleEngine.match', () => {
  const engine = new RuleEngine();

  it('matches an exact project name in the window title', () => {
    const result = engine.match('Chronos - dashboard.tsx', 'Code.exe', projects);
    expect(result).not.toBeNull();
    expect(result?.projectId).toBe('p1');
    expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('matches an IDE workspace pattern', () => {
    const result = engine.match(
      'app.ts - chronos - Visual Studio Code',
      'Code.exe',
      projects
    );
    expect(result).not.toBeNull();
    expect(result?.projectId).toBe('p1');
  });

  it('matches multi-word keyword overlap', () => {
    const result = engine.match(
      'Marketing Site homepage draft',
      'chrome.exe',
      projects
    );
    expect(result).not.toBeNull();
    expect(result?.projectId).toBe('p2');
  });

  it('returns null when nothing matches', () => {
    const result = engine.match('Random unrelated window', 'notepad.exe', projects);
    expect(result).toBeNull();
  });
});
