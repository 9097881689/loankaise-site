import { isAuthenticated } from '../lib/auth.js';
import { loadAllPosts, loadIndexLogs } from '../lib/store.js';
import { renderDashboardHtml } from '../lib/admin-ui.js';

export async function onRequestGet({ request, env }) {
  if (!isAuthenticated(request, env)) {
    const loginUrl = new URL('/admin/login', request.url);
    return Response.redirect(loginUrl.toString(), 302);
  }

  const [posts, logs] = await Promise.all([
    loadAllPosts(request, env),
    loadIndexLogs(env),
  ]);

  const html = renderDashboardHtml({
    posts,
    logs,
    hasD1: Boolean(env.DB),
    hasGemini: Boolean(env.GEMINI_API_KEY),
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
