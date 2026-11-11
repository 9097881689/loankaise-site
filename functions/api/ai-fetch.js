import { isAuthenticated } from '../lib/auth.js';
import { savePostEdge } from '../lib/store.js';
import { fetchExternalArticleContext, rewriteFinanceStoryHindi } from '../lib/edge-ai.js';

export async function onRequestPost({ request, env }) {
  if (!isAuthenticated(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const input = String(body.url || '').trim();
  const category = body.category ? String(body.category).trim() : '';
  const hint = body.hint ? String(body.hint).trim() : '';
  const autoPublish = Boolean(body.autoPublish);
  const geminiApiKey = body.geminiApiKey || env.GEMINI_API_KEY || '';
  const serviceAccountJson = body.serviceAccountJson || env.GOOGLE_SERVICE_ACCOUNT_JSON || '';

  if (!input) {
    return Response.json({ success: false, error: 'Please enter a finance news URL or topic.' }, { status: 400 });
  }

  if (!geminiApiKey) {
    return Response.json(
      {
        success: false,
        error:
          'GEMINI_API_KEY is not configured in Cloudflare Pages Environment Variables yet. Add GEMINI_API_KEY in Cloudflare Dashboard > loankaise > Settings > Environment variables.',
      },
      { status: 503 }
    );
  }

  try {
    let sourcesText = `Topic / Breaking Query: ${input}`;
    const isUrl = /^https?:\/\//i.test(input);
    if (isUrl) {
      const ctx = await fetchExternalArticleContext(input);
      sourcesText = `Source URL Reference (strip branding in output):\nTitle: ${ctx.title}\nSummary: ${ctx.description}\nDetails:\n${ctx.body || input}`;
    }

    const post = await rewriteFinanceStoryHindi({
      sourcesText,
      categoryOverride: category || undefined,
      hint,
      apiKey: geminiApiKey,
    });

    if (isUrl) post.sourceUrl = input;
    post.serviceAccountJson = serviceAccountJson;

    if (autoPublish) {
      const { persistedTo } = await savePostEdge(post, env);
      return Response.json({
        success: true,
        url: `/news/${post.slug}/`,
        persistedTo,
        post,
      });
    }

    return Response.json({ success: true, post });
  } catch (err) {
    return Response.json(
      { success: false, error: `AI Fetch failed: ${err.message}` },
      { status: 500 }
    );
  }
}
