import { isAuthenticated } from '../lib/auth.js';
import { CATEGORY_LABELS, savePostEdge } from '../lib/store.js';
import { slugifyEnglish, pickLogoFreeImage } from '../lib/edge-ai.js';

export async function onRequestPost({ request, env }) {
  if (!isAuthenticated(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const category = CATEGORY_LABELS[body.category] ? body.category : 'personal-finance';

  if (!title || !content) {
    return Response.json(
      { success: false, error: 'Title and full Hindi article content are required.' },
      { status: 400 }
    );
  }

  const slug = body.slug ? String(body.slug).trim() : slugifyEnglish(body.englishSlug || title);
  const formattedContent = content.includes('<p>')
    ? content
    : content
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join('\n');

  let featuredImage = String(body.featuredImage || '').trim();
  if (!featuredImage) {
    featuredImage = pickLogoFreeImage(category, slug);
  }

  const { post, persistedTo } = await savePostEdge(
    {
      id: `lk-manual-${Date.now()}`,
      slug,
      title,
      subtitle: String(body.subtitle || body.excerpt || '').trim(),
      excerpt: String(body.excerpt || body.subtitle || title).trim().slice(0, 180),
      content: formattedContent,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      featuredImage,
      authorName: String(body.authorName || 'राहुल शर्मा').trim(),
      publishedAt: new Date().toISOString(),
    },
    env
  );

  return Response.json({
    success: true,
    url: `/news/${post.slug}/`,
    persistedTo,
    post,
  });
}
