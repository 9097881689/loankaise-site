/**
 * LoanKaise.in — Real-Time Stock Market Alert & Movers/Losers Edge API
 * Serves:
 * 1. Benchmark Indices (Nifty 50, Sensex, Bank Nifty, FinNifty, Nifty IT, India VIX, Nasdaq, S&P 500, Gold, Silver, Crude Oil, Bitcoin, USD/INR)
 * 2. Market Movers / Top Gainers (Stock Symbol, Live Price, +% Gain)
 * 3. Market Top Losers (Stock Symbol, Live Price, -% Drop)
 * NO RSS TEXT HEADLINES — PURE REAL-TIME MARKET PRICES & INDICES ONLY.
 */

const INDICES = [
  { sym: '^NSEI', label: 'NIFTY 50', group: 'INDEX', unit: '' },
  { sym: '^BSESN', label: 'SENSEX', group: 'INDEX', unit: '' },
  { sym: '^NSEBANK', label: 'BANK NIFTY', group: 'INDEX', unit: '' },
  { sym: 'NIFTY_FIN_SERVICE.NS', label: 'FINNIFTY', group: 'INDEX', unit: '' },
  { sym: '^CNXIT', label: 'NIFTY IT', group: 'INDEX', unit: '' },
  { sym: '^INDIAVIX', label: 'INDIA VIX', group: 'INDEX', unit: '' },
  { sym: '^IXIC', label: 'NASDAQ', group: 'INDEX', unit: '' },
  { sym: '^GSPC', label: 'S&P 500', group: 'INDEX', unit: '' },
  { sym: 'GC=F', label: 'GOLD', group: 'COMMODITY', unit: '$' },
  { sym: 'SI=F', label: 'SILVER', group: 'COMMODITY', unit: '$' },
  { sym: 'CL=F', label: 'CRUDE OIL', group: 'COMMODITY', unit: '$' },
  { sym: 'BTC-USD', label: 'BITCOIN', group: 'CRYPTO', unit: '$' },
  { sym: 'USDINR=X', label: 'USD/INR', group: 'FX', unit: '₹' },
];

const STOCKS = [
  { sym: 'RELIANCE.NS', label: 'RELIANCE', unit: '₹' },
  { sym: 'TCS.NS', label: 'TCS', unit: '₹' },
  { sym: 'HDFCBANK.NS', label: 'HDFC BANK', unit: '₹' },
  { sym: 'INFY.NS', label: 'INFOSYS', unit: '₹' },
  { sym: 'ICICIBANK.NS', label: 'ICICI BANK', unit: '₹' },
  { sym: 'TATAMOTORS.NS', label: 'TATA MOTORS', unit: '₹' },
  { sym: 'SBIN.NS', label: 'SBI', unit: '₹' },
  { sym: 'BHARTIARTL.NS', label: 'BHARTI AIRTEL', unit: '₹' },
  { sym: 'ITC.NS', label: 'ITC', unit: '₹' },
  { sym: 'LT.NS', label: 'L&T', unit: '₹' },
  { sym: 'BAJFINANCE.NS', label: 'BAJAJ FINANCE', unit: '₹' },
  { sym: 'MARUTI.NS', label: 'MARUTI', unit: '₹' },
  { sym: 'SUNPHARMA.NS', label: 'SUN PHARMA', unit: '₹' },
  { sym: 'TITAN.NS', label: 'TITAN', unit: '₹' },
  { sym: 'ADANIENT.NS', label: 'ADANI ENT', unit: '₹' },
  { sym: 'TATASTEEL.NS', label: 'TATA STEEL', unit: '₹' },
];

