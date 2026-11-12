#!/usr/bin/env node
/**
 * LoanKaise.in — HollywoodTime-Style Editorial Site & News Hub Builder
 * Builds Homepage, /news/, /category/news/, individual Hindi news articles (/news/<slug>/),
 * restyles all legacy guides/calculators/pages with HollywoodTime masthead & footer,
 * and updates feed.xml, sitemap.xml, sitemap-news.xml, and site/data/posts-manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderEditorialHomeHtml,
  renderEditorialNewsHubHtml,
  renderEditorialArticleHtml,
} from './editorial_theme.mjs';
import { restyleAllLegacyPages } from './restyle_legacy_pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA_FILE = path.join(ROOT, 'data', 'news-posts.json');
const MANIFEST_FILE = path.join(SITE, 'data', 'posts-manifest.json');

const STATIC_EXCLUDE_SLUGS = new Set([
  'aabout-us', 'contact-us', 'desclaimer', 'privacy-policy',
  'terms-and-conditions', 'editorial-policy', 'fact-check-policy',
  'html-sitemap', 'calculators', 'mock-test', 'tools', 'category',
  'assets', 'news', 'uploads', 'data', 'admin', 'application-generator',
  'loan-eligibility', 'prepayment-calculator',
]);

function escXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function loadNewsPosts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return (Array.isArray(raw) ? raw : []).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch {
    return [];
  }
}

function collectLegacyGuides() {
  const dirs = fs.readdirSync(SITE).filter((d) => {
    if (STATIC_EXCLUDE_SLUGS.has(d)) return false;
    return fs.existsSync(path.join(SITE, d, 'index.html'));
  });

  const guides = [];
  for (const slug of dirs) {
    const html = fs.readFileSync(path.join(SITE, slug, 'index.html'), 'utf8');
    if (!html.includes('class="article-wrap"')) continue;
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    const metaMatch = html.match(/<div class="meta">(.*?)<\/div>/is);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : slug;
    const metaText = metaMatch ? metaMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const dateMatch = metaText.match(/(\d{4}-\d{2}-\d{2})/);
    const publishedAt = dateMatch ? `${dateMatch[1]}T10:00:00.000Z` : '2024-01-01T10:00:00.000Z';

    guides.push({
      id: `guide-${slug}`,
      slug,
      url: `/${slug}/`,
      title,
      category: 'loan-guide',
      categoryLabel: 'Banking Guide',
      featuredImage: '/assets/favicon.png',
      authorName: 'Ashok',
      publishedAt,
      indexedInGoogle: true,
      isLegacyGuide: true,
    });
  }
  return guides.sort((a, b) => a.title.localeCompare(b.title));
}

function buildManifest(allNews, legacyGuides) {
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  const newsMapped = allNews.map((n) => ({
    id: n.id,
    slug: n.slug,
    url: `/news/${n.slug}/`,
    title: n.title,
    subtitle: n.subtitle || '',
    category: n.category,
    categoryLabel: n.categoryLabel,
    featuredImage: n.featuredImage || '/assets/favicon.png',
    authorName: n.author?.name || 'राहुल शर्मा',
    publishedAt: n.publishedAt,
    indexedInGoogle: n.indexedInGoogle ?? true,
    sourcesCount: Array.isArray(n.sourceUrls) ? n.sourceUrls.length : 1,
    sourceNames: n.sourceNames || [],
    isLegacyGuide: false,
  }));

  const combined = [...newsMapped, ...legacyGuides].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(combined, null, 2), 'utf8');
  return combined;
}

function buildSitemapsAndRss(allNews, allManifest) {
  const today = new Date().toISOString().slice(0, 10);

  const newsXmlItems = allNews
    .slice(0, 50)
    .map(
      (p) => `  <url>
    <loc>https://loankaise.in/news/${escXml(p.slug)}/</loc>
    <news:news>
      <news:publication>
        <news:name>LoanKaise.in</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escXml(p.title)}</news:title>
    </news:news>
  </url>`
    )
    .join('\n');

  const newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsXmlItems}
</urlset>\n`;
  fs.writeFileSync(path.join(SITE, 'sitemap-news.xml'), newsSitemap, 'utf8');

  const sitemapPath = path.join(SITE, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sm = fs.readFileSync(sitemapPath, 'utf8');
    sm = sm.replace(/\s*<!-- LK_NEWS_SITEMAP_START -->[\s\S]*?<!-- LK_NEWS_SITEMAP_END -->/g, '');
    const newsUrls = [
      `  <url><loc>https://loankaise.in/news/</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>0.90</priority></url>`,
      ...allNews.map(
        (p) =>
          `  <url><loc>https://loankaise.in/news/${escXml(p.slug)}/</loc><lastmod>${p.publishedAt.slice(0, 10)}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`
      ),
    ].join('\n');

    sm = sm.replace(
      '</urlset>',
      `  <!-- LK_NEWS_SITEMAP_START -->\n${newsUrls}\n  <!-- LK_NEWS_SITEMAP_END -->\n</urlset>`
    );
    fs.writeFileSync(sitemapPath, sm, 'utf8');
  }

  const rssItems = allManifest
    .slice(0, 30)
    .map((p) => {
      const link = `https://loankaise.in${p.url}`;
      return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(link)}</link>
      <guid isPermaLink="true">${escXml(link)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <category>${escXml(p.categoryLabel || 'Finance')}</category>
      <description>${escXml(p.subtitle || p.title)}</description>
    </item>`;
    })
    .join('\n');

  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LoanKaise.in — Hindi Finance News &amp; Banking Guides</title>
    <link>https://loankaise.in/</link>
    <atom:link href="https://loankaise.in/feed.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
    <description>ताज़ा फाइनेंस न्यूज़, लोन गाइड्स, RBI अपडेट्स और बैंकिंग टूल्स हिंदी में।</description>
    <language>hi-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>\n`;
  fs.writeFileSync(path.join(SITE, 'feed.xml'), feedXml, 'utf8');
}

export function buildAll() {
  const allNews = loadNewsPosts();
  const legacyGuides = collectLegacyGuides();

  // 1. Individual /news/<slug>/index.html in exact HollywoodTime editorial template
  for (const post of allNews) {
    const dir = path.join(SITE, 'news', post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderEditorialArticleHtml({ post, allNews }), 'utf8');
  }

  // 2. /news/index.html & /category/news/index.html
  fs.mkdirSync(path.join(SITE, 'news'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'news', 'index.html'), renderEditorialNewsHubHtml({ allNews, isNewsRoot: true }), 'utf8');
  fs.mkdirSync(path.join(SITE, 'category', 'news'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'category', 'news', 'index.html'), renderEditorialNewsHubHtml({ allNews, isNewsRoot: false }), 'utf8');

  // 3. Homepage (site/index.html) in exact HollywoodTime Hero + Breaking + Category Grids + Calculators + Guides
  fs.writeFileSync(path.join(SITE, 'index.html'), renderEditorialHomeHtml({ allNews, legacyGuides }), 'utf8');

  // 4. Restyle all 150+ legacy pages/guides/calculators/mock-test pages with HollywoodTime header/footer + live ticker
  restyleAllLegacyPages(allNews);

  // 5. Build manifest, RSS, and Google News sitemaps
  const manifest = buildManifest(allNews, legacyGuides);
  buildSitemapsAndRss(allNews, manifest);

  console.log(`[build_news_site] Built HollywoodTime design across Home, ${allNews.length} News Articles, News Hubs, and Legacy Pages (${manifest.length} total manifest posts).`);
  return { newsCount: allNews.length, totalManifestCount: manifest.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildAll();
}
