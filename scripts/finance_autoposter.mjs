#!/usr/bin/env node
/**
 * LoanKaise.in — Top 10 Finance News Auto-Poster & Cross-Source Mixer
 * 1. Fetches RSS feeds from Moneycontrol, ETMoney, Yahoo Finance, ET, Livemint, Business Standard, CNBC-TV18, NDTV Profit, Financial Express, Finshots/RBI/Goodreturns.
 * 2. Sorts newest-first ("first in").
 * 3. Clusters overlapping news across multiple sources using token + Gemini semantic clustering so duplicate topics across multiple sites are MIXED into ONE comprehensive Hindi article.
 * 4. Rewrites into natural, unique human-language Hindi using Gemini 2.5 Flash.
 * 5. Generates a 100% logo-free custom 1200x675 WebP editorial image under site/uploads/news/<slug>.webp.
 * 6. Rebuilds static site + manifest + sitemaps and optionally commits/pushes to GitHub for Cloudflare Pages deployment.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { FINANCE_SOURCES, FINANCE_CATEGORIES, getAuthorForFinanceCategory } from './finance_sources.mjs';
import { buildAll } from './build_news_site.mjs';
import { notifySearchEngines } from './google_indexing.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA_FILE = path.join(ROOT, 'data', 'news-posts.json');

function loadEnvVars() {
  const candidates = [
    path.join(ROOT, '.env'),
    '/Users/aksingh/CodexJobPortal/job-portal-system/.env',
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

loadEnvVars();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function cleanText(raw = '') {
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

function slugifyEnglish(str = '') {
  const clean = str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 72)
    .replace(/^-|-$/g, '');
  const suffix = Date.now().toString().slice(-4);
  return clean ? `${clean}-${suffix}` : `finance-news-${Date.now()}`;
}

function safeParseJson(raw = '') {
  const str = String(raw).trim();
  const unescaped = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const firstBrace = unescaped.indexOf('{');
  const lastBrace = unescaped.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(unescaped.slice(firstBrace, lastBrace + 1));
    } catch {
      // fallback below
    }
  }
  return JSON.parse(unescaped);
}

function tokenizeTopic(str = '') {
  const stop = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
    'might', 'can', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'if', 'how', 'why', 'what', 'when',
    'where', 'who', 'which', 'here', 'check', 'know', 'latest', 'news', 'today', 'amid', 'over', 'after', 'before',
    'into', 'out', 'up', 'down', 'new', 'more', 'says', 'said', 'report', 'reports', 'india', 'indian', 'rs', 'crore',
    'lakh', 'per', 'cent', 'percent', 'your', 'you', 'all', 'its', 'their', 'moneycontrol', 'etmoney', 'livemint',
    'economic', 'times', 'yahoo', 'finance', 'cnbc', 'tv18', 'business', 'standard', 'financial', 'express', 'ndtv', 'profit',
  ]);
  return new Set(
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w))
  );
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function isFinanceRelevant(item) {
  const titleLower = String(item.title || '').toLowerCase();
  const text = `${item.title} ${item.description}`.toLowerCase();
  const blockWords = [
    'horoscope', 'rashifal', 'cricket', 'ipl', 'bollywood', 'actress', 'actor', 'bigg boss',
    'recipe', 'weather forecast', 'zodiac', 'astrology', 'viral video', 'dating', 'movie review',
    'senate race', 'ballot', 'murder', 'arrested', 'divorce', 'wedding', 'earthquake',
  ];
  if (blockWords.some((b) => text.includes(b))) return false;

  const financeWords = [
    'rbi', 'bank', 'loan', 'emi', 'interest rate', 'repo', 'fd', 'fixed deposit', 'sip', 'mutual fund',
    'nifty', 'sensex', 'stock', 'share', 'ipo', 'sebi', 'tax', 'itr', 'gst', 'epfo', 'pf', 'nps',
    'ppf', 'credit card', 'cibil', 'gold', 'silver', 'rupee', 'inflation', 'gdp', 'budget', 'finance',
    'investment', 'investor', 'wealth', 'insurance', 'lic', 'upi', 'paytm', 'sbi', 'hdfc', 'icici',
    'axis', 'kotak', 'market', 'dividend', 'home loan', 'personal loan', 'car loan', 'education loan',
    'savings', 'retirement', 'pension', 'fed', 'treasury', 'bond', 'etf', 'crypto', 'economy',
  ];
  // Require at least one finance keyword in the headline OR two matches across title+description
  const titleMatch = financeWords.some((w) => titleLower.includes(w));
  if (titleMatch) return true;
  const hitCount = financeWords.filter((w) => text.includes(w)).length;
  return hitCount >= 2;
}

async function fetchOneSource(source) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(source.url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });
    const parsed = parser.parse(xml);

    const channel = parsed?.rss?.channel;
    const atomFeed = parsed?.feed;
    let rawItems = [];

    if (channel) {
      rawItems = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
    } else if (atomFeed) {
      rawItems = Array.isArray(atomFeed.entry) ? atomFeed.entry : atomFeed.entry ? [atomFeed.entry] : [];
    }

    const out = [];
    for (const item of rawItems.slice(0, 12)) {
      const title = cleanText(item.title?.['#text'] || item.title || '');
      let link = item.link?.['#text'] || item.link?.['@_href'] || item.link || item.guid?.['#text'] || item.guid || '';
      if (typeof link === 'object') link = link['@_href'] || link['#text'] || '';
      link = String(link).trim();
      const pubDateRaw = item.pubDate || item.published || item.updated || new Date().toISOString();
      const pubTime = new Date(pubDateRaw).getTime();
      const pubDate = isNaN(pubTime) ? new Date().toISOString() : new Date(pubTime).toISOString();
      const description = cleanText(item.description?.['#text'] || item.description || item.summary || '');

      if (!title || !link || title.length < 15) continue;
      out.push({
        title: title.replace(/\s+-\s+(Moneycontrol|Economic Times|Livemint|Yahoo Finance|Business Standard|CNBC-TV18|Financial Express|NDTV Profit)$/i, '').trim(),
        link,
        pubDate,
        pubMs: new Date(pubDate).getTime(),
        description: description.slice(0, 600),
        sourceId: source.id,
        sourceName: source.name,
        sourceSite: source.site,
        categoryHint: source.categoryDefault,
      });
    }
    return out;
  } catch (err) {
    console.warn(`[feed-warn] ${source.name}: ${err.message}`);
    return [];
  }
}

async function fetchArticleContext(url) {
  try {
    if (url.includes('news.google.com/rss/articles')) return '';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return '';
    const html = await res.text();
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => cleanText(m[1]))
      .filter((t) => t.length > 60 && !/subscribe|cookie|sign in|copyright|advertisement/i.test(t))
      .slice(0, 8);
    return paras.join('\n').slice(0, 2600);
  } catch {
    return '';
  }
}

async function callGemini(prompt, responseMimeType = 'application/json') {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-4-hydrogen',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
  ];
  let lastErr = null;
  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 18000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            responseMimeType,
          },
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const fullText = parts.map((p) => p.text || '').join('').trim();
        if (fullText) return fullText;
      }
      const errTxt = await res.text();
      lastErr = new Error(`Gemini HTTP ${res.status} (${model}): ${errTxt.slice(0, 180)}`);
      if (res.status === 503 || res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
    } catch (netErr) {
      lastErr = netErr;
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
  }
  throw lastErr || new Error('Gemini request failed');
}

/**
 * Cross-source semantic clustering + duplicate check against existing posts.
 */
