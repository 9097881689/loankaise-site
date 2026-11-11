import { AUTH_COOKIE_NAME } from '../lib/auth.js';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:';
  const expiredCookie = `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps ? '; Secure' : ''}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/admin/login', request.url).toString(),
      'Set-Cookie': expiredCookie,
      'Cache-Control': 'no-store',
    },
  });
}
