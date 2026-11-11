import { isAuthenticated } from '../lib/auth.js';
import { loadAllPosts, deletePostEdge } from '../lib/store.js';

export async function onRequestGet({ request, env }) {
  const posts = await loadAllPosts(request, env);
  return Response.json(
    { success: true, total: posts.length, posts },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function onRequestDelete({ request, env }) {
  if (!isAuthenticated(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const idOrSlug = body.id || body.slug;
  if (!idOrSlug) {
    return Response.json({ success: false, error: 'Missing story id or slug' }, { status: 400 });
  }

  await deletePostEdge(String(idOrSlug), env);
  return Response.json({ success: true, deleted: idOrSlug });
}
