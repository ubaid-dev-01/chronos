import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const WEB_APP = join(__dirname, '../../../web/src/app');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === 'page.tsx') acc.push(full);
  }
  return acc;
}

function routeFromPage(file: string): string {
  const rel = file.slice(WEB_APP.length).replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
  const cleaned = rel
    .split('/')
    .filter((seg) => !seg.startsWith('(') && !seg.endsWith(')'))
    .join('/');
  return cleaned || '/';
}

describe('Web route inventory', () => {
  const pages = walk(WEB_APP);
  const routes = pages.map(routeFromPage);

  it('discovers marketing, auth, dashboard, and admin pages', () => {
    expect(routes).toEqual(expect.arrayContaining([
      '/',
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/dashboard',
      '/reports',
      '/tasks',
      '/settings',
      '/settings/billing',
      '/admin/login',
    ]));
  });

  it('sidebar destinations exist as pages', () => {
    const sidebar = readFileSync(
        join(__dirname, '../../../web/src/components/layout/sidebar.tsx'),
      'utf8'
    );
    const hrefs = [...sidebar.matchAll(/href:\s*"(\/[^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(8);
    for (const href of hrefs) {
      expect(routes).toContain(href);
    }
  });
});
