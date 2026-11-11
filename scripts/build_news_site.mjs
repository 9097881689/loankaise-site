#!/usr/bin/env node
/**
 * LoanKaise.in — Static Site & News Hub Builder
 * Builds individual Hindi news pages (/news/<slug>/), updates /category/news/, /news/,
 * injects Latest Hindi Finance News & Ticker into site/index.html,
 * updates feed.xml, sitemap.xml, sitemap-news.xml, and site/data/posts-manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateHi(iso) {
  try {
    return new Date(iso).toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDateTimeHi(iso) {
  try {
    return new Date(iso).toLocaleString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }) + ' IST';
  } catch {
    return iso;
  }
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

function monetizeContent(htmlContent) {
  const ad1 = `<div class="ad-slot"><span class="ad-label">ADVERTISEMENT</span><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4298058382758528" data-ad-slot="9974716573" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
  const ad2 = `<div class="ad-slot"><span class="ad-label">ADVERTISEMENT</span><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4298058382758528" data-ad-slot="7602979116" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;

  let count = 0;
  return htmlContent.replace(/<\/p>/gi, (match) => {
    count++;
    if (count === 3) return `${match}\n${ad1}`;
    if (count === 6) return `${match}\n${ad2}`;
    return match;
  });
}

function buildArticlePage(post, allNews) {
  const canonical = `https://loankaise.in/news/${post.slug}/`;
  const imageAbs = post.featuredImage?.startsWith('http')
    ? post.featuredImage
    : `https://loankaise.in${post.featuredImage || '/assets/favicon.png'}`;

  const related = allNews
    .filter((p) => p.slug !== post.slug)
    .slice(0, 6);

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        headline: post.title,
        description: post.excerpt || post.subtitle || post.title,
        image: [imageAbs],
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        inLanguage: 'hi-IN',
        mainEntityOfPage: canonical,
        author: {
          '@type': 'Person',
          name: post.author?.name || 'राहुल शर्मा',
        },
        publisher: {
          '@type': 'Organization',
          name: 'LoanKaise.in',
          url: 'https://loankaise.in/',
          logo: {
            '@type': 'ImageObject',
            url: 'https://loankaise.in/assets/favicon.png',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://loankaise.in/' },
          { '@type': 'ListItem', position: 2, name: 'Finance News', item: 'https://loankaise.in/news/' },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
    ],
  });

  const bodyHtml = monetizeContent(post.content || `<p>${escHtml(post.excerpt || post.title)}</p>`);

  const relatedHtml = related.length
    ? `<section style="margin-top:32px;padding-top:22px;border-top:2px solid #e2e8f0">
        <h2 style="margin:0 0 12px;font-size:22px">संबंधित ताज़ा खबरें (Related Finance News)</h2>
        <div class="lk-related-grid">
          ${related
            .slice(0, 3)
            .map(
              (r) => `<a class="lk-news-card" href="../../news/${r.slug}/">
                <div class="lk-news-thumb-wrap">
                  <img class="lk-news-thumb" src="${escHtml(r.featuredImage || '/assets/favicon.png')}" alt="${escHtml(r.title)}" loading="lazy">
                  <span class="lk-news-cat-tag">${escHtml(r.categoryLabel || 'फाइनेंस न्यूज़')}</span>
                </div>
                <div class="lk-news-body">
                  <h3 class="lk-news-title" style="font-size:15px">${escHtml(r.title)}</h3>
                  <div class="lk-news-meta"><span>${formatDateHi(r.publishedAt)}</span></div>
                </div>
              </a>`
            )
            .join('\n')}
        </div>
      </section>`
    : '';

  return `<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(post.title)} | LoanKaise.in</title>
  <meta name="description" content="${escHtml(post.excerpt || post.subtitle || post.title)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escHtml(post.title)}">
  <meta property="og:description" content="${escHtml(post.excerpt || post.title)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="LoanKaise.in">
  <meta property="og:locale" content="hi_IN">
  <meta property="og:image" content="${imageAbs}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(post.title)}">
  <meta name="twitter:description" content="${escHtml(post.excerpt || post.title)}">
  <meta name="twitter:image" content="${imageAbs}">
  <link rel="icon" href="/assets/favicon.png" sizes="192x192" type="image/png">
  <link rel="apple-touch-icon" href="/assets/favicon.png">
  <link rel="stylesheet" href="../../assets/style.css?v=20260726a">
  <link rel="stylesheet" href="../../assets/news.css?v=20261111a">
  <meta name="theme-color" content="#0757d5">
  <meta name="google-adsense-account" content="ca-pub-4298058382758528">
  <script type="application/ld+json">${schemaJson}</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4298058382758528" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-J75EYB646Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-J75EYB646Q');</script>
  <link rel="alternate" type="application/rss+xml" title="LoanKaise.in Updates" href="/feed.xml">
</head>
<body>
  <div class="topline"></div>
  <header class="site-header">
    <nav class="nav">
      <a class="brand" href="../../"><span class="logo">₹</span><span>LoanKaise<span style="color:#08775c">.in</span></span></a>
      <button class="menu-btn" aria-label="Menu">☰</button>
      <div class="navlinks">
        <a href="../../news/">Finance News</a>
        <a href="../../category/loan-blog/">Loan Blog</a>
        <a href="../../mock-test/">Mock Test</a>
        <a href="../../calculators/">Calculator</a>
        <a href="../../#guides">Banking Guides</a>
        <a href="../../contact-us/">Contact</a>
      </div>
    </nav>
  </header>

  <div class="article-wrap" style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;align-items:start">
    <main class="article">
      <div class="breadcrumbs">
        <a href="../../">Home</a> / <a href="../../news/">Finance News</a> / <span>${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</span>
      </div>

      <span class="tag" style="margin-top:0;margin-bottom:10px">${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</span>
      <h1>${escHtml(post.title)}</h1>
      ${post.subtitle ? `<p style="font-size:18px;color:#475569;margin:8px 0 14px;line-height:1.5">${escHtml(post.subtitle)}</p>` : ''}

      <div class="lk-author-strip">
        <span><strong>${escHtml(post.author?.name || 'राहुल शर्मा')}</strong><span class="lk-verified" title="Verified Journalist">✓</span> <small style="color:#64748b">(${escHtml(post.author?.role || 'फाइनेंस न्यूज़ डेस्क')})</small></span>
        <span>•</span>
        <time datetime="${escHtml(post.publishedAt)}">अपडेट: ${formatDateTimeHi(post.publishedAt)}</time>
        <span>•</span>
        <span>${post.readingTimeMinutes || 4} मिनट में पढ़ें</span>
      </div>

      <img
        class="lk-article-hero-img"
        src="${escHtml(post.featuredImage || '/assets/favicon.png')}"
        alt="${escHtml(post.title)}"
        width="1200"
        height="675"
      >

      <div class="notice">
        <b>महत्वपूर्ण सूचना:</b> निवेश, लोन या ब्याज दर से जुड़ा कोई भी निर्णय लेने से पहले संबंधित बैंक, RBI या SEBI रजिस्टर्ड सलाहकार से नियम व शर्तें अवश्य जांच लें।
      </div>

      <div class="entry-content">
        ${bodyHtml}
      </div>

      ${relatedHtml}
    </main>

    <aside class="sidebar" style="display:block">
      <div class="sidebox" style="margin-bottom:16px">
        <h3>ताज़ा फाइनेंस न्यूज़</h3>
        ${related
          .slice(0, 5)
          .map((r) => `<a href="../../news/${r.slug}/">${escHtml(r.title)}</a>`)
          .join('\n')}
      </div>
      <div class="sidebox">
        <h3>फ्री बैंकिंग टूल्स</h3>
        <a href="../../emi-calculator/">EMI Calculator</a>
        <a href="../../loan-eligibility/">Loan Eligibility Check</a>
        <a href="../../prepayment-calculator/">Prepayment Savings</a>
        <a href="../../income-tax-calculator/">Income Tax Calculator</a>
        <a href="../../mock-test/">Banking Mock Test</a>
      </div>
    </aside>
  </div>

  <footer class="footer">
    <div class="footer-inner">
      <div>
        <h3>LoanKaise.in</h3>
        <p>सरल हिंदी में ताज़ा फाइनेंस न्यूज़, practical banking tools और calculators।</p>
      </div>
      <div>
        <h3>Tools</h3>
        <a href="../../news/">Finance News</a>
        <a href="../../mock-test/">Mock Test</a>
        <a href="../../emi-calculator/">EMI Calculator</a>
        <a href="../../loan-eligibility/">Eligibility Calculator</a>
      </div>
      <div>
        <h3>Legal</h3>
        <a href="../../privacy-policy/">Privacy Policy</a>
        <a href="../../editorial-policy/">Editorial Policy</a>
        <a href="../../desclaimer/">Disclaimer</a>
        <a href="../../contact-us/">Contact</a>
      </div>
    </div>
    <div class="copyright">© 2026 LoanKaise.in • Educational &amp; Financial News Portal</div>
  </footer>
  <script src="../../assets/app.js?v=20260726a"></script>
</body>
</html>`;
}

function buildNewsHubPage(allNews, isNewsRoot = false) {
  const prefix = isNewsRoot ? '../' : '../../';
  const canonical = isNewsRoot ? 'https://loankaise.in/news/' : 'https://loankaise.in/category/news/';

  const cardsHtml = allNews
    .map(
      (post) => `<a class="lk-news-card" data-search="${escHtml(post.title + ' ' + (post.categoryLabel || ''))}" href="${prefix}news/${post.slug}/">
        <div class="lk-news-thumb-wrap">
          <img class="lk-news-thumb" src="${escHtml(post.featuredImage || '/assets/favicon.png')}" alt="${escHtml(post.title)}" loading="lazy">
          <span class="lk-news-cat-tag">${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</span>
        </div>
        <div class="lk-news-body">
          <h3 class="lk-news-title">${escHtml(post.title)}</h3>
          <p class="lk-news-excerpt">${escHtml(post.excerpt || '')}</p>
          <div class="lk-news-meta">
            <span>${escHtml(post.author?.name || 'राहुल शर्मा')}<span class="lk-verified">✓</span></span>
            <span>${formatDateHi(post.publishedAt)}</span>
          </div>
        </div>
      </a>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ताज़ा फाइनेंस न्यूज़ हिंदी में (Latest Finance &amp; Loan News) | LoanKaise.in</title>
  <meta name="description" content="RBI, बैंकिंग, लोन, EMI, शेयर बाज़ार, गोल्ड रेट और पर्सनल फाइनेंस से जुड़ी सबसे ताज़ा और सटीक खबरें सरल हिंदी में पढ़ें।">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/assets/favicon.png" sizes="192x192" type="image/png">
  <link rel="stylesheet" href="${prefix}assets/style.css?v=20260726a">
  <link rel="stylesheet" href="${prefix}assets/news.css?v=20261111a">
  <meta name="theme-color" content="#0757d5">
  <meta name="google-adsense-account" content="ca-pub-4298058382758528">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4298058382758528" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-J75EYB646Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-J75EYB646Q');</script>
  <link rel="alternate" type="application/rss+xml" title="LoanKaise.in Updates" href="/feed.xml">
</head>
<body>
  <div class="topline"></div>
  <header class="site-header">
    <nav class="nav">
      <a class="brand" href="${prefix}"><span class="logo">₹</span><span>LoanKaise<span style="color:#08775c">.in</span></span></a>
      <button class="menu-btn" aria-label="Menu">☰</button>
      <div class="navlinks">
        <a href="${prefix}news/">Finance News</a>
        <a href="${prefix}category/loan-blog/">Loan Blog</a>
        <a href="${prefix}mock-test/">Mock Test</a>
        <a href="${prefix}calculators/">Calculator</a>
        <a href="${prefix}#guides">Banking Guides</a>
        <a href="${prefix}contact-us/">Contact</a>
      </div>
    </nav>
  </header>

  <main class="section">
    <div class="breadcrumbs"><a href="${prefix}">Home</a> / Finance News</div>
    <div class="lk-news-head">
      <div>
        <span class="lk-news-badge-live"><span class="lk-ticker-dot" style="background:#dc2626"></span> LIVE HINDI FINANCE DESK</span>
        <h1>ताज़ा फाइनेंस, लोन &amp; बाज़ार समाचार</h1>
      </div>
      <div class="searchbox"><input id="site-search" type="search" placeholder="फाइनेंस न्यूज़ खोजें…"></div>
    </div>

    <div class="lk-news-grid post-list">
      ${cardsHtml || '<p>नई फाइनेंस खबरें लोड हो रही हैं...</p>'}
    </div>
    <div class="empty">कोई समाचार नहीं मिला। कृपया दूसरा शब्द खोजें।</div>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div><h3>LoanKaise.in</h3><p>सरल हिंदी में ताज़ा फाइनेंस न्यूज़, practical banking tools और calculators।</p></div>
      <div><h3>Tools</h3><a href="${prefix}mock-test/">Mock Test</a><a href="${prefix}emi-calculator/">EMI Calculator</a><a href="${prefix}loan-eligibility/">Eligibility Calculator</a></div>
      <div><h3>Legal</h3><a href="${prefix}privacy-policy/">Privacy Policy</a><a href="${prefix}desclaimer/">Disclaimer</a><a href="${prefix}contact-us/">Contact</a></div>
    </div>
    <div class="copyright">© 2026 LoanKaise.in • Educational &amp; Financial News Portal</div>
  </footer>
  <script src="${prefix}assets/app.js?v=20260726a"></script>
</body>
</html>`;
}

function updateHomePage(allNews) {
  const indexPath = path.join(SITE, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  let html = fs.readFileSync(indexPath, 'utf8');

  // Ensure news.css stylesheet link is present
  if (!html.includes('assets/news.css')) {
    html = html.replace(
      '<link rel="stylesheet" href="assets/style.css?v=20260726a">',
      '<link rel="stylesheet" href="assets/style.css?v=20260726a">\n  <link rel="stylesheet" href="assets/news.css?v=20261111a">'
    );
  }

  // Ensure Finance News link is in nav
  if (!html.includes('href="news/"')) {
    html = html.replace(
      '<a href="category/loan-blog/">Loan Blog</a>',
      '<a href="news/">Finance News</a>\n        <a href="category/loan-blog/">Loan Blog</a>'
    );
  }

  // Strip previous injected blocks if any
  html = html.replace(/<!-- LK_TICKER_START -->[\s\S]*?<!-- LK_TICKER_END -->\s*/g, '');
  html = html.replace(/<!-- LK_NEWS_START -->[\s\S]*?<!-- LK_NEWS_END -->\s*/g, '');

  const topForTicker = allNews.slice(0, 8);
  const topForGrid = allNews.slice(0, 9);

  if (allNews.length > 0) {
    const tickerLinks = topForTicker
      .map(
        (p) =>
          `<a class="lk-ticker-item" href="news/${p.slug}/"><span class="lk-ticker-cat">[${escHtml(p.categoryLabel || 'न्यूज़')}]</span><span>${escHtml(p.title)}</span></a>`
      )
      .join('');

    const tickerBlock = `<!-- LK_TICKER_START -->
  <div class="lk-ticker-bar">
    <div class="lk-ticker-inner">
      <div class="lk-ticker-badge"><span class="lk-ticker-dot"></span><span>ताज़ा न्यूज़</span></div>
      <div class="lk-ticker-viewport">
        <div class="lk-ticker-track">
          ${tickerLinks}
          ${tickerLinks}
        </div>
      </div>
    </div>
  </div>
  <!-- LK_TICKER_END -->\n`;

    html = html.replace('<main>', `${tickerBlock}  <main>`);

    const cardsHtml = topForGrid
      .map(
        (post) => `<a class="lk-news-card" href="news/${post.slug}/">
          <div class="lk-news-thumb-wrap">
            <img class="lk-news-thumb" src="${escHtml(post.featuredImage || 'assets/favicon.png').replace(/^\//, '')}" alt="${escHtml(post.title)}" loading="lazy">
            <span class="lk-news-cat-tag">${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</span>
          </div>
          <div class="lk-news-body">
            <h3 class="lk-news-title">${escHtml(post.title)}</h3>
            <p class="lk-news-excerpt">${escHtml(post.excerpt || '')}</p>
            <div class="lk-news-meta">
              <span>${escHtml(post.author?.name || 'राहुल शर्मा')}<span class="lk-verified">✓</span></span>
              <span>${formatDateHi(post.publishedAt)}</span>
            </div>
          </div>
        </a>`
      )
      .join('\n');

    const newsBlock = `<!-- LK_NEWS_START -->
    <section class="lk-news-section" id="latest-finance-news">
      <div class="lk-news-head">
        <div>
          <span class="lk-news-badge-live"><span class="lk-ticker-dot" style="background:#dc2626"></span> LIVE HINDI FINANCE NEWS</span>
          <h2>ताज़ा फाइनेंस, बैंकिंग और मार्केट न्यूज़</h2>
        </div>
        <a class="btn home-blue-btn" href="news/" style="padding:10px 16px;font-size:14px">सभी न्यूज़ पढ़ें (${allNews.length}) →</a>
      </div>
      <div class="lk-news-grid">
        ${cardsHtml}
      </div>
    </section>
    <!-- LK_NEWS_END -->\n\n`;

    // Insert right before <section class="home-section home-wrap" id="calculators">
    if (html.includes('<section class="home-section home-wrap" id="calculators">')) {
      html = html.replace(
        '<section class="home-section home-wrap" id="calculators">',
        `${newsBlock}    <section class="home-section home-wrap" id="calculators">`
      );
    } else {
      html = html.replace('<main>', `<main>\n${newsBlock}`);
    }
  }

  fs.writeFileSync(indexPath, html, 'utf8');
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
  return guides;
}

