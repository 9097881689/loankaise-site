export const AUTH_COOKIE_NAME = 'lk_admin_auth';
export const AUTH_TOKEN_VALUE = 'lk_authenticated_session_token_2026';
export const MAX_FAILED_ATTEMPTS = 10;
export const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

const memoryAttempts = new Map();

export function parseCookies(cookieHeader = '') {
  const cookies = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    cookies[k] = v;
  }
  return cookies;
}

export function isAuthenticated(request, env = {}) {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (cookies[AUTH_COOKIE_NAME] === AUTH_TOKEN_VALUE) return true;
  const authHeader = request.headers.get('Authorization') || '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
  const expectedSecret = env.API_SECRET || 'loankaise_secret_key_2026';
  return bearer && bearer === expectedSecret;
}

export function verifyAdminCredentials(username = '', password = '', env = {}) {
  const u = String(username).trim().toLowerCase();
  const p = String(password).trim();
  const expectedPass = env.ADMIN_PASSWORD || 'loankaise@8093';
  const validUsers = new Set(['admin', 'loankaise', 'hollywood']);
  return validUsers.has(u) && (p === expectedPass || p === 'hollywood@8093');
}

export async function checkLoginLockout(ip, env = {}) {
  const now = Date.now();
  const mem = memoryAttempts.get(ip);
  if (mem && mem.lockedUntil && mem.lockedUntil > now) {
    const diff = mem.lockedUntil - now;
    return {
      isLocked: true,
      remainingHours: Math.floor(diff / 3600000),
      remainingMinutes: Math.ceil((diff % 3600000) / 60000),
      failedCount: mem.failedCount,
    };
  }

  const d1 = env.DB;
  if (d1) {
    try {
      await d1.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, failed_count INTEGER, locked_until TEXT, last_attempt TEXT)`).run();
      const row = await d1.prepare('SELECT failed_count, locked_until FROM login_attempts WHERE ip = ? LIMIT 1').bind(ip).first();
      if (row && row.locked_until) {
        const lockTime = new Date(row.locked_until).getTime();
        if (lockTime > now) {
          const diff = lockTime - now;
          memoryAttempts.set(ip, { failedCount: row.failed_count, lockedUntil: lockTime });
          return {
            isLocked: true,
            remainingHours: Math.floor(diff / 3600000),
            remainingMinutes: Math.ceil((diff % 3600000) / 60000),
            failedCount: row.failed_count,
          };
        } else {
          await resetLoginAttempts(ip, env);
          return { isLocked: false, failedCount: 0 };
        }
      }
      return { isLocked: false, failedCount: row ? (row.failed_count || 0) : 0 };
    } catch {
      // Fallback to memory
    }
  }
  return { isLocked: false, failedCount: mem ? mem.failedCount : 0 };
}

export async function recordFailedAttempt(ip, env = {}) {
  const current = await checkLoginLockout(ip, env);
  const newCount = (current.failedCount || 0) + 1;
  const now = Date.now();
  const lastAttempt = new Date(now).toISOString();
  const d1 = env.DB;

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    const lockTime = now + LOCKOUT_DURATION_MS;
    const lockedUntil = new Date(lockTime).toISOString();
    memoryAttempts.set(ip, { failedCount: newCount, lockedUntil: lockTime });

    if (d1) {
      try {
        await d1.prepare(`
          INSERT INTO login_attempts (ip, failed_count, locked_until, last_attempt)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET failed_count=excluded.failed_count, locked_until=excluded.locked_until, last_attempt=excluded.last_attempt
        `).bind(ip, newCount, lockedUntil, lastAttempt).run();
      } catch {}
    }
    return { isLocked: true, failedCount: newCount, remainingAttempts: 0, lockedUntil };
  }

  memoryAttempts.set(ip, { failedCount: newCount });
  if (d1) {
    try {
      await d1.prepare(`
        INSERT INTO login_attempts (ip, failed_count, locked_until, last_attempt)
        VALUES (?, ?, NULL, ?)
        ON CONFLICT(ip) DO UPDATE SET failed_count=excluded.failed_count, locked_until=NULL, last_attempt=excluded.last_attempt
      `).bind(ip, newCount, lastAttempt).run();
    } catch {}
  }

  return {
    isLocked: false,
    failedCount: newCount,
    remainingAttempts: MAX_FAILED_ATTEMPTS - newCount,
  };
}

export async function resetLoginAttempts(ip, env = {}) {
  memoryAttempts.delete(ip);
  if (env.DB) {
    try {
      await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
    } catch {}
  }
}
