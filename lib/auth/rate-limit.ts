type LimitEntry = {
  failures: number;
  windowStart: number;
  blockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;

const globalForLimit = globalThis as unknown as {
  __tkaLoginLimits?: Map<string, LimitEntry>;
};

const limits =
  globalForLimit.__tkaLoginLimits ??
  (globalForLimit.__tkaLoginLimits = new Map<string, LimitEntry>());

function entryFor(key: string) {
  const now = Date.now();
  let entry = limits.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { failures: 0, windowStart: now, blockedUntil: 0 };
    limits.set(key, entry);
  }
  return entry;
}

export function checkLoginLimit(key: string) {
  const now = Date.now();
  const entry = entryFor(key);
  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(key: string) {
  const entry = entryFor(key);
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    entry.blockedUntil = Date.now() + BLOCK_MS;
  }
}

export function clearLoginLimit(key: string) {
  limits.delete(key);
}
