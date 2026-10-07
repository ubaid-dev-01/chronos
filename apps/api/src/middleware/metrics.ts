/** Lightweight in-process request / error counters for the health dashboard. */

const startedAt = Date.now();
let totalRequests = 0;
let total5xx = 0;
const recentTimestamps: number[] = [];
let peakActiveUsers = 0;

export function trackRequest(statusCode: number) {
  totalRequests += 1;
  if (statusCode >= 500) total5xx += 1;
  const now = Date.now();
  recentTimestamps.push(now);
  // Keep ~2 minutes of samples for req/min
  while (recentTimestamps.length && now - recentTimestamps[0]! > 120_000) {
    recentTimestamps.shift();
  }
}

export function noteActiveUsers(count: number) {
  if (count > peakActiveUsers) peakActiveUsers = count;
}

export function getTrafficMetrics() {
  const now = Date.now();
  const lastMinute = recentTimestamps.filter((t) => now - t <= 60_000).length;
  return {
    totalRequests,
    total5xx,
    reqPerMin: lastMinute,
    peakActiveUsers,
    startedAt,
  };
}

export function metricsMiddleware(
  _req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) {
  res.on('finish', () => trackRequest(res.statusCode));
  next();
}