async function clusterAndDedupeItems(freshItems, existingPosts) {
  // 1. Filter out exact sourceUrl matches or strong lexical matches against already published posts
  const existingUrlSet = new Set();
  const existingTopicTokens = [];
  for (const p of existingPosts) {
    for (const u of p.sourceUrls || []) existingUrlSet.add(u);
    if (p.sourceUrl) existingUrlSet.add(p.sourceUrl);
    const basis = `${p.englishTopicKey || ''} ${p.originalHeadlines?.join(' ') || ''} ${p.title || ''}`;
    existingTopicTokens.push(tokenizeTopic(basis));
  }

  const candidateItems = [];
  for (const item of freshItems) {
    if (existingUrlSet.has(item.link)) continue;
    const tok = tokenizeTopic(item.title);
    const tooSimilarToExisting = existingTopicTokens.some((et) => jaccardSimilarity(tok, et) >= 0.38);
    if (tooSimilarToExisting) continue;
    candidateItems.push({ ...item, tokens: tok });
  }

  // 2. Group similar incoming items across all 10 sources (lexical pre-clustering)
  const clusters = [];
  for (const item of candidateItems) {
    let matchedCluster = null;
    for (const cl of clusters) {
      if (cl.items.some((ci) => jaccardSimilarity(item.tokens, ci.tokens) >= 0.32)) {
        matchedCluster = cl;
        break;
      }
    }
    if (matchedCluster) {
      matchedCluster.items.push(item);
      matchedCluster.latestMs = Math.max(matchedCluster.latestMs, item.pubMs);
    } else {
      clusters.push({
        latestMs: item.pubMs,
        items: [item],
      });
    }
  }

  // Sort clusters newest first ("jo news pahle aawe")
  clusters.sort((a, b) => b.latestMs - a.latestMs);
  const topCandidates = clusters.slice(0, 24);

  if (!GEMINI_API_KEY || topCandidates.length === 0 || process.env.ENABLE_SEMANTIC_DEDUPE !== 'true') {
    // Lexical clustering already groups items across all 10 sources with Jaccard similarity >= 0.32
    // and excludes previously published posts (>= 0.38). Skipping saves 100% of Gemini quota for rewriting!
    return topCandidates;
  }

  // 3. Semantic deduplication & cross-source clustering with Gemini (when enabled)
  try {
    const recentPublishedSummary = existingPosts
      .slice(0, 35)
      .map((p, i) => `PUB_${i}: ${p.title} (Topic: ${p.englishTopicKey || p.slug})`)
      .join('\n');

    const incomingSummary = topCandidates
      .map((cl, idx) => `C_${idx} [${cl.items.map((x) => x.sourceSite).join('+')}]: ${cl.items[0].title}`)
      .join('\n');

    const prompt = `You are a senior Indian financial newsroom editor deduplicating breaking stories across 10 finance websites (Moneycontrol, ETMoney, Yahoo Finance, Economic Times, Livemint, Business Standard, CNBC-TV18, NDTV Profit, Financial Express, Finshots/RBI).

ALREADY PUBLISHED STORIES ON OUR SITE:
${recentPublishedSummary || '(None yet)'}

INCOMING CANDIDATE CLUSTERS (newest first):
${incomingSummary}

TASK:
1. Group ALL distinct valid finance/banking/loan/market/tax/mutual-fund/gold/economy topics among C_0..C_${topCandidates.length - 1} into mergedGroups! Keep AS MANY distinct valid finance news topics as possible (aim for 10-20 groups if distinct topics exist — do NOT discard valid finance stories!).
2. ONLY merge two or more incoming clusters (C_i, C_j) if they report the SAME specific news event or story (e.g. both about Gold rising today, or both about RBI repo rate, or both about the same company's deal).
3. If an incoming cluster covers the SAME specific topic/event already covered in ANY ALREADY PUBLISHED STORY (PUB_k), EXCLUDE it so we NEVER publish duplicate news!
4. Exclude pure spam or non-finance gossip.

Return strict JSON:
{
  "mergedGroups": [
    {
      "clusterIndices": [0, 3],
      "englishTopicKey": "short-kebab-case-topic-slug-3-to-6-words",
      "reason": "brief reason"
    }
  ]
}`;

    const rawJson = await callGemini(prompt, 'application/json');
    const parsed = safeParseJson(rawJson);
    if (Array.isArray(parsed.mergedGroups)) {
      const finalClusters = [];
      const seenIdx = new Set();
      for (const grp of parsed.mergedGroups) {
        const mergedItems = [];
        for (const ci of grp.clusterIndices || []) {
          if (typeof ci === 'number' && topCandidates[ci] && !seenIdx.has(ci)) {
            seenIdx.add(ci);
            mergedItems.push(...topCandidates[ci].items);
          }
        }
        if (mergedItems.length > 0) {
          finalClusters.push({
            latestMs: Math.max(...mergedItems.map((x) => x.pubMs)),
            englishTopicKey: grp.englishTopicKey || '',
            items: mergedItems,
          });
        }
      }
      if (finalClusters.length > 0) {
        return finalClusters.sort((a, b) => b.latestMs - a.latestMs);
      }
    }
  } catch (err) {
    console.warn('[semantic-dedupe-warn] Using lexical clustering fallback:', err.message);
  }

  return topCandidates;
}