function buildManifest(allNews) {
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  const legacyGuides = collectLegacyGuides();
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

  // 1. Google News Sitemap (last 48h / latest 50 news stories)
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

  // 2. Append new /news/ URLs cleanly into site/sitemap.xml if not already present
  const sitemapPath = path.join(SITE, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sm = fs.readFileSync(sitemapPath, 'utf8');
    // Remove previously auto-generated news entries to regenerate cleanly
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

  // 3. Update feed.xml with latest 30 items (news first, then guides)
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

  // Build individual /news/<slug>/index.html pages
  for (const post of allNews) {
    const dir = path.join(SITE, 'news', post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildArticlePage(post, allNews), 'utf8');
  }

  // Build /news/index.html & /category/news/index.html
  fs.mkdirSync(path.join(SITE, 'news'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'news', 'index.html'), buildNewsHubPage(allNews, true), 'utf8');
  fs.mkdirSync(path.join(SITE, 'category', 'news'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'category', 'news', 'index.html'), buildNewsHubPage(allNews, false), 'utf8');

  // Update homepage
  updateHomePage(allNews);

  // Build full manifest (all news + all legacy guides) for /admin pagination
  const manifest = buildManifest(allNews);

  // Build RSS & Sitemaps
  buildSitemapsAndRss(allNews, manifest);

  console.log(`[build_news_site] Built ${allNews.length} Hindi finance news pages, ${manifest.length} total posts in manifest.`);
  return { newsCount: allNews.length, totalManifestCount: manifest.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildAll();
}