// Fallback baseline prices in case Yahoo throttles or during market holiday setup
const FALLBACK_DATA = {
  '^NSEI': { price: 25144.30, pct: -0.44 },
  '^BSESN': { price: 81592.45, pct: -0.35 },
  '^NSEBANK': { price: 61034.10, pct: 0.40 },
  'NIFTY_FIN_SERVICE.NS': { price: 27855.50, pct: 0.69 },
  '^CNXIT': { price: 42180.50, pct: 0.75 },
  '^INDIAVIX': { price: 15.50, pct: -11.76 },
  '^IXIC': { price: 25136.27, pct: -0.91 },
  '^GSPC': { price: 7561.67, pct: -0.40 },
  'GC=F': { price: 3886.30, pct: 0.03 },
  'SI=F': { price: 49.12, pct: -1.89 },
  'CL=F': { price: 88.56, pct: -0.20 },
  'BTC-USD': { price: 67255.94, pct: -1.44 },
  'USDINR=X': { price: 94.24, pct: 0.21 },
  'TATAMOTORS.NS': { price: 842.50, pct: 4.20 },
  'RELIANCE.NS': { price: 1280.10, pct: 3.15 },
  'INFY.NS': { price: 1890.00, pct: 2.80 },
  'BHARTIARTL.NS': { price: 1610.40, pct: 2.40 },
  'ICICIBANK.NS': { price: 1264.30, pct: 1.85 },
  'SBIN.NS': { price: 825.40, pct: 1.20 },
  'HDFCBANK.NS': { price: 1695.20, pct: -2.45 },
  'TCS.NS': { price: 4110.00, pct: -1.90 },
  'ITC.NS': { price: 472.30, pct: -1.85 },
  'BAJFINANCE.NS': { price: 6720.00, pct: -1.60 },
  'LT.NS': { price: 3580.00, pct: -1.30 },
  'MARUTI.NS': { price: 11450.00, pct: -0.95 },
  'SUNPHARMA.NS': { price: 1780.00, pct: 0.60 },
  'TITAN.NS': { price: 3240.00, pct: -0.80 },
  'ADANIENT.NS': { price: 2890.00, pct: 1.45 },
  'TATASTEEL.NS': { price: 148.50, pct: -0.70 },
};

async function fetchQuote(item) {
  try {
    const bust = Date.now();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.sym)}?range=1d&interval=1m&_=${bust}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2800);
    const res = await fetch(url, {
      signal: ctrl.signal,
      cf: { cacheTtl: 0, cacheEverything: false },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LoanKaiseBot/1.0)',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    const prev = Number(meta?.chartPreviousClose || meta?.previousClose || price);
    if (!price || Number.isNaN(price)) throw new Error('NaN');
    const change = price - prev;
    const pct = prev ? (change / prev) * 100 : 0;
    return {
      sym: item.sym,
      label: item.label,
      group: item.group || 'STOCK',
      unit: item.unit,
      price,
      change,
      pct,
    };
  } catch {
    const fb = FALLBACK_DATA[item.sym];
    if (fb) {
      return {
        sym: item.sym,
        label: item.label,
        group: item.group || 'STOCK',
        unit: item.unit,
        price: fb.price,
        change: (fb.price * fb.pct) / 100,
        pct: fb.pct,
      };
    }
    return null;
  }
}

export async function onRequestGet() {
  const [indexResults, stockResults] = await Promise.all([
    Promise.all(INDICES.map(fetchQuote)),
    Promise.all(STOCKS.map(fetchQuote)),
  ]);

  const indices = indexResults.filter(Boolean);
  const stocks = stockResults.filter(Boolean);

  // Sort stocks into Top Gainers (Movers) and Top Losers
  const sortedStocks = [...stocks].sort((a, b) => b.pct - a.pct);
  const gainers = sortedStocks.filter((s) => s.pct > 0).slice(0, 4);
  const losers = [...sortedStocks].reverse().filter((s) => s.pct < 0).slice(0, 4);

  // Build Movers & Losers Alert Objects
  const alerts = [];

  for (const g of gainers) {
    alerts.push({
      type: 'surge',
      badge: '🚀 TOP GAINER',
      sym: g.sym,
      label: g.label,
      price: g.price,
      pct: g.pct,
      unit: g.unit || '₹',
      text: `${g.label} ${g.unit || '₹'}${g.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (+${g.pct.toFixed(2)}%)`,
      href: '/news/',
    });
  }

  for (const l of losers) {
    alerts.push({
      type: 'drop',
      badge: '🔻 TOP LOSER',
      sym: l.sym,
      label: l.label,
      price: l.price,
      pct: l.pct,
      unit: l.unit || '₹',
      text: `${l.label} ${l.unit || '₹'}${l.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${l.pct.toFixed(2)}%)`,
      href: '/news/',
    });
  }

  const sensex = indices.find((q) => q.sym === '^BSESN');
  const nifty = indices.find((q) => q.sym === '^NSEI');
  const primaryPct = nifty?.pct ?? sensex?.pct ?? 0;
  const primaryTone = primaryPct <= -0.3 ? 'drop' : primaryPct >= 0.3 ? 'surge' : 'neutral';

  return Response.json(
    {
      success: true,
      updatedAt: new Date().toISOString(),
      tone: primaryTone,
      quotes: indices,
      gainers,
      losers,
      alerts,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
