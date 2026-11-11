/**
 * LoanKaise.in — Edge Data Store (Static Manifest + Optional Cloudflare D1 + Optional GitHub API)
 */

export const FINANCE_SOURCES_META = [
  { id: 'moneycontrol', name: 'Moneycontrol', url: 'https://www.moneycontrol.com/rss/MCtopnews.xml', category: 'business' },
  { id: 'etmoney', name: 'ETMoney', url: 'https://www.etmoney.com/learn/feed/', category: 'personal-finance' },
  { id: 'yahoo-finance', name: 'Yahoo Finance', url: 'https://news.google.com/rss/search?q=site:finance.yahoo.com&hl=en-IN&gl=IN&ceid=IN:en', category: 'markets' },
  { id: 'economic-times', name: 'Economic Times', url: 'https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms', category: 'personal-finance' },
  { id: 'livemint', name: 'Livemint', url: 'https://www.livemint.com/rss/money', category: 'personal-finance' },
  { id: 'business-standard', name: 'Business Standard', url: 'https://www.business-standard.com/rss/finance-103.rss', category: 'banking-rbi' },
  { id: 'cnbctv18', name: 'CNBC-TV18', url: 'https://www.cnbctv18.com/commonfeeds/v1/cne/rss/personal-finance.xml', category: 'loans-emi' },
  { id: 'ndtv-profit', name: 'NDTV Profit', url: 'https://feeds.feedburner.com/ndtvprofit-latest', category: 'business' },
  { id: 'financial-express', name: 'Financial Express', url: 'https://news.google.com/rss/search?q=site:financialexpress.com+finance+OR+loan+OR+bank&hl=en-IN&gl=IN&ceid=IN:en', category: 'banking-rbi' },
  { id: 'finshots-rbi', name: 'Finshots & RBI', url: 'https://finshots.in/rss/', category: 'banking-rbi' },
];

export const CATEGORY_LABELS = {
  'banking-rbi': 'बैंकिंग & RBI',
  'loans-emi': 'लोन & EMI',
  'markets': 'शेयर बाज़ार & गोल्ड',
  'personal-finance': 'पर्सनल फाइनेंस',
  'mutual-funds': 'म्यूचुअल फंड & SIP',
  'tax-saving': 'टैक्स & बचत',
  'business': 'बिज़नेस & इकोनॉमी',
  'loan-guide': 'Banking Guide',
};

const memoryPosts = [];
const deletedSlugs = new Set();
const memoryLogs = [];

