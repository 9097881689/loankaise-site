/**
 * LoanKaise.in — Live Stock Market Alert & Global Radar Edge API
 * Fetches real-time Nifty 50, Sensex, Bank Nifty, Gold, Nasdaq, S&P 500, USD/INR
 * + Breaking stock/market surge, drop & global cues every 60s at Cloudflare Edge.
 */

const SYMBOLS = [
  { sym: '^NSEI', label: 'NIFTY 50', group: 'IN', unit: '' },
  { sym: '^BSESN', label: 'SENSEX', group: 'IN', unit: '' },
  { sym: '^NSEBANK', label: 'BANK NIFTY', group: 'IN', unit: '' },
  { sym: 'GC=F', label: 'GOLD', group: 'COMMODITY', unit: '$' },
  { sym: '^IXIC', label: 'NASDAQ', group: 'GLOBAL', unit: '' },
  { sym: '^GSPC', label: 'S&P 500', group: 'GLOBAL', unit: '' },
  { sym: 'USDINR=X', label: 'USD/INR', group: 'FX', unit: '₹' },
];

const RADAR_FEEDS = [
  'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
  'https://www.livemint.com/rss/markets',
  'https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml',
];

function cleanText(s = '') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchQuote(item) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.sym)}?range=1d&interval=5m`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoanKaiseBot/1.0)' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    const prev = Number(meta?.chartPreviousClose || meta?.previousClose || price);
    if (!price || Number.isNaN(price)) return null;
    const change = price - prev;
    const pct = prev ? (change / prev) * 100 : 0;
    return {
      sym: item.sym,
      label: item.label,
      group: item.group,
      unit: item.unit,
      price,
      change,
      pct,
    };
  } catch {
    return null;
  }
}

async function fetchRadarHeadlines() {
  const results = await Promise.allSettled(
    RADAR_FEEDS.map(async (u) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(u, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoanKaiseBot/1.0)' },
      });
      clearTimeout(t);
      if (!res.ok) return [];
      const xml = await res.text();
      const items = [];
      for (const m of [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 4)) {
        const title = cleanText((m[1].match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
        if (title) items.push(title);
      }
      return items;
    })
  );

  const combined = [];
  const seen = new Set();
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const t of r.value) {
        const k = t.toLowerCase().slice(0, 42);
        if (!seen.has(k)) {
          seen.add(k);
          combined.push(t);
        }
      }
    }
  }
  return combined.slice(0, 5);
}

function buildHindiAlert(quotes, radarHeadlines, manifestPosts) {
  const bigMoves = quotes
    .filter((q) => Math.abs(q.pct) >= 0.7)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  const alerts = [];

  for (const q of bigMoves.slice(0, 3)) {
    if (q.pct > 0) {
      alerts.push({
        type: 'surge',
        badge: '🚀 तेज़ी अलर्ट',
        text: `${q.label} में +${q.pct.toFixed(2)}% का बड़ा उछाल (${q.unit}${q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`,
        href: '/news/',
      });
    } else {
      alerts.push({
        type: 'drop',
        badge: '🔻 गिरावट अलर्ट',
        text: `${q.label} ${q.pct.toFixed(2)}% टूटा (${q.unit}${q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`,
        href: '/news/',
      });
    }
  }

  // Global Market Watch
  const nasdaq = quotes.find((q) => q.sym === '^IXIC');
  const sp500 = quotes.find((q) => q.sym === '^GSPC');
  const gold = quotes.find((q) => q.sym === 'GC=F');
  if (nasdaq || gold) {
    const parts = [];
    if (nasdaq) parts.push(`NASDAQ ${nasdaq.pct >= 0 ? '+' : ''}${nasdaq.pct.toFixed(2)}%`);
    if (sp500) parts.push(`S&P 500 ${sp500.pct >= 0 ? '+' : ''}${sp500.pct.toFixed(2)}%`);
    if (gold) parts.push(`Gold $${gold.price.toFixed(0)} (${gold.pct >= 0 ? '+' : ''}${gold.pct.toFixed(2)}%)`);
    alerts.push({
      type: 'global',
      badge: '🌍 ग्लोबल बाज़ार',
      text: parts.join(' • '),
      href: '/news/',
    });
  }

  // Add latest Hindi market news from our own published manifest
  const marketPosts = (manifestPosts || [])
    .filter((p) => !p.isLegacyGuide && (p.category === 'markets' || p.category === 'mutual-funds' || p.category === 'business'))
    .slice(0, 3);

  for (const p of marketPosts) {
    alerts.push({
      type: 'news',
      badge: '👀 बाज़ार पर नज़र',
      text: p.title,
      href: p.url || `/news/${p.slug}/`,
    });
  }

  for (const h of radarHeadlines.slice(0, 2)) {
    alerts.push({
      type: 'radar',
      badge: '⚡ मार्केट रडार',
      text: h,
      href: '/news/',
    });
  }

  return alerts;
}

export async function onRequestGet({ request, env }) {
  let manifestPosts = [];
  try {
    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(new Request(new URL('/data/posts-manifest.json', request.url)));
      if (res.ok) manifestPosts = await res.json();
    }
  } catch {}

  const [quoteResults, radarHeadlines] = await Promise.all([
    Promise.all(SYMBOLS.map(fetchQuote)),
    fetchRadarHeadlines(),
  ]);

  const quotes = quoteResults.filter(Boolean);
  const alerts = buildHindiAlert(quotes, radarHeadlines, manifestPosts);

  const primaryTone =
    quotes[0]?.pct <= -0.6 ? 'drop' : quotes[0]?.pct >= 0.6 ? 'surge' : 'neutral';

  return Response.json(
    {
      success: true,
      updatedAt: new Date().toISOString(),
      tone: primaryTone,
      quotes,
      alerts,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
