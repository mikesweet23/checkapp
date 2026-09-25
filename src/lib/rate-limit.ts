/**
 * Small in-memory sliding-window limiter. On serverless hosting each instance
 * keeps its own window, so this slows down abuse rather than guaranteeing a
 * global limit; the attempts route also caps submissions per email in the database.
 */
const windows = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (windows.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) {
    windows.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  windows.set(key, recent);
  if (windows.size > 5000) {
    for (const [candidate, timestamps] of windows) if (!timestamps.some((timestamp) => now - timestamp < windowMs)) windows.delete(candidate);
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