/**
 * Synthesize multiple source reports on the same topic into ONE unique human-language Hindi article.
 */
async function rewriteClusterToHindi(cluster) {
  // Scrape additional context from up to 3 distinct sources in the cluster
  const distinctBySite = [];
  const seenSites = new Set();
  for (const item of cluster.items) {
    if (!seenSites.has(item.sourceSite)) {
      seenSites.add(item.sourceSite);
      distinctBySite.push(item);
    }
    if (distinctBySite.length >= 3) break;
  }

  const enrichedSources = await Promise.all(
    distinctBySite.map(async (src) => {
      const bodySnippet = await fetchArticleContext(src.link);
      return {
        sourceName: src.sourceName,
        title: src.title,
        description: src.description,
        bodySnippet,
        link: src.link,
      };
    })
  );

  const sourcesText = enrichedSources
    .map(
      (s, i) => `SOURCE ${i + 1}:
Headline: ${s.title}
Summary: ${s.description}
Details: ${s.bodySnippet || '(Use summary & verified facts only)'}`
    )
    .join('\n\n---\n\n');

  const validCats = FINANCE_CATEGORIES.map((c) => `${c.slug} (${c.label})`).join(', ');

  const prompt = `You are the Chief Hindi Finance Editor at LoanKaise.in (India's trusted banking, loan, personal finance, and market news portal).

Below are ${enrichedSources.length} report(s) from top financial outlets about the SAME topic/development.
Your job is to MIX/SYNTHESIZE the facts from ALL provided sources into ONE single, comprehensive, 100% original Hindi news article written in warm, clear, natural human language (बोलचाल की सरल और भरोसेमंद हिंदी, जैसे एक अनुभवी भारतीय फाइनेंस पत्रकार लिखता है).

STRICT EDITORIAL RULES:
1. Language: Natural, human-written Hindi (Devanagari). Use standard English acronyms/terms naturally where Indian readers expect them (e.g., RBI, EMI, FD, Repo Rate, SIP, Sensex, Nifty, CIBIL, ITR, GST, SEBI). Never sound like Google Translate!
2. Headline ("title"): Write a completely original, catchy, SEO-friendly Hindi headline (60–85 chars) that gets high clicks on Google Discover & Search. NEVER copy or literally translate a single source headline!
3. Slug ("slugHint"): Write a short, clean English SEO URL slug (4–7 lowercase words separated by hyphens, e.g. "rbi-repo-rate-decision-home-loan-emi").
4. Never mention competitor publisher names (do NOT write "Moneycontrol के मुताबिक" or "ETMoney के अनुसार" or "Yahoo Finance ने बताया"). Present facts directly as LoanKaise.in's own financial desk report!
5. Structure of "contentHtml":
   - Engaging opening <p> paragraph explaining the core news & why it matters to Indian citizens/investors.
   - 3 to 4 structured <h2> headings covering:
     * पूरा मामला क्या है? / मुख्य अपडेट (Full details mixing facts from all sources)
     * मुख्य बातें (Key Highlights in <ul><li>...</li></ul>)
     * आम आदमी, निवेशकों और लोन ग्राहकों पर क्या असर पड़ेगा? (Practical impact for readers)
     * आगे क्या ध्यान रखें? (Smart financial takeaway / next steps)
   - Length: 550 to 800 words of rich, factual, zero-fluff Hindi journalism. Do not invent fake numbers; use only numbers/facts present in the source material.
6. Category ("category"): Choose EXACTLY ONE from: ${validCats}.

SOURCE MATERIAL TO MIX & REWRITE:
${sourcesText}

Return STRICT JSON ONLY:
{
  "title": "Unique SEO Hindi Headline",
  "subtitle": "1-sentence Hindi sub-headline explaining reader impact",
  "slugHint": "english-seo-slug-words",
  "excerpt": "2-sentence crisp Hindi meta description (under 155 chars)",
  "category": "one-of-the-valid-category-slugs",
  "badge": "ताज़ा अपडेट" | "ब्रेकिंग न्यूज़" | "खास रिपोर्ट" | "निवेश अलर्ट",
  "tags": ["Hindi Tag 1", "Finance", "Tag 3"],
  "contentHtml": "<p>...</p><h2>...</h2><p>...</p><ul><li>...</li></ul>..."
}`;

  const rawJson = await callGemini(prompt, 'application/json');
  const data = safeParseJson(rawJson);

  const validSlugs = new Set(FINANCE_CATEGORIES.map((c) => c.slug));
  const category = validSlugs.has(data.category) ? data.category : cluster.items[0].categoryHint || 'personal-finance';
  const catObj = FINANCE_CATEGORIES.find((c) => c.slug === category) || FINANCE_CATEGORIES[3];
  const author = getAuthorForFinanceCategory(category);
  const slug = slugifyEnglish(data.slugHint || cluster.englishTopicKey || cluster.items[0].title);

  // Strip any leftover source brand names just in case
  const cleanBrandMentions = (s = '') =>
    s
      .replace(/\b(Moneycontrol|ETMoney|Yahoo Finance|Economic Times|Livemint|Business Standard|CNBC-TV18|NDTV Profit|Financial Express)\b/gi, 'फाइनेंशियल विशेषज्ञों')
      .trim();

  const title = cleanBrandMentions(data.title);
  const subtitle = cleanBrandMentions(data.subtitle || '');
  const excerpt = cleanBrandMentions(data.excerpt || subtitle || title);
  const content = cleanBrandMentions(data.contentHtml || `<p>${excerpt}</p>`);
  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  // Generate 100% logo-free custom 1200x675 WebP image locally
  const imgRelPath = `/uploads/news/${slug}.webp`;
  const imgAbsPath = path.join(SITE, 'uploads', 'news', `${slug}.webp`);
  execFileSync(
    'python3',
    [
      path.join(ROOT, 'scripts', 'generate_news_image.py'),
      '--slug',
      slug,
      '--title',
      title,
      '--category',
      category,
      '--output',
      imgAbsPath,
    ],
    { stdio: 'pipe' }
  );

  const nowIso = new Date().toISOString();

  return {
    id: `lk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    title,
    subtitle,
    excerpt,
    content,
    category,
    categoryLabel: catObj.label,
    badge: data.badge || 'ताज़ा अपडेट',
    featuredImage: imgRelPath,
    author: {
      name: author.name,
      role: author.role,
      slug: author.slug,
      verified: true,
    },
    publishedAt: nowIso,
    updatedAt: nowIso,
    readingTimeMinutes: Math.max(3, Math.round(wordCount / 160)),
    sourceUrls: [...new Set(cluster.items.map((x) => x.link))],
    sourceNames: [...new Set(cluster.items.map((x) => x.sourceName))],
    originalHeadlines: cluster.items.map((x) => x.title),
    englishTopicKey: cluster.englishTopicKey || slug,
    indexedInGoogle: true,
    tags: Array.isArray(data.tags) ? data.tags : [catObj.label, 'Finance News Hindi', 'LoanKaise'],
  };
}

async function runAutoPoster({ limit = 2, push = false } = {}) {
  console.log(`\n=========================================================`);
  console.log(`[${new Date().toISOString()}] LoanKaise Finance Auto-Poster Started (limit=${limit}, push=${push})`);
  console.log(`=========================================================`);

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const existingPosts = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    : [];

  // 1. Fetch all 10+ top finance sources in parallel
  const results = await Promise.all(
    FINANCE_SOURCES.filter((s) => s.enabled).map((s) => fetchOneSource(s))
  );
  const allFetched = results
    .flat()
    .filter(isFinanceRelevant)
    .sort((a, b) => b.pubMs - a.pubMs);

  console.log(`[fetch] Pulled ${allFetched.length} finance items across ${FINANCE_SOURCES.length} feeds.`);

  // 2. Cluster overlapping topics & eliminate any already-published topics
  const uniqueClusters = await clusterAndDedupeItems(allFetched, existingPosts);
  console.log(`[dedupe] Found ${uniqueClusters.length} unique non-duplicate topic clusters.`);

  const created = [];
  for (const cluster of uniqueClusters) {
    if (created.length >= limit) break;
    try {
      const mergedNames = [...new Set(cluster.items.map((x) => x.sourceSite))].join(' + ');
      console.log(`\n[rewrite] Mixing (${cluster.items.length} sources: ${mergedNames}) -> "${cluster.items[0].title}"`);
      const post = await rewriteClusterToHindi(cluster);
      existingPosts.unshift(post);
      created.push(post);
      console.log(`  ✅ Created: ${post.title}`);
      console.log(`     URL: /news/${post.slug}/ | Image: ${post.featuredImage}`);
    } catch (err) {
      console.error(`  ❌ Failed cluster "${cluster.items[0].title}":`, err.message);
    }
  }

  // Persist up to 1,500 latest news articles in registry
  const trimmed = existingPosts.slice(0, 1500);
  fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2), 'utf8');

  // Rebuild static HTML pages, homepage, manifest & sitemaps
  const buildStats = buildAll();
  console.log(`[build] News: ${buildStats.newsCount}, Total Manifest Posts: ${buildStats.totalManifestCount}`);

  if (push && created.length > 0) {
    try {
      execSync('git add data/news-posts.json site/', { cwd: ROOT, stdio: 'inherit' });
      const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
      if (status) {
        execSync(`git commit -m "Auto-publish ${created.length} Hindi finance news articles"`, {
          cwd: ROOT,
          stdio: 'inherit',
        });
        execSync('git pull --rebase --autostash origin main && git push origin main', {
          cwd: ROOT,
          stdio: 'inherit',
        });
        console.log('🚀 Pushed to GitHub -> Cloudflare Pages deployment triggered!');
        // Wait 30s for Cloudflare Pages deployment, then ping WebSub, IndexNow, and Google Indexing API
        await new Promise((r) => setTimeout(r, 30000));
        await notifySearchEngines(created.map((p) => `/news/${p.slug}/`));
      }
    } catch (gitErr) {
      console.error('[git-push-error]', gitErr.message);
    }
  }

  return { created, buildStats };
}

// CLI execution
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : 2;
const push = args.includes('--push');

runAutoPoster({ limit, push })
  .then((res) => {
    console.log(`\nDone. Created ${res.created.length} new Hindi finance articles.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
