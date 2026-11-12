import { CATEGORY_LABELS } from './store.js';

const AUTHOR_BY_CATEGORY = {
  'banking-rbi': 'राहुल शर्मा',
  'loans-emi': 'राहुल शर्मा',
  'markets': 'अमित मिश्रा',
  'mutual-funds': 'अमित मिश्रा',
  'personal-finance': 'प्रिया वर्मा',
  'tax-saving': 'प्रिया वर्मा',
  'business': 'नेहा गुप्ता',
};

const LOGO_FREE_STOCK_IMAGES = {
  'banking-rbi': [
    'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85',
  ],
  markets: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1200&q=85',
  ],
  'loans-emi': [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=85',
  ],
  'personal-finance': [
    'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=85',
  ],
  'mutual-funds': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85',
  ],
  'tax-saving': [
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85',
  ],
  business: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
  ],
};

export function pickLogoFreeImage(category = 'personal-finance', seed = '') {
  const list = LOGO_FREE_STOCK_IMAGES[category] || LOGO_FREE_STOCK_IMAGES['personal-finance'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

export function cleanHtmlText(raw = '') {
  return String(raw)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyEnglish(input = '') {
  const base = String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 68)
    .replace(/^-|-$/g, '');
  const suffix = Date.now().toString().slice(-4);
  return base ? `${base}-${suffix}` : `finance-update-${Date.now()}`;
}

export function inferFinanceCategory(text = '') {
  const t = text.toLowerCase();
  if (/rbi|repo rate|bank|sbi|hdfc|icici|axis|kotak|upi|fd|fixed deposit/.test(t)) return 'banking-rbi';
  if (/home loan|personal loan|car loan|emi|cibil|credit score|mortgage|borrow/.test(t)) return 'loans-emi';
  if (/sip|mutual fund|amfi|nav|elss|flexi cap|index fund/.test(t)) return 'mutual-funds';
  if (/tax|itr|gst|80c|tds|income tax|deduction/.test(t)) return 'tax-saving';
  if (/nifty|sensex|stock|share|ipo|gold|silver|sebi|market|nasdaq|dow/.test(t)) return 'markets';
  if (/gdp|inflation|budget|corporate|profit|revenue|economy|quarter/.test(t)) return 'business';
  return 'personal-finance';
}

export async function callEdgeGemini(prompt, apiKey) {
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured on Cloudflare Pages');
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-4-hydrogen',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
  ];
  let lastErr = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const fullText = parts.map((p) => p.text || '').join('').trim();
        if (fullText) return fullText;
      }
      const err = await res.text();
      lastErr = new Error(`Gemini HTTP ${res.status} (${model}): ${err.slice(0, 160)}`);
      if (res.status === 429 || res.status === 503) continue;
      throw lastErr;
    } catch (netErr) {
      lastErr = netErr;
      continue;
    }
  }
  throw lastErr || new Error('All Gemini models exhausted');
}

export async function fetchExternalArticleContext(targetUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LoanKaiseBot/1.0; +https://loankaise.in)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { title: '', description: '', body: '' };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => cleanHtmlText(m[1]))
      .filter((p) => p.length > 50 && !/subscribe|cookie|sign in|copyright|advertisement/i.test(p))
      .slice(0, 10);
    return {
      title: cleanHtmlText(titleMatch?.[1] || ''),
      description: cleanHtmlText(descMatch?.[1] || ''),
      body: paras.join('\n').slice(0, 3500),
    };
  } catch {
    return { title: '', description: '', body: '' };
  }
}

