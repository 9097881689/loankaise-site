import { isAuthenticated } from '../lib/auth.js';
import { FINANCE_SOURCES_META, loadAllPosts, savePostEdge } from '../lib/store.js';
import { parseRssItems, rewriteFinanceStoryHindi } from '../lib/edge-ai.js';

function tokenize(str = '') {
  return new Set(
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function similarity(a, b) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit++;
  return hit / (a.size + b.size - hit);
}

export async function onRequestPost({ request, env }) {
  if (!isAuthenticated(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await loadAllPosts(request, env);
  const existingUrls = new Set(existing.map((p) => p.sourceUrl).filter(Boolean));
  const existingTokens = existing.slice(0, 40).map((p) => tokenize(`${p.title} ${p.slug}`));

  const feedResults = await Promise.allSettled(
    FINANCE_SOURCES_META.map(async (src) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(src.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoanKaiseBot/1.0)' },
      });
      clearTimeout(t);
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRssItems(xml, src.name);
    })
  );

  const allItems = [];
  let activeFeeds = 0;
  for (const r of feedResults) {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      activeFeeds++;
      allItems.push(...r.value);
    }
  }

  allItems.sort((a, b) => b.pubMs - a.pubMs);

  // Cluster overlapping topics across multiple sources so duplicates are merged
  const clusters = [];
  for (const item of allItems) {
    if (existingUrls.has(item.link)) continue;
    const tok = tokenize(item.title);
    if (existingTokens.some((et) => similarity(tok, et) >= 0.4)) continue;

    const match = clusters.find((cl) => similarity(tok, cl.tokens) >= 0.3);
    if (match) {
      if (!match.items.some((x) => x.sourceSite === item.sourceSite)) {
        match.items.push(item);
      }
    } else {
      clusters.push({ tokens: tok, items: [item], pubMs: item.pubMs });
    }
  }

  if (!env.GEMINI_API_KEY) {
    return Response.json({
      success: true,
      createdCount: 0,
      scannedFeeds: activeFeeds,
      candidateClusters: clusters.length,
      message: `Scanned ${activeFeeds}/10 Finance feeds (${clusters.length} unique clusters ready). Auto-posting runs via 5-min cron & GitHub deploy; bind GEMINI_API_KEY in Cloudflare Pages to also run 1-click Edge rewriting from /admin.`,
    });
  }

  let createdCount = 0;
  for (const cl of clusters.slice(0, 2)) {
    try {
      const sourcesText = cl.items
        .slice(0, 3)
        .map((it, idx) => `Source ${idx + 1}: ${it.title}\nDetails: ${it.description}`)
        .join('\n\n---\n\n');

      const post = await rewriteFinanceStoryHindi({
        sourcesText,
        apiKey: env.GEMINI_API_KEY,
      });
      post.sourceUrl = cl.items[0].link;
      await savePostEdge(post, env);
      createdCount++;
    } catch {
      // continue to next cluster
    }
  }

  return Response.json({
    success: true,
    createdCount,
    scannedFeeds: activeFeeds,
    candidateClusters: clusters.length,
    message: `Scanned ${activeFeeds}/10 sources, merged ${clusters.length} unique finance topics, and published ${createdCount} new Hindi story(s).`,
  });
}