export async function ensureD1Schema(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        title TEXT,
        subtitle TEXT,
        excerpt TEXT,
        content TEXT,
        category TEXT,
        category_label TEXT,
        featured_image TEXT,
        author_name TEXT,
        published_at TEXT,
        source_url TEXT,
        indexed_in_google INTEGER DEFAULT 1
      )
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS index_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        url TEXT,
        status TEXT,
        status_code INTEGER,
        response_message TEXT,
        timestamp TEXT
      )
    `).run();
  } catch {
    // ignore schema errors
  }
}

export async function loadAllPosts(request, env = {}) {
  let manifestPosts = [];
  try {
    if (env.ASSETS) {
      const assetUrl = new URL('/data/posts-manifest.json', request.url);
      const res = await env.ASSETS.fetch(new Request(assetUrl));
      if (res.ok) {
        manifestPosts = await res.json();
      }
    }
  } catch {
    manifestPosts = [];
  }

  let d1Posts = [];
  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      const { results } = await env.DB.prepare(
        `SELECT id, slug, title, subtitle, category, category_label, featured_image, author_name, published_at, indexed_in_google FROM posts ORDER BY published_at DESC`
      ).all();
      d1Posts = (results || []).map((r) => ({
        id: r.id,
        slug: r.slug,
        url: `/news/${r.slug}/`,
        title: r.title,
        subtitle: r.subtitle || '',
        category: r.category || 'personal-finance',
        categoryLabel: r.category_label || CATEGORY_LABELS[r.category] || 'फाइनेंस न्यूज़',
        featuredImage: r.featured_image || '/assets/favicon.png',
        authorName: r.author_name || 'राहुल शर्मा',
        publishedAt: r.published_at,
        indexedInGoogle: Boolean(r.indexed_in_google),
      }));
    } catch {
      d1Posts = [];
    }
  }

  const bySlug = new Map();
  for (const p of [...d1Posts, ...memoryPosts, ...manifestPosts]) {
    if (!p || !p.slug || deletedSlugs.has(p.slug)) continue;
    if (!bySlug.has(p.slug)) {
      bySlug.set(p.slug, p);
    }
  }

  return [...bySlug.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getD1PostBySlug(slug, env = {}) {
  const mem = memoryPosts.find((p) => p.slug === slug);
  if (mem) return mem;
  if (!env.DB) return null;
  try {
    await ensureD1Schema(env.DB);
    return await env.DB.prepare('SELECT * FROM posts WHERE slug = ? LIMIT 1').bind(slug).first();
  } catch {
    return null;
  }
}

export async function savePostEdge(post, env = {}) {
  const normalized = {
    id: post.id || `lk-${Date.now()}`,
    slug: post.slug,
    url: `/news/${post.slug}/`,
    title: post.title,
    subtitle: post.subtitle || '',
    excerpt: post.excerpt || post.subtitle || post.title,
    content: post.content || '',
    category: post.category || 'personal-finance',
    categoryLabel: post.categoryLabel || CATEGORY_LABELS[post.category] || 'फाइनेंस न्यूज़',
    featuredImage: post.featuredImage || '/assets/favicon.png',
    authorName: post.authorName || post.author?.name || 'राहुल शर्मा',
    publishedAt: post.publishedAt || new Date().toISOString(),
    sourceUrl: post.sourceUrl || '',
    indexedInGoogle: true,
  };

  deletedSlugs.delete(normalized.slug);
  memoryPosts.unshift(normalized);

  let persistedTo = 'edge-memory';
  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      await env.DB.prepare(`
        INSERT OR REPLACE INTO posts (id, slug, title, subtitle, excerpt, content, category, category_label, featured_image, author_name, published_at, source_url, indexed_in_google)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `)
        .bind(
          normalized.id,
          normalized.slug,
          normalized.title,
          normalized.subtitle,
          normalized.excerpt,
          normalized.content,
          normalized.category,
          normalized.categoryLabel,
          normalized.featuredImage,
          normalized.authorName,
          normalized.publishedAt,
          normalized.sourceUrl
        )
        .run();
      persistedTo = 'cloudflare-d1';
    } catch {
      // keep memory fallback
    }
  }

  await recordIndexLog(
    {
      action: 'URL_UPDATED',
      url: `https://loankaise.in/news/${normalized.slug}/`,
      status: 'SUCCESS',
      statusCode: 200,
      responseMessage: `Saved (${persistedTo}) & queued for Google Indexing`,
    },
    env
  );

  return { post: normalized, persistedTo };
}

export async function deletePostEdge(idOrSlug, env = {}) {
  deletedSlugs.add(idOrSlug);
  for (let i = memoryPosts.length - 1; i >= 0; i--) {
    if (memoryPosts[i].id === idOrSlug || memoryPosts[i].slug === idOrSlug) {
      deletedSlugs.add(memoryPosts[i].slug);
      memoryPosts.splice(i, 1);
    }
  }
  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      await env.DB.prepare('DELETE FROM posts WHERE id = ? OR slug = ?').bind(idOrSlug, idOrSlug).run();
    } catch {}
  }
  return true;
}

export async function recordIndexLog(log, env = {}) {
  const entry = {
    action: log.action || 'URL_UPDATED',
    url: log.url,
    status: log.status || 'SUCCESS',
    statusCode: log.statusCode || 200,
    responseMessage: log.responseMessage || 'OK',
    timestamp: new Date().toISOString(),
  };
  memoryLogs.unshift(entry);
  if (memoryLogs.length > 50) memoryLogs.length = 50;

  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      await env.DB.prepare(
        `INSERT INTO index_logs (action, url, status, status_code, response_message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(entry.action, entry.url, entry.status, entry.statusCode, entry.responseMessage, entry.timestamp)
        .run();
    } catch {}
  }
}

export async function loadIndexLogs(env = {}) {
  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      const { results } = await env.DB.prepare(
        `SELECT action, url, status, status_code as statusCode, response_message as responseMessage, timestamp FROM index_logs ORDER BY id DESC LIMIT 30`
      ).all();
      if (results && results.length > 0) return results;
    } catch {}
  }
  return memoryLogs;
}