export async function rewriteFinanceStoryHindi({ sourcesText, categoryOverride, hint, apiKey }) {
  const fallbackCat = categoryOverride || inferFinanceCategory(sourcesText);
  const prompt = `आप LoanKaise.in के सीनियर हिंदी फाइनेंस एडिटर हैं। नीचे दिए गए अंग्रेज़ी/हिंदी समाचार डेटा के आधार पर एक 100% नया, यूनिक, मानवीय (Human-Written) और SEO-फ्रेंडली हिंदी फाइनेंस न्यूज़ आर्टिकल लिखें।

सख्त नियम:
1. किसी भी बाहरी मीडिया साइट (जैसे Moneycontrol, ETMoney, Yahoo Finance, ET, Livemint आदि) का नाम, ब्रांडिंग या कॉपीराइट सामग्री आर्टिकल में बिल्कुल न लिखें।
2. शीर्षक (title) को पूरी तरह नया, आकर्षक और Google Discover / SEO के अनुकूल हिंदी में लिखें — मूल शीर्षक की सीधी नकल न करें।
3. भाषा स्वाभाविक, सरल और आम भारतीय पाठकों के लिए समझने योग्य (बोलचाल की शुद्ध हिंदी + ज़रूरी फाइनेंस शब्द जैसे EMI, Repo Rate, SIP, RBI) हो।
4. आर्टिकल में कम से कम 550-750 शब्द, स्पष्ट <h2> उप-शीर्षक, बुलेट पॉइंट्स (<ul><li>) और पाठकों के लिए व्यावहारिक सलाह शामिल हो।
${hint ? `5. विशेष फोकस / एंगल: ${hint}\n` : ''}
${categoryOverride ? `6. श्रेणी: ${categoryOverride}\n` : ''}

स्रोत जानकारी:
${sourcesText}

केवल वैध JSON फॉर्मेट में उत्तर दें:
{
  "title": "यूनिक हिंदी SEO हेडलाइन (65-95 अक्षर)",
  "subtitle": "मुख्य सारांश सब-हेडलाइन (1-2 वाक्य)",
  "excerpt": "मेटा डिस्क्रिप्शन व कार्ड सारांश (140-165 अक्षर)",
  "englishSlug": "clean-english-seo-slug-4-to-7-words",
  "category": "banking-rbi | loans-emi | markets | personal-finance | mutual-funds | tax-saving | business",
  "content": "<p>शुरुआती पैराग्राफ...</p><h2>प्रमुख बिंदु</h2><ul><li>...</li></ul><p>...</p><h2>निवेशकों और आम लोगों पर असर</h2><p>...</p>"
}`;

  const raw = await callEdgeGemini(prompt, apiKey);
  const parsed = JSON.parse(raw);
  const cat = CATEGORY_LABELS[parsed.category] ? parsed.category : fallbackCat;
  const slug = slugifyEnglish(parsed.englishSlug || parsed.title || 'finance-news');

  return {
    id: `lk-edge-${Date.now()}`,
    slug,
    url: `/news/${slug}/`,
    title: parsed.title,
    subtitle: parsed.subtitle || parsed.excerpt || '',
    excerpt: parsed.excerpt || parsed.subtitle || '',
    content: parsed.content,
    category: cat,
    categoryLabel: CATEGORY_LABELS[cat] || 'फाइनेंस न्यूज़',
    authorName: AUTHOR_BY_CATEGORY[cat] || 'राहुल शर्मा',
    featuredImage: pickLogoFreeImage(cat, slug),
    publishedAt: new Date().toISOString(),
    indexedInGoogle: true,
  };
}

export function parseRssItems(xml = '', sourceSite = '') {
  const items = [];
  const matches = [...xml.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)];
  for (const m of matches.slice(0, 12)) {
    const block = m[1];
    const title = cleanHtmlText((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const linkRaw =
      (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] ||
      (block.match(/<link[^>]+href=["']([^"']+)["']/i) || [])[1] ||
      '';
    const link = cleanHtmlText(linkRaw);
    const desc = cleanHtmlText(
      (block.match(/<(?:description|summary)[^>]*>([\s\S]*?)<\/(?:description|summary)>/i) || [])[1] || ''
    );
    const pubRaw = cleanHtmlText(
      (block.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i) || [])[1] || ''
    );
    const pubMs = Date.parse(pubRaw) || Date.now();
    if (title && link) {
      items.push({ sourceSite, title, link, description: desc, pubMs });
    }
  }
  return items;
}
