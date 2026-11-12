#!/usr/bin/env node
/**
 * LoanKaise.in — Scoped HollywoodTime Masthead & Dark Footer Restyler for All Legacy Pages/Guides/Calculators
 * Preserves 100% of page content, calculators, scripts, adsbygoogle slots, canonicals, and schema.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escHtml, renderMarketAlertStrip } from './editorial_theme.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA_FILE = path.join(ROOT, 'data', 'news-posts.json');

function buildScopedHeader(trendingStories = []) {
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const ticker = trendingStories.slice(0, 6);
  const tickerLinks = ticker.length
    ? [...ticker, ...ticker]
        .map(
          (st) =>
            `<a href="/news/${escHtml(st.slug)}/"><span class="ht-marquee-cat">[${escHtml(st.categoryLabel || 'FINANCE')}]</span><span>${escHtml(st.title)}</span></a>`
        )
        .join('')
    : `<a href="/news/"><span class="ht-marquee-cat">[FINANCE]</span><span>ताज़ा RBI, लोन EMI, शेयर बाज़ार और पर्सनल फाइनेंस अपडेट्स पढ़ें</span></a>`;

  return `<!-- LK_HT_HEADER_START -->
<header class="ht-header">
  <div class="ht-topbar">
    <div class="ht-topbar-inner">
      <div class="ht-date"><strong>${escHtml(formattedDate)}</strong><span>•</span><span class="ht-loc">IN</span></div>
      <div class="ht-ticker-wrap">
        <div class="ht-trending-badge"><span class="ht-trending-dot"></span><span>TRENDING</span></div>
        <div class="ht-marquee-viewport"><div class="ht-marquee-track">${tickerLinks}</div></div>
      </div>
      <div class="ht-toplinks">
        <a href="/aabout-us/">About</a>
        <a href="/editorial-policy/">Standards</a>
        <a href="/contact-us/">Contact</a>
        <a href="/feed.xml" target="_blank" class="ht-rss">RSS</a>
      </div>
    </div>
  </div>
  <div class="ht-masthead">
    <a href="/" class="ht-brand-link">
      <div class="ht-brand-title-row">
        <span class="ht-diamond"></span>
        <span class="ht-brand-name">LOANKAISE<span style="color:#dc2626">.IN</span></span>
      </div>
      <div class="ht-tagline-row">
        <span class="ht-tagline-line"></span>
        <p class="ht-tagline">Hindi Finance News, Banking &amp; Loan Intelligence</p>
        <span class="ht-tagline-line"></span>
      </div>
    </a>
  </div>
  <nav class="ht-nav">
    <ul class="ht-nav-list">
      <li><a href="/">HOME</a></li>
      <li><a href="/news/">FINANCE NEWS</a></li>
      <li><a href="/category/news/">बैंकिंग &amp; मार्केट</a></li>
      <li><a href="/category/loan-blog/">LOAN BLOG</a></li>
      <li><a href="/calculators/">CALCULATORS</a></li>
      <li><a href="/emi-calculator/">EMI TOOL</a></li>
      <li><a href="/mock-test/">MOCK TEST</a></li>
      <li><a href="/#guides">GUIDES</a></li>
    </ul>
  </nav>
</header>
${renderMarketAlertStrip(trendingStories)}
<!-- LK_HT_HEADER_END -->`;
}

function buildScopedFooter() {
  return `<!-- LK_HT_FOOTER_START -->
<footer class="ht-footer">
  <div class="ht-footer-inner">
    <div class="ht-footer-wire">
      <div style="display:flex;align-items:center;gap:12px">
        <span class="ht-wire-badge">Independent Finance Wire</span>
        <span style="color:#3f3f46;font-family:'Lora',serif;font-style:italic;font-size:13px">बैंकिंग, लोन, शेयर बाज़ार और पर्सनल फाइनेंस न्यूज़</span>
      </div>
      <div style="font-size:11px;color:#52525b;text-transform:uppercase;letter-spacing:0.08em">
        <span style="color:#09090b;font-weight:700">● India Edition</span> • Updated Every 5 Min
      </div>
    </div>
    <div class="ht-footer-grid">
      <div>
        <a href="/" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;margin-bottom:10px">
          <span class="ht-diamond"></span>
          <span style="font-family:'Lora',serif;font-size:24px;font-weight:900;color:#09090b;letter-spacing:-0.02em">LOANKAISE<span style="color:#dc2626">.IN</span></span>
        </a>
        <p style="font-size:13px;color:#52525b;font-family:'Lora',serif;line-height:1.65;max-width:380px;margin:0">
          LoanKaise.in भारत का स्वतंत्र हिंदी फाइनेंस न्यूज़ और बैंकिंग पोर्टल है — जहाँ RBI नियम, लोन, म्यूचुअल फंड, टैक्स और 40+ मुफ़्त कैलकुलेटर सरल भाषा में मिलते हैं।
        </p>
      </div>
      <div>
        <h3>Departments &amp; Tools</h3>
        <ul class="ht-footer-links">
          <li><a href="/news/">Finance News</a></li>
          <li><a href="/calculators/">All Calculators</a></li>
          <li><a href="/emi-calculator/">EMI Calculator</a></li>
          <li><a href="/loan-eligibility/">Loan Eligibility</a></li>
          <li><a href="/mock-test/">Mock Tests</a></li>
          <li><a href="/category/loan-blog/">Loan Blog</a></li>
        </ul>
      </div>
      <div>
        <h3>Legal &amp; Compliance</h3>
        <ul class="ht-footer-links">
          <li><a href="/aabout-us/">› About LoanKaise</a></li>
          <li><a href="/editorial-policy/">› Editorial Standards</a></li>
          <li><a href="/privacy-policy/">› Privacy Policy</a></li>
          <li><a href="/terms-and-conditions/">› Terms of Service</a></li>
          <li><a href="/desclaimer/">› Disclaimer</a></li>
          <li><a href="/contact-us/">› Contact &amp; Newsroom</a></li>
        </ul>
      </div>
    </div>
    <div class="ht-footer-bottom">
      <p style="margin:0">© 2026 LoanKaise.in. All rights reserved.</p>
      <div style="display:flex;gap:18px;font-size:11px">
        <a href="/privacy-policy/">Privacy Policy</a>
        <a href="/terms-and-conditions/">Terms</a>
        <a href="/editorial-policy/">Editorial Code</a>
        <a href="/feed.xml">RSS Feed</a>
      </div>
    </div>
  </div>
</footer>
<script src="/assets/market-ticker.js?v=20261112e" defer></script>
<!-- LK_HT_FOOTER_END -->`;
}

function collectHtmlFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip files generated directly by build_news_site.mjs (homepage, news, category/news)
      const rel = path.relative(SITE, full);
      if (rel === 'news' || rel === `category${path.sep}news` || rel === 'assets' || rel === 'uploads' || rel === 'data') {
        continue;
      }
      collectHtmlFiles(full, results);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const rel = path.relative(SITE, full);
      if (rel === 'index.html' || rel.startsWith('tools' + path.sep + 'banking-mock-test')) continue;
      results.push(full);
    }
  }
  return results;
}

export function restyleAllLegacyPages(allNews = null) {
  let newsList = allNews;
  if (!newsList && fs.existsSync(DATA_FILE)) {
    try {
      newsList = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      newsList = [];
    }
  }
  newsList = Array.isArray(newsList) ? newsList : [];

  const headerHtml = buildScopedHeader(newsList);
  const footerHtml = buildScopedFooter();
  const files = collectHtmlFiles(SITE);

  let updatedCount = 0;
  for (const filePath of files) {
    let html = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Inject or cache-bust hollywood-shell.css inside <head>
    const cssVer = '20261112d';
    const cssTag = `<link rel="stylesheet" href="/assets/hollywood-shell.css?v=${cssVer}">`;
    if (!html.includes('hollywood-shell.css')) {
      html = html.replace('</head>', `  ${cssTag}\n</head>`);
      changed = true;
    } else if (!html.includes(`hollywood-shell.css?v=${cssVer}`)) {
      html = html.replace(/hollywood-shell\.css(\?v=[^"'\s>]+)?/g, `hollywood-shell.css?v=${cssVer}`);
      changed = true;
    }

    // 2. Replace header (either old .topline + .site-header OR previous LK_HT_HEADER marker)
    if (html.includes('<!-- LK_HT_HEADER_START -->')) {
      const next = html.replace(/<!-- LK_HT_HEADER_START -->[\s\S]*?<!-- LK_HT_HEADER_END -->/, headerHtml);
      if (next !== html) {
        html = next;
        changed = true;
      }
    } else if (/<header class="site-header">[\s\S]*?<\/header>/i.test(html)) {
      const next = html.replace(/(?:<div class="topline"><\/div>\s*)?<header class="site-header">[\s\S]*?<\/header>/i, headerHtml);
      if (next !== html) {
        html = next;
        changed = true;
      }
    }

    // 3. Replace footer (either old <footer class="footer">...</footer> OR previous LK_HT_FOOTER marker)
    if (html.includes('<!-- LK_HT_FOOTER_START -->')) {
      const next = html.replace(/<!-- LK_HT_FOOTER_START -->[\s\S]*?<!-- LK_HT_FOOTER_END -->/, footerHtml);
      if (next !== html) {
        html = next;
        changed = true;
      }
    } else if (/<footer class="footer">[\s\S]*?<\/footer>/i.test(html)) {
      const next = html.replace(/<footer class="footer">[\s\S]*?<\/footer>/i, footerHtml);
      if (next !== html) {
        html = next;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, html, 'utf8');
      updatedCount++;
    }
  }

  console.log(`[restyle_legacy_pages] Applied HollywoodTime header/footer/shell across ${updatedCount}/${files.length} legacy HTML pages.`);
  return updatedCount;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  restyleAllLegacyPages();
}
