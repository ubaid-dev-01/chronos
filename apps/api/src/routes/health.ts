import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import { mongoose } from '@chronos/db';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { getTrafficMetrics, noteActiveUsers } from '../middleware/metrics';
import {
  getActivePresenceCount,
  getSocketClientCount,
} from '../websocket';

export const healthRoutes = Router();

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'not configured' | 'disconnected';

type HealthData = {
  status: 'operational' | 'degraded' | 'major_outage';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  node: string;
  platform: string;
  hostname: string;
  pid: number;
  port: number;
  localIp: string;
  services: {
    name: string;
    status: ServiceStatus;
    latency: number | null;
    detail?: string;
  }[];
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  system: {
    totalMemoryMb: number;
    freeMemoryMb: number;
    usedMemoryMb: number;
    cpuCount: number;
    cpuModel: string;
    loadAvg: number[];
    processCpuPercent: number;
    eventLoopLagMs: number;
  };
  disk: {
    totalGb: number;
    freeGb: number;
    usedPercent: number;
  } | null;
  mongo: {
    status: string;
    latencyMs: number | null;
    dbName: string | null;
  };
  redis: {
    status: string;
    latencyMs: number | null;
  };
  traffic: {
    activeUsers: number;
    peakActiveUsers: number;
    socketClients: number;
    reqPerMin: number;
    totalRequests: number;
    total5xx: number;
  };
  stack: {
    express: string;
    mongoose: string;
    socketio: string;
  };
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

async function sampleProcessCpu(): Promise<number> {
  const startUsage = process.cpuUsage();
  const start = process.hrtime.bigint();
  await new Promise((r) => setTimeout(r, 80));
  const usage = process.cpuUsage(startUsage);
  const elapsedUs = Number(process.hrtime.bigint() - start) / 1000;
  if (elapsedUs <= 0) return 0;
  return Math.round(((usage.user + usage.system) / elapsedUs) * 1000) / 10;
}

async function sampleEventLoopLag(): Promise<number> {
  const start = Date.now();
  await new Promise<void>((resolve) => setImmediate(resolve));
  return Math.max(0, Date.now() - start);
}

async function pingMongo(): Promise<{ status: string; latencyMs: number | null; dbName: string | null }> {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    return {
      status: state === 2 ? 'connecting' : 'disconnected',
      latencyMs: null,
      dbName: mongoose.connection.name || null,
    };
  }
  try {
    const t0 = Date.now();
    await mongoose.connection.db?.admin().ping();
    return {
      status: 'connected',
      latencyMs: Date.now() - t0,
      dbName: mongoose.connection.name || null,
    };
  } catch {
    return { status: 'disconnected', latencyMs: null, dbName: mongoose.connection.name || null };
  }
}

