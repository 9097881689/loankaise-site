/**
 * LoanKaise.in — Real-Time 1-Min Stock Market Alert & Global Radar Edge API
 * Serves live NSE/BSE/Global Indices (Sensex, Nifty 50, Bank Nifty, FinNifty, India VIX, Gold, Silver, Crude, Nasdaq, S&P 500, Bitcoin, USD/INR)
 * + Surge/Drop Hindi Alerts & Market Radar (strictly separate from top TRENDING news).
 */

const SYMBOLS = [
  { sym: '^BSESN', label: 'SENSEX', group: 'IN', unit: '' },
  { sym: '^NSEI', label: 'NIFTY 50', group: 'IN', unit: '' },
  { sym: '^NSEBANK', label: 'BANK NIFTY', group: 'IN', unit: '' },
  { sym: 'NIFTY_FIN_SERVICE.NS', label: 'FINNIFTY', group: 'IN', unit: '' },
  { sym: '^INDIAVIX', label: 'INDIA VIX', group: 'IN', unit: '' },
  { sym: 'GC=F', label: 'GOLD', group: 'COMMODITY', unit: '$' },
  { sym: 'SI=F', label: 'SILVER', group: 'COMMODITY', unit: '$' },
  { sym: 'CL=F', label: 'CRUDE OIL', group: 'COMMODITY', unit: '$' },
  { sym: '^IXIC', label: 'NASDAQ', group: 'GLOBAL', unit: '' },
  { sym: '^GSPC', label: 'S&P 500', group: 'GLOBAL', unit: '' },
  { sym: 'BTC-USD', label: 'BITCOIN', group: 'CRYPTO', unit: '$' },
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
    const bust = Date.now();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.sym)}?range=1d&interval=1m&_=${bust}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(url, {
      signal: ctrl.signal,
      cf: { cacheTtl: 0, cacheEverything: false },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LoanKaiseBot/1.0)',
        'Cache-Control': 'no-cache',
      },
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
        cf: { cacheTtl: 120 },
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
        const k = t.toLowerCase().slice(0, 40);
        if (!seen.has(k)) {
          seen.add(k);
          combined.push(t);
        }
      }
    }
  }
  return combined.slice(0, 5);
}

function buildHindiAlert(quotes, radarHeadlines) {
  const bigMoves = quotes
    .filter((q) => Math.abs(q.pct) >= 0.45)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  const alerts = [];

  for (const q of bigMoves.slice(0, 3)) {
    const valStr = `${q.unit}${q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    if (q.pct > 0) {
      alerts.push({
        type: 'surge',
        badge: '🚀 तेज़ी अलर्ट',
        text: `${q.label} +${q.pct.toFixed(2)}% उछाल (${valStr})`,
        href: '/news/',
      });
    } else {
      alerts.push({
        type: 'drop',
        badge: '🔻 गिरावट अलर्ट',
        text: `${q.label} ${q.pct.toFixed(2)}% गिरावट (${valStr})`,
        href: '/news/',
      });
    }
  }

  const nasdaq = quotes.find((q) => q.sym === '^IXIC');
  const sp500 = quotes.find((q) => q.sym === '^GSPC');
  const gold = quotes.find((q) => q.sym === 'GC=F');
  const crude = quotes.find((q) => q.sym === 'CL=F');
  if (nasdaq || gold || crude) {
    const parts = [];
    if (nasdaq) parts.push(`NASDAQ ${nasdaq.pct >= 0 ? '+' : ''}${nasdaq.pct.toFixed(2)}%`);
    if (sp500) parts.push(`S&P 500 ${sp500.pct >= 0 ? '+' : ''}${sp500.pct.toFixed(2)}%`);
    if (gold) parts.push(`Gold $${gold.price.toFixed(0)} (${gold.pct >= 0 ? '+' : ''}${gold.pct.toFixed(2)}%)`);
    if (crude) parts.push(`Crude $${crude.price.toFixed(1)} (${crude.pct >= 0 ? '+' : ''}${crude.pct.toFixed(2)}%)`);
    alerts.push({
      type: 'global',
      badge: '🌍 ग्लोबल बाज़ार',
      text: parts.join(' • '),
      href: '/news/',
    });
  }

  for (const h of radarHeadlines.slice(0, 4)) {
    const lower = h.toLowerCase();
    const type =
      /fall|drop|slump|crash|sink|tumble|loss|decline|plunge/.test(lower)
        ? 'drop'
        : /surge|jump|rally|gain|soar|high|buy|top|up /.test(lower)
          ? 'surge'
          : 'radar';
    alerts.push({
      type,
      badge: type === 'drop' ? '🔻 स्टॉक गिरावट' : type === 'surge' ? '🚀 स्टॉक उछाल' : '👀 मार्केट रडार',
      text: h,
      href: '/news/',
    });
  }

  return alerts;
}

export async function onRequestGet() {
  const [quoteResults, radarHeadlines] = await Promise.all([
    Promise.all(SYMBOLS.map(fetchQuote)),
    fetchRadarHeadlines(),
  ]);

  const quotes = quoteResults.filter(Boolean);
  const alerts = buildHindiAlert(quotes, radarHeadlines);

  const sensex = quotes.find((q) => q.sym === '^BSESN');
  const nifty = quotes.find((q) => q.sym === '^NSEI');
  const primaryPct = nifty?.pct ?? sensex?.pct ?? 0;
  const primaryTone = primaryPct <= -0.3 ? 'drop' : primaryPct >= 0.3 ? 'surge' : 'neutral';

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
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
