import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_VALUE,
  isAuthenticated,
  verifyAdminCredentials,
  checkLoginLockout,
  recordFailedAttempt,
  resetLoginAttempts,
} from '../lib/auth.js';
import { renderLoginHtml } from '../lib/admin-ui.js';

function getClientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

export async function onRequestGet({ request, env }) {
  if (isAuthenticated(request, env)) {
    return Response.redirect(new URL('/admin', request.url).toString(), 302);
  }

  const ip = getClientIp(request);
  const lockoutStatus = await checkLoginLockout(ip, env);
  const html = renderLoginHtml({ lockoutStatus });

  return new Response(html, {
    status: lockoutStatus.isLocked ? 423 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function onRequestPost({ request, env }) {
  const ip = getClientIp(request);
  const lockoutStatus = await checkLoginLockout(ip, env);

  if (lockoutStatus.isLocked) {
    const html = renderLoginHtml({ lockoutStatus });
    return new Response(html, {
      status: 423,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  let username = '';
  let password = '';
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    username = body.username || '';
    password = body.password || '';
  } else {
    const form = await request.formData();
    username = String(form.get('username') || '');
    password = String(form.get('password') || '');
  }

  if (verifyAdminCredentials(username, password, env)) {
    await resetLoginAttempts(ip, env);
    const url = new URL(request.url);
    const isHttps = url.protocol === 'https:';
    const cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(AUTH_TOKEN_VALUE)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${isHttps ? '; Secure' : ''}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL('/admin', request.url).toString(),
        'Set-Cookie': cookie,
        'Cache-Control': 'no-store',
      },
    });
  }

  const attempt = await recordFailedAttempt(ip, env);
  const updatedLockout = await checkLoginLockout(ip, env);

  const html = renderLoginHtml({
    lockoutStatus: updatedLockout,
    errorMessage: attempt.isLocked
      ? 'Too many incorrect attempts. Account locked for 24 hours.'
      : 'Invalid login ID or password.',
    warningMessage: attempt.isLocked
      ? ''
      : `Remaining attempts before 24-hour lockout: ${attempt.remainingAttempts}`,
  });

  return new Response(html, {
    status: attempt.isLocked ? 423 : 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