async function pingRedis(): Promise<{ status: string; latencyMs: number | null }> {
  const configured = !!env.REDIS_URL;
  if (!configured) return { status: 'not configured', latencyMs: null };
  try {
    const t0 = Date.now();
    const pong = await Promise.race([
      redis.ping(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]);
    return {
      status: pong === 'PONG' ? 'connected' : 'disconnected',
      latencyMs: Date.now() - t0,
    };
  } catch {
    return { status: 'disconnected', latencyMs: null };
  }
}

async function getDiskStats(): Promise<HealthData['disk']> {
  try {
    // Node 18.15+ / 19.6+
    const stats = await (fs as unknown as { statfs?: (path: string) => Promise<{ bsize: number; blocks: number; bavail: number }> }).statfs?.('.');
    if (!stats || !stats.blocks) return null;
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    const usedPercent = total > 0 ? Math.round(((total - free) / total) * 1000) / 10 : 0;
    return {
      totalGb: Math.round((total / 1024 / 1024 / 1024) * 10) / 10,
      freeGb: Math.round((free / 1024 / 1024 / 1024) * 10) / 10,
      usedPercent,
    };
  } catch {
    return null;
  }
}

export async function getHealthData(): Promise<HealthData> {
  const [processCpuPercent, eventLoopLagMs, mongo, redisStatus, disk] = await Promise.all([
    sampleProcessCpu(),
    sampleEventLoopLag(),
    pingMongo(),
    pingRedis(),
    getDiskStats(),
  ]);

  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const activeUsers = getActivePresenceCount();
  noteActiveUsers(activeUsers);
  const traffic = getTrafficMetrics();
  const socketClients = getSocketClientCount();

  const jwtConfigured = !!env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET.length >= 32;
  const stripeConfigured = !!env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.includes('dummy');
  const s3Configured = !!env.AWS_ACCESS_KEY_ID && !env.AWS_ACCESS_KEY_ID.includes('DUMMY');

  const services: HealthData['services'] = [
    {
      name: 'MongoDB',
      status: mongo.status === 'connected' ? 'operational' : mongo.status === 'connecting' ? 'degraded' : 'down',
      latency: mongo.latencyMs,
      detail: mongo.dbName || undefined,
    },
    {
      name: 'Redis Cache',
      status:
        redisStatus.status === 'connected'
          ? 'operational'
          : redisStatus.status === 'not configured'
            ? 'not configured'
            : 'disconnected',
      latency: redisStatus.latencyMs,
    },
    { name: 'JWT Auth', status: jwtConfigured ? 'operational' : 'not configured', latency: null },
    { name: 'Stripe Billing', status: stripeConfigured ? 'operational' : 'not configured', latency: null },
    { name: 'AWS S3', status: s3Configured ? 'operational' : 'not configured', latency: null },
    { name: 'WebSocket', status: 'operational', latency: null, detail: `${socketClients} clients` },
  ];

  const overallStatus: HealthData['status'] =
    mongo.status !== 'connected'
      ? 'major_outage'
      : services.some((s) => s.status === 'down')
        ? 'degraded'
        : 'operational';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: '0.1.0',
    environment: env.NODE_ENV,
    node: process.version,
    platform: `${os.platform()}/${os.arch()}`,
    hostname: os.hostname(),
    pid: process.pid,
    port: env.PORT,
    localIp: getLocalIp(),
    services,
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
    },
    system: {
      totalMemoryMb: Math.round(totalMem / 1024 / 1024),
      freeMemoryMb: Math.round(freeMem / 1024 / 1024),
      usedMemoryMb: Math.round((totalMem - freeMem) / 1024 / 1024),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
      loadAvg: loadAvg.map((l) => Math.round(l * 100) / 100),
      processCpuPercent,
      eventLoopLagMs,
    },
    disk,
    mongo,
    redis: redisStatus,
    traffic: {
      activeUsers,
      peakActiveUsers: traffic.peakActiveUsers,
      socketClients,
      reqPerMin: traffic.reqPerMin,
      totalRequests: traffic.totalRequests,
      total5xx: traffic.total5xx,
    },
    stack: {
      express: '4.x',
      mongoose: '8.x',
      socketio: '4.8',
    },
  };
}

function statusTone(status: string): string {
  if (status === 'operational' || status === 'connected' || status === 'Running') return '#22c55e';
  if (status === 'degraded' || status === 'connecting' || status === 'not configured' || status === 'disconnected')
    return '#eab308';
  return '#ef4444';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function metricCard(label: string, value: string, sub: string, tone?: string): string {
  return `
    <div class="mcard">
      <div class="mcard-label">${label}</div>
      <div class="mcard-value"${tone ? ` style="color:${tone}"` : ''}>${value}</div>
      <div class="mcard-sub">${sub}</div>
    </div>`;
}

function infoCard(label: string, value: string, sub?: string, tone?: string): string {
  return `
    <div class="icard">
      <div class="icard-label">${label}</div>
      <div class="icard-value"${tone ? ` style="color:${tone}"` : ''}>${value}</div>
      ${sub ? `<div class="icard-sub">${sub}</div>` : ''}
    </div>`;
}

export function renderHealthPage(data: HealthData): string {
  const liveTone = statusTone(data.status === 'operational' ? 'operational' : data.status);
  const started = new Date(Date.now() - data.uptime * 1000).toLocaleString();
  const updated = new Date(data.timestamp).toLocaleTimeString();
  const projectRamPct =
    data.system.totalMemoryMb > 0
      ? Math.round((data.memory.rss / data.system.totalMemoryMb) * 1000) / 10
      : 0;
  const heapPct =
    data.memory.heapTotal > 0
      ? Math.round((data.memory.heapUsed / data.memory.heapTotal) * 100)
      : 0;
  const mongoTone = statusTone(data.mongo.status);
  const redisTone = statusTone(data.redis.status);
  const diskTone =
    data.disk == null ? '#a1a1aa' : data.disk.usedPercent > 90 ? '#ef4444' : data.disk.usedPercent > 75 ? '#eab308' : '#22c55e';

  const logoSvg = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16.5 7.5C15.1 5.9 12.9 5 10.5 5.5C7.5 6.1 5.5 8.8 5.5 11.8C5.5 15.2 8.3 18 11.7 18C14.1 18 16.2 16.7 17.3 14.7" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 8.5V12L14.5 13.5" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chronos · API resource usage</title>
  <meta http-equiv="refresh" content="15" />
  <style>
    :root {
      --brand: #4f46e5;
      --brand-light: #818cf8;
      --brand-glow: rgb(79 70 229 / 0.18);
      --bg: #030303;
      --surface: #0a0a0a;
      --elevated: #141414;
      --hover: #1f1f1f;
      --border: #262626;
      --ink: #e2e8f0;
      --text: #fafafa;
      --muted: #a1a1aa;
      --secondary: #d4d4d8;
      --success: #22c55e;
      --warning: #eab308;
      --danger: #ef4444;
      --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background:
        radial-gradient(900px 420px at 12% -10%, var(--brand-glow), transparent 60%),
        radial-gradient(700px 360px at 100% 0%, rgb(129 140 248 / 0.08), transparent 55%),
        var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.45;
    }
    .shell {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      max-width: 1280px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
    }
    .sidebar {
      background: var(--surface);
      border: 2px solid var(--ink);
      box-shadow: 4px 4px 0 0 var(--ink);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      height: fit-content;
      position: sticky;
      top: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--brand);
      border: 2px solid var(--ink);
      box-shadow: 3px 3px 0 0 var(--ink);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .logo-mark svg { width: 22px; height: 22px; }
    .brand-text h1 {
      font-size: 18px;
      font-weight: 750;
      letter-spacing: -0.02em;
    }
    .brand-text p {
      font-size: 12px;
      color: var(--muted);
      margin-top: 2px;
    }
    .meta {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      word-break: break-all;
    }
    .live-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: color-mix(in srgb, var(--brand) 18%, transparent);
      color: var(--brand-light);
      border: 1px solid color-mix(in srgb, var(--brand) 40%, transparent);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${liveTone};
      box-shadow: 0 0 0 3px color-mix(in srgb, ${liveTone} 25%, transparent);
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    .side-metrics { display: grid; gap: 10px; }
    .mcard, .icard {
      background: var(--elevated);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 14px;
    }
    .mcard-label, .icard-label {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 650;
      margin-bottom: 4px;
    }
    .mcard-value, .icard-value {
      font-family: var(--mono);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .mcard-sub, .icard-sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .main { display: flex; flex-direction: column; gap: 16px; }
    .section {
      background: var(--surface);
      border: 2px solid var(--ink);
      box-shadow: 4px 4px 0 0 var(--ink);
      border-radius: 16px;
      padding: 16px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--brand-light);
      margin-bottom: 12px;
    }
    .grid {
      display: grid;
      gap: 10px;
    }
    .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .grid-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .footer {
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      padding: 8px 0 4px;
    }
    .footer a { color: var(--brand-light); text-decoration: none; }
    @media (max-width: 980px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .grid-6, .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo-mark">${logoSvg}</div>
        <div class="brand-text">
          <h1>Chronos</h1>
          <p>API resource usage</p>
        </div>
      </div>
      <div class="meta">${escapeHtml(data.localIp)} :${data.port} · pid ${data.pid}</div>
      <div class="live-row">
        <span class="live"><span class="live-dot"></span> Live</span>
        <span class="meta">Updated ${escapeHtml(updated)}</span>
      </div>
      <div class="side-metrics">
        ${metricCard('Process CPU', `${data.system.processCpuPercent}`, '% of one core')}
        ${metricCard('Project RAM', `${data.memory.rss} / ${data.system.totalMemoryMb}`, `MB this API / machine (${projectRamPct}%)`)}
        ${metricCard('Heap', `${data.memory.heapUsed} / ${data.memory.heapTotal}`, `MB used / allocated (${heapPct}%)`)}
        ${metricCard('Machine RAM', `${data.system.usedMemoryMb} / ${data.system.totalMemoryMb}`, `${data.system.freeMemoryMb} MB free`)}
        ${metricCard('Active users', `${data.traffic.activeUsers}`, `peak ${data.traffic.peakActiveUsers}`)}
      </div>
    </aside>

    <main class="main">
      <section class="section">
        <div class="section-title">Host</div>
        <div class="grid grid-3">
          ${infoCard('Hostname', escapeHtml(data.hostname), `${escapeHtml(data.platform)} · ${data.system.cpuCount} cores`)}
          ${infoCard('Status', 'Running', `Started ${escapeHtml(started)}`, '#22c55e')}
          ${infoCard('Role / Port', escapeHtml(data.environment), `port ${data.port} · Express + Socket.IO`)}
        </div>
      </section>

      <section class="section">
        <div class="section-title">This API · Resources</div>
        <div class="grid grid-4">
          ${infoCard('Process CPU', `${data.system.processCpuPercent}`, `load ${data.system.loadAvg.join(' / ')}`)}
          ${infoCard('Project RAM', `${data.memory.rss} / ${data.system.totalMemoryMb}`, `MB · ${projectRamPct}% of machine`)}
          ${infoCard('Heap used', `${data.memory.heapUsed} / ${data.memory.heapTotal}`, 'MB used / allocated')}
          ${infoCard('Machine RAM', `${data.system.usedMemoryMb} / ${data.system.totalMemoryMb}`, `${data.system.freeMemoryMb} MB free`)}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Process</div>
        <div class="grid grid-3">
          ${infoCard('Uptime', formatUptime(data.uptime), `Host ${formatUptime(Math.round(os.uptime()))}`)}
          ${infoCard('Event-loop lag', `${data.system.eventLoopLagMs.toFixed(1)} ms`, 'Sampled every refresh')}
          ${infoCard('Process ID', `${data.pid}`, `Node ${escapeHtml(data.node)}`)}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Data · Cache · Disk</div>
        <div class="grid grid-3">
          ${infoCard(
            'MongoDB',
            escapeHtml(data.mongo.status),
            data.mongo.latencyMs != null
              ? `Ping ${data.mongo.latencyMs} ms${data.mongo.dbName ? ` · ${escapeHtml(data.mongo.dbName)}` : ''}`
              : data.mongo.dbName || 'No ping',
            mongoTone
          )}
          ${infoCard(
            'Redis',
            escapeHtml(data.redis.status),
            data.redis.latencyMs != null
              ? `Ping ${data.redis.latencyMs} ms`
              : data.redis.status === 'disconnected'
                ? 'Unreachable — degraded ok'
                : 'Optional cache',
            redisTone
          )}
          ${infoCard(
            'Disk',
            data.disk ? `${data.disk.usedPercent}%` : 'n/a',
            data.disk
              ? `${data.disk.freeGb} GB free of ${data.disk.totalGb} GB`
              : 'statfs unavailable on this host',
            diskTone
          )}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Stack · Traffic</div>
        <div class="grid grid-6">
          ${infoCard('Express', data.stack.express, `Node ${escapeHtml(data.node)}`)}
          ${infoCard('Mongoose', data.stack.mongoose, 'ODM')}
          ${infoCard('Socket.IO', `v${data.stack.socketio}`, `${data.traffic.socketClients} clients`)}
          ${infoCard('Active users', `${data.traffic.activeUsers}`, `peak ${data.traffic.peakActiveUsers}`)}
          ${infoCard('Req / min', `${data.traffic.reqPerMin}`, `Total ${data.traffic.totalRequests}`)}
          ${infoCard('5xx errors', `${data.traffic.total5xx}`, 'Since boot', data.traffic.total5xx > 0 ? '#ef4444' : '#22c55e')}
        </div>
      </section>

      <div class="footer">
        Chronos API v${data.version} ·
        <a href="/v1/health/json">JSON</a> ·
        <a href="${escapeHtml(env.APP_URL)}">Open Dashboard</a>
      </div>
    </main>
  </div>
</body>
</html>`;
}

export async function sendHealthResponse(req: Request, res: Response) {
  const data = await getHealthData();
  const httpStatus = data.status === 'major_outage' ? 503 : 200;
  const accept = req.headers.accept || '';
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return res.status(httpStatus).json(data);
  }
  return res.status(httpStatus).type('html').send(renderHealthPage(data));
}

healthRoutes.get('/json', async (_req, res) => {
  const data = await getHealthData();
  const httpStatus = data.status === 'major_outage' ? 503 : 200;
  res.status(httpStatus).json(data);
});

healthRoutes.get('/', sendHealthResponse);
