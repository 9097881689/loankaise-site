/**
 * LoanKaise.in — Editorial Design System (Exact match to https://hollywoodtime.pages.dev/)
 * Used by scripts/build_news_site.mjs for Homepage, Finance News Hub, Category Hub, and News Articles.
 */

export function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDateEnIn(iso) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return String(iso || '').slice(0, 10);
  }
}

export function formatDateTimeHi(iso) {
  try {
    return (
      new Intl.DateTimeFormat('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(iso)) + ' IST'
    );
  } catch {
    return String(iso || '');
  }
}

export function getAuthorAvatarSvg(name = 'राहुल शर्मा') {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#18181b"/><text x="40" y="48" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="700" font-size="26">${initials || 'LK'}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const NAV_ITEMS = [
  { key: 'home', label: 'HOME', href: '/' },
  { key: 'news', label: 'FINANCE NEWS', href: '/news/' },
  { key: 'banking-rbi', label: 'बैंकिंग & RBI', href: '/category/news/#banking-rbi' },
  { key: 'loans-emi', label: 'लोन & EMI', href: '/category/news/#loans-emi' },
  { key: 'markets', label: 'शेयर बाज़ार', href: '/category/news/#markets' },
  { key: 'personal-finance', label: 'पर्सनल फाइनेंस', href: '/category/news/#personal-finance' },
  { key: 'calculators', label: 'CALCULATORS', href: '/calculators/' },
  { key: 'mock-test', label: 'MOCK TEST', href: '/mock-test/' },
  { key: 'guides', label: 'GUIDES', href: '/#guides' },
];

export function renderMarketAlertStrip() {
  const placeholders = [
    '<a class="lk-al-item" href="/news/"><span class="lk-al-badge lk-al-surge">📈 INDIA</span><span class="lk-mkt-sym">NIFTY 50 • SENSEX • BANK NIFTY Live Updates</span><span class="lk-sep">•</span></a>',
    '<a class="lk-al-item" href="/news/"><span class="lk-al-badge">🌍 GLOBAL</span><span class="lk-txt-news">NASDAQ • S&amp;P 500 • GOLD • CRUDE OIL • USD/INR</span><span class="lk-sep">•</span></a>',
    '<a class="lk-al-item" href="/news/"><span class="lk-al-badge lk-al-drop">⚡ MARKET RADAR</span><span class="lk-txt-news">शेयर बाज़ार में बड़ा उछाल, गिरावट और स्टॉक वॉच लोड हो रहा है...</span><span class="lk-sep">•</span></a>',
  ];
  const initialAlerts = [...placeholders, ...placeholders].join('');

  return `<section class="lk-mkt-bar" aria-label="Live Stock Market Alerts">
  <div class="lk-mkt-inner">
    <span id="lk-mkt-status-pill" class="lk-mkt-pill lk-pill-live">● MARKET LIVE</span>
    <div class="lk-al-viewport">
      <div id="lk-mkt-alert-track" class="lk-al-track">${initialAlerts}</div>
    </div>
  </div>
</section>`;
}

export function renderEditorialHeader({ currentKey = 'home', trendingStories = [] } = {}) {
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const ticker = trendingStories.slice(0, 6);
  const tickerItems = ticker.length
    ? [...ticker, ...ticker]
        .map(
          (st) => `<a href="/news/${escHtml(st.slug)}/" class="inline-flex items-center space-x-1.5 text-zinc-800 hover:text-red-600 transition group">
              <span class="text-red-600 font-sans font-black text-[10px] uppercase tracking-wider group-hover:underline">[${escHtml(st.categoryLabel || 'FINANCE')}]</span>
              <span class="text-zinc-900 group-hover:text-red-600 transition-colors duration-150">${escHtml(st.title)}</span>
              <span class="text-zinc-400 ml-3">•</span>
            </a>`
        )
        .join('')
    : `<a href="/news/" class="inline-flex items-center space-x-1.5 text-zinc-800 hover:text-red-600 transition"><span class="text-red-600 font-sans font-black text-[10px] uppercase">[FINANCE]</span><span>ताज़ा RBI, लोन EMI, शेयर बाज़ार और पर्सनल फाइनेंस अपडेट्स पढ़ें</span></a>`;

  return `<header class="w-full bg-white sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
  <div class="bg-zinc-100 text-zinc-800 py-1.5 px-4 sm:px-8 border-b border-zinc-200 overflow-hidden select-none">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px]">
      <div class="flex-shrink-0 hidden md:flex items-center space-x-2 text-[10px] text-zinc-500 font-medium">
        <span class="text-zinc-950 font-bold uppercase">${escHtml(formattedDate)}</span>
        <span class="text-zinc-400">•</span>
        <span class="text-red-600 font-bold">IN</span>
      </div>

      <div class="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
        <div class="flex-shrink-0 flex items-center space-x-1 bg-red-600 px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-widest text-white shadow-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span>TRENDING</span>
        </div>
        <div class="relative w-full overflow-hidden whitespace-nowrap">
          <div class="marquee-track flex items-center space-x-6 text-[13px] font-serif">
            ${tickerItems}
          </div>
        </div>
      </div>

      <div class="flex-shrink-0 hidden lg:flex items-center space-x-3 text-[10px] text-zinc-600 font-semibold">
        <a href="/aabout-us/" class="hover:text-zinc-950 transition">About</a>
        <a href="/editorial-policy/" class="hover:text-zinc-950 transition">Standards</a>
        <a href="/contact-us/" class="hover:text-zinc-950 transition">Contact</a>
        <a href="/feed.xml" target="_blank" class="text-red-600 hover:text-red-700 transition font-bold flex items-center gap-1">
          <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/></svg>
          RSS
        </a>
      </div>
    </div>
  </div>

  <div class="py-3 sm:py-3.5 px-4 sm:px-8 bg-white border-b border-zinc-200">
    <div class="max-w-7xl mx-auto flex items-center justify-center text-center">
      <div class="group">
        <a href="/" class="inline-flex flex-col items-center">
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2.5 h-2.5 bg-red-600 transform rotate-45 mb-1 shadow-xs"></span>
            <span class="text-2xl sm:text-3xl md:text-[42px] font-black font-serif tracking-tight text-zinc-950 uppercase group-hover:text-red-600 transition-colors duration-150 leading-none">
              LOANKAISE<span class="text-red-600">.IN</span>
            </span>
          </div>
          <div class="flex items-center space-x-2 mt-1">
            <span class="h-[1px] w-6 sm:w-10 bg-zinc-300"></span>
            <p class="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 font-sans">
              Hindi Finance News, Banking &amp; Loan Intelligence
            </p>
            <span class="h-[1px] w-6 sm:w-10 bg-zinc-300"></span>
          </div>
        </a>
      </div>
    </div>
  </div>

  <nav class="bg-white border-b border-zinc-950">
    <div class="max-w-7xl mx-auto px-4 sm:px-8">
      <ul class="flex items-center justify-start sm:justify-center space-x-2 sm:space-x-5 overflow-x-auto py-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase no-scrollbar">
        ${NAV_ITEMS.map((item) => {
          const isActive = currentKey === item.key;
          return `<li><a href="${item.href}" class="px-2 py-0.5 block whitespace-nowrap transition-colors duration-150 ${
            isActive ? 'text-red-600 font-black border-b-2 border-red-600' : 'text-zinc-900 hover:text-red-600'
          }">${item.label}</a></li>`;
        }).join('')}
      </ul>
    </div>
  </nav>
</header>
${renderMarketAlertStrip(trendingStories)}`;
}

export function renderEditorialFooter() {
  return `<footer class="bg-zinc-50 text-zinc-900 pt-12 pb-12 border-t-2 border-zinc-950 mt-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-8">
    <div class="pb-8 mb-10 border-b border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center space-x-3">
        <span class="px-2.5 py-1 bg-red-50 text-red-600 font-bold uppercase tracking-widest text-[10px] rounded-xs border border-red-200">
          Independent Finance Wire
        </span>
        <span class="text-zinc-700 font-serif italic text-xs sm:text-sm">
          बैंकिंग, लोन, शेयर बाज़ार और पर्सनल फाइनेंस न्यूज़
        </span>
      </div>

      <div class="flex items-center space-x-4 text-xs text-zinc-500">
        <span class="flex items-center gap-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          India Edition
        </span>
        <span class="text-zinc-300">•</span>
        <span class="text-zinc-600 text-[11px] uppercase tracking-wider font-medium">Updated Every 5 Min</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-zinc-200">
      <div class="md:col-span-5 space-y-4">
        <a href="/" class="inline-flex items-center space-x-2 group">
          <span class="inline-block w-3 h-3 bg-red-600 transform rotate-45"></span>
          <span class="text-2xl sm:text-3xl font-black font-serif tracking-tight uppercase text-zinc-950 group-hover:text-red-600 transition">
            LOANKAISE<span class="text-red-600">.IN</span>
          </span>
        </a>
        <p class="text-xs sm:text-sm text-zinc-600 font-serif leading-relaxed max-w-sm">
          LoanKaise.in भारत का स्वतंत्र हिंदी फाइनेंस न्यूज़ और बैंकिंग पोर्टल है — जहाँ RBI नियम, होम/पर्सनल लोन, म्यूचुअल फंड, टैक्स बचत और 40+ मुफ़्त कैलकुलेटर सरल भाषा में मिलते हैं।
        </p>
        <p class="text-[11px] text-zinc-500">
          Published in Hindi &amp; English • Financial Education &amp; Breaking Coverage.
        </p>
      </div>

      <div class="md:col-span-3 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-900 border-b border-zinc-200 pb-2">
          Departments &amp; Tools
        </h3>
        <ul class="grid grid-cols-2 gap-y-2 text-xs text-zinc-700">
          <li><a href="/news/" class="hover:text-red-600 transition">Finance News</a></li>
          <li><a href="/calculators/" class="hover:text-red-600 transition">All Calculators</a></li>
          <li><a href="/emi-calculator/" class="hover:text-red-600 transition">EMI Calculator</a></li>
          <li><a href="/loan-eligibility/" class="hover:text-red-600 transition">Eligibility</a></li>
          <li><a href="/mock-test/" class="hover:text-red-600 transition">Mock Tests</a></li>
          <li><a href="/category/loan-blog/" class="hover:text-red-600 transition">Loan Blog</a></li>
          <li><a href="/#guides" class="hover:text-red-600 transition">Hindi Guides</a></li>
          <li><a href="/application-generator/" class="hover:text-red-600 transition">App Generator</a></li>
        </ul>
      </div>

      <div class="md:col-span-4 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-900 border-b border-zinc-200 pb-2">
          Legal &amp; Compliance
        </h3>
        <ul class="space-y-2 text-xs text-zinc-700">
          <li><a href="/aabout-us/" class="hover:text-red-600 transition flex items-center gap-1.5"><span class="text-zinc-400">›</span> About LoanKaise</a></li>
          <li><a href="/editorial-policy/" class="hover:text-red-600 transition flex items-center gap-1.5"><span class="text-zinc-400">›</span> Editorial Standards</a></li>
          <li><a href="/privacy-policy/" class="hover:text-red-600 transition flex items-center gap-1.5"><span class="text-zinc-400">›</span> Privacy Policy</a></li>
          <li><a href="/terms-and-conditions/" class="hover:text-red-600 transition flex items-center gap-1.5"><span class="text-zinc-400">›</span> Terms of Service</a></li>
          <li><a href="/desclaimer/" class="hover:text-red-600 transition flex items-center gap-1.5"><span class="text-zinc-400">›</span> Disclaimer</a></li>
          <li><a href="/contact-us/" class="hover:text-red-600 transition flex items-center gap-1.5"><span class="text-zinc-400">›</span> Contact &amp; Newsroom</a></li>
        </ul>
      </div>
    </div>

    <div class="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
      <p>© 2026 LoanKaise.in. All rights reserved.</p>
      <div class="flex items-center space-x-6 text-[11px]">
        <a href="/privacy-policy/" class="hover:text-zinc-900 transition">Privacy Policy</a>
        <a href="/terms-and-conditions/" class="hover:text-zinc-900 transition">Terms</a>
        <a href="/editorial-policy/" class="hover:text-zinc-900 transition">Editorial Code</a>
        <a href="/feed.xml" class="hover:text-zinc-900 transition">RSS Feed</a>
      </div>
    </div>
  </div>
</footer>`;
}

export function renderArticleCard(post, variant = 'standard') {
  const dateString = formatDateEnIn(post.publishedAt);
  const href = `/news/${escHtml(post.slug)}/`;
  const catHref = `/category/news/#${escHtml(post.category || 'personal-finance')}`;
  const authorName = post.author?.name || post.authorName || 'राहुल शर्मा';
  const imgSrc = escHtml(post.featuredImage || '/assets/favicon.png');

  if (variant === 'lead') {
    return `<article class="group flex flex-col space-y-4">
  <div class="relative overflow-hidden aspect-[16/9] max-h-[380px] bg-gray-100 rounded-xl shadow-xs">
    <a href="${href}">
      <img src="${imgSrc}" alt="${escHtml(post.title)}" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500 ease-out" loading="eager" />
    </a>
    <span class="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest bg-red-600 text-white shadow-md rounded-xs">
      ${escHtml(post.badge || 'BREAKING')}
    </span>
  </div>
  <div class="space-y-2.5">
    <div class="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-600">
      <a href="${catHref}" class="hover:underline">${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</a>
      <span class="text-gray-400">•</span>
      <span class="text-gray-500 font-normal">${post.readingTimeMinutes || 4} MIN READ</span>
    </div>
    <h2 class="text-2xl sm:text-3xl md:text-[34px] font-serif font-bold text-zinc-950 leading-[1.24] tracking-[-0.02em] group-hover:text-red-600 transition-colors duration-200">
      <a href="${href}">${escHtml(post.title)}</a>
    </h2>
    <p class="text-zinc-700 text-sm sm:text-base leading-relaxed font-sans line-clamp-3">
      ${escHtml(post.excerpt || post.subtitle || '')}
    </p>
    <div class="pt-2 text-xs text-zinc-500 flex items-center space-x-2">
      <span class="font-semibold text-zinc-900 flex items-center gap-1.5 text-xs">
        By ${escHtml(authorName)}
        <span class="w-3.5 h-3.5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[9px] font-black" title="Verified Staff Reporter">✓</span>
      </span>
      <span class="text-gray-300">•</span>
      <time datetime="${escHtml(post.publishedAt)}" class="text-zinc-500">${escHtml(dateString)}</time>
    </div>
  </div>
</article>`;
  }

  if (variant === 'compact') {
    return `<article class="group py-3.5 first:pt-0 last:pb-0 flex items-start space-x-3.5">
  <div class="w-24 h-16 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg shadow-xs">
    <a href="${href}">
      <img src="${imgSrc}" alt="${escHtml(post.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300 ease-out" loading="lazy" />
    </a>
  </div>
  <div class="flex-1 min-w-0 space-y-1">
    <span class="text-[10px] font-bold uppercase tracking-widest text-red-600">${escHtml(post.categoryLabel || 'फाइनेंस')}</span>
    <h3 class="text-sm font-serif font-bold text-zinc-950 leading-snug group-hover:text-red-600 transition-colors duration-150 line-clamp-2">
      <a href="${href}">${escHtml(post.title)}</a>
    </h3>
    <div class="text-[11px] text-zinc-500 flex items-center gap-1.5 truncate">
      <span class="font-medium text-zinc-700">By ${escHtml(authorName)}</span>
      <span class="text-zinc-400">•</span>
      <time datetime="${escHtml(post.publishedAt)}">${escHtml(dateString)}</time>
    </div>
  </div>
</article>`;
  }

  return `<article class="group flex flex-col h-full bg-white border border-gray-100 hover:border-gray-300 transition duration-200 p-3 sm:p-4 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md" data-search="${escHtml(post.title + ' ' + (post.categoryLabel || '') + ' ' + authorName)}">
  <div class="relative overflow-hidden aspect-[16/10] max-h-[195px] bg-gray-100 mb-3 rounded-lg shadow-xs">
    <a href="${href}">
      <img src="${imgSrc}" alt="${escHtml(post.title)}" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-300 ease-out" loading="lazy" />
    </a>
    ${post.badge ? `<span class="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-xs">${escHtml(post.badge)}</span>` : ''}
  </div>
  <div class="flex-1 flex flex-col justify-between space-y-2">
    <div class="space-y-1.5">
      <div class="text-[11px] font-bold uppercase tracking-widest text-red-600">
        <a href="${catHref}" class="hover:underline">${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</a>
      </div>
      <h3 class="text-lg sm:text-[19px] font-serif font-bold text-zinc-950 leading-[1.3] tracking-[-0.01em] group-hover:text-red-600 transition-colors duration-150 line-clamp-2">
        <a href="${href}">${escHtml(post.title)}</a>
      </h3>
      <p class="text-xs sm:text-sm text-zinc-600 line-clamp-2 font-sans leading-relaxed">
        ${escHtml(post.excerpt || post.subtitle || '')}
      </p>
    </div>
    <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-zinc-500">
      <span class="font-semibold text-zinc-800 flex items-center gap-1.5 truncate max-w-[180px]">
        By ${escHtml(authorName)}
        <span class="w-3 h-3 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[7px] font-black flex-shrink-0" title="Verified Staff Reporter">✓</span>
      </span>
      <time datetime="${escHtml(post.publishedAt)}" class="text-zinc-500 flex-shrink-0">${escHtml(dateString)}</time>
    </div>
  </div>
</article>`;
}

function renderAdBanner(slot = '9974716573') {
  return `<div class="ad-slot"><span class="ad-label">ADVERTISEMENT</span><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4298058382758528" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
}

function renderPageDocument({ title, description, canonical, ogImage, schemaJson, currentKey, trendingStories, bodyHtml, extraScripts = '' }) {
  return `<!doctype html>
<html lang="hi" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/assets/favicon.png" sizes="192x192" type="image/png" />
  <link rel="apple-touch-icon" href="/assets/favicon.png" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${escHtml(canonical)}" />
  <meta property="og:type" content="${ogImage ? 'article' : 'website'}" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(description)}" />
  <meta property="og:url" content="${escHtml(canonical)}" />
  <meta property="og:site_name" content="LoanKaise.in" />
  <meta property="og:locale" content="hi_IN" />
  ${ogImage ? `<meta property="og:image" content="${escHtml(ogImage)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${escHtml(description)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escHtml(ogImage)}" />` : ''}
  <meta name="theme-color" content="#09090b" />
  <meta name="google-adsense-account" content="ca-pub-4298058382758528" />
  <link rel="alternate" type="application/rss+xml" title="LoanKaise.in Updates" href="/feed.xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/admin.css?v=20261112d" />
  ${schemaJson ? `<script type="application/ld+json">${schemaJson}</script>` : ''}
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4298058382758528" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-J75EYB646Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-J75EYB646Q');</script>
</head>
<body class="bg-white text-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-hollywood-red selection:text-white">
  ${renderEditorialHeader({ currentKey, trendingStories })}
  <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
    ${bodyHtml}
  </main>
  ${renderEditorialFooter()}
  <script src="/assets/market-ticker.js?v=20261112d" defer></script>
  ${extraScripts}
</body>
</html>`;
}

export function renderEditorialHomeHtml({ allNews, legacyGuides }) {
  const leadPost = allNews[0];
  const breakingPosts = allNews.slice(1, 5);
  const moreNews = allNews.slice(5, 11);

  const heroHtml = leadPost
    ? `<section class="border-b border-zinc-200 pb-10 mb-8">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    <div class="lg:col-span-7">
      ${renderArticleCard(leadPost, 'lead')}
    </div>
    <div class="lg:col-span-5 bg-zinc-50/80 border border-zinc-200/80 p-5 sm:p-6 rounded-xl shadow-xs">
      <div class="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5 mb-4">
        <h2 class="text-sm font-serif font-black uppercase tracking-wider text-zinc-950 flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 bg-red-600 rotate-45"></span>
          ताज़ा फाइनेंस हेडलाइंस
        </h2>
        <span class="text-[10px] uppercase font-bold text-red-600 tracking-widest bg-red-50 px-2 py-0.5 rounded border border-red-200">
          REAL-TIME
        </span>
      </div>
      <div class="divide-y divide-zinc-200">
        ${breakingPosts.map((p) => renderArticleCard(p, 'compact')).join('')}
      </div>
      <div class="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-xs font-bold">
        <span class="text-zinc-500">Top 10 Finance Portals • Mixed</span>
        <a href="/news/" class="text-red-600 hover:text-red-800 uppercase tracking-wider">सभी खबरें देखें →</a>
      </div>
    </div>
  </div>
</section>`
    : '';

  const categorySectionHtml = `
<section class="py-6 border-b border-zinc-200">
  <div class="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5 mb-6">
    <div class="flex items-center space-x-3">
      <span class="w-2.5 h-6 bg-red-600 inline-block"></span>
      <h2 class="text-xl sm:text-2xl font-serif font-bold text-zinc-950 tracking-tight">प्रमुख फाइनेंस न्यूज़ (Top Stories)</h2>
      <span class="text-xs font-semibold text-zinc-400 uppercase tracking-widest pl-3 border-l border-zinc-300 hidden sm:inline">Latest Dispatches</span>
    </div>
    <a href="/news/" class="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-800 transition flex items-center gap-1.5 group">
      <span>Explore Finance News</span><span class="transform group-hover:translate-x-1 transition duration-150">→</span>
    </a>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    ${(moreNews.length ? moreNews : allNews.slice(0, 3)).map((p) => renderArticleCard(p, 'standard')).join('')}
  </div>
</section>`;

  const toolsSectionHtml = `
<section class="py-8 border-b border-zinc-200">
  <div class="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5 mb-6">
    <div class="flex items-center space-x-3">
      <span class="w-2.5 h-6 bg-red-600 inline-block"></span>
      <h2 class="text-xl sm:text-2xl font-serif font-bold text-zinc-950 tracking-tight">बैंकिंग कैलकुलेटर &amp; मॉक टेस्ट</h2>
      <span class="text-xs font-semibold text-zinc-400 uppercase tracking-widest pl-3 border-l border-zinc-300 hidden sm:inline">40+ Free Finance Tools</span>
    </div>
    <a href="/calculators/" class="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-800 transition">All 40+ Tools →</a>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <a href="/emi-calculator/" class="group bg-white border border-zinc-200 hover:border-red-600 p-5 rounded-xl transition shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md">
      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Calculator</span>
      <h3 class="text-lg font-serif font-bold text-zinc-950 group-hover:text-red-600 mt-1">Loan EMI Calculator</h3>
      <p class="text-xs text-zinc-600 mt-1.5">होम लोन, पर्सनल लोन और कार लोन की मासिक EMI व कुल ब्याज तुरंत निकालें।</p>
    </a>
    <a href="/loan-eligibility/" class="group bg-white border border-zinc-200 hover:border-red-600 p-5 rounded-xl transition shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md">
      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Eligibility</span>
      <h3 class="text-lg font-serif font-bold text-zinc-950 group-hover:text-red-600 mt-1">Loan Eligibility Check</h3>
      <p class="text-xs text-zinc-600 mt-1.5">सैलरी और मौजूदा EMI के हिसाब से जानें बैंक से कितना लोन मिल सकता है।</p>
    </a>
    <a href="/prepayment-calculator/" class="group bg-white border border-zinc-200 hover:border-red-600 p-5 rounded-xl transition shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md">
      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Savings</span>
      <h3 class="text-lg font-serif font-bold text-zinc-950 group-hover:text-red-600 mt-1">Prepayment Savings Tool</h3>
      <p class="text-xs text-zinc-600 mt-1.5">एक्स्ट्रा पेमेंट से लोन टेन्योर और ब्याज में होने वाली बचत का सटीक हिसाब।</p>
    </a>
    <a href="/income-tax-calculator/" class="group bg-white border border-zinc-200 hover:border-red-600 p-5 rounded-xl transition shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md">
      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Tax Tool</span>
      <h3 class="text-lg font-serif font-bold text-zinc-950 group-hover:text-red-600 mt-1">Income Tax Calculator</h3>
      <p class="text-xs text-zinc-600 mt-1.5">नए और पुराने टैक्स रिजीम में अपनी टैक्स देनदारी की तुरंत तुलना करें।</p>
    </a>
    <a href="/mock-test/" class="group bg-white border border-zinc-200 hover:border-red-600 p-5 rounded-xl transition shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md">
      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Exam Hub</span>
      <h3 class="text-lg font-serif font-bold text-zinc-950 group-hover:text-red-600 mt-1">Banking Mock Test Series</h3>
      <p class="text-xs text-zinc-600 mt-1.5">SBI PO, IBPS, RBI और बैंक परीक्षाओं के फुल ऑनलाइन मॉक टेस्ट दें।</p>
    </a>
    <a href="/application-generator/" class="group bg-white border border-zinc-200 hover:border-red-600 p-5 rounded-xl transition shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md">
      <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Hindi Letter</span>
      <h3 class="text-lg font-serif font-bold text-zinc-950 group-hover:text-red-600 mt-1">Bank Application Generator</h3>
      <p class="text-xs text-zinc-600 mt-1.5">बैंक मैनेजर को लिखने वाले सभी ज़रूरी हिंदी आवेदन पत्र 1 क्लिक में तैयार करें।</p>
    </a>
  </div>
</section>`;

  const guidesSectionHtml = `
<section id="guides" class="py-8">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-zinc-950 pb-3 mb-6 gap-4">
    <div class="flex items-center space-x-3">
      <span class="w-2.5 h-6 bg-red-600 inline-block"></span>
      <h2 class="text-xl sm:text-2xl font-serif font-bold text-zinc-950 tracking-tight">बैंकिंग व लोन हिंदी गाइड्स (${legacyGuides.length})</h2>
    </div>
    <input id="guide-search" type="search" placeholder="गाइड खोजें (e.g. SBI, Cheque, Loan)..." class="w-full sm:w-72 px-3.5 py-2 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:border-red-600" />
  </div>
  <div id="guides-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    ${legacyGuides
      .map(
        (g, i) => `<a class="guide-item group flex items-start gap-3 p-4 bg-white border border-zinc-200 hover:border-red-600 rounded-xl transition" data-search="${escHtml(g.title + ' ' + g.slug)}" href="${escHtml(g.url)}">
          <span class="flex-shrink-0 w-7 h-7 rounded-md bg-red-50 text-red-600 font-mono font-bold text-xs flex items-center justify-center border border-red-200">${i + 1}</span>
          <h3 class="text-sm font-serif font-bold text-zinc-900 group-hover:text-red-600 leading-snug">${escHtml(g.title)}</h3>
        </a>`
      )
      .join('')}
  </div>
</section>
<script>
  document.getElementById('guide-search')?.addEventListener('input', function(e) {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.guide-item').forEach(el => {
      const hay = (el.getAttribute('data-search') || '').toLowerCase();
      el.style.display = !q || hay.includes(q) ? '' : 'none';
    });
  });
</script>`;

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LoanKaise.in',
    url: 'https://loankaise.in/',
    inLanguage: 'hi-IN',
    description: 'ताज़ा हिंदी फाइनेंस न्यूज़, बैंकिंग गाइड्स, लोन टूल्स और कैलकुलेटर्स।',
  });

  return renderPageDocument({
    title: 'LoanKaise.in | ताज़ा हिंदी फाइनेंस न्यूज़, लोन गाइड्स & बैंकिंग टूल्स',
    description:
      'LoanKaise.in पर RBI अपडेट्स, होम व पर्सनल लोन की खबरें, शेयर बाज़ार विश्लेषण, और 40+ मुफ़्त फाइनेंस कैलकुलेटर सरल हिंदी में पाएं।',
    canonical: 'https://loankaise.in/',
    ogImage: leadPost ? `https://loankaise.in${leadPost.featuredImage}` : '',
    schemaJson,
    currentKey: 'home',
    trendingStories: allNews,
    bodyHtml: `${heroHtml}\n${renderAdBanner('9974716573')}\n${categorySectionHtml}\n${renderAdBanner('7602979116')}\n${toolsSectionHtml}\n${guidesSectionHtml}`,
  });
}

export function renderEditorialNewsHubHtml({ allNews, isNewsRoot = true }) {
  const canonical = isNewsRoot ? 'https://loankaise.in/news/' : 'https://loankaise.in/category/news/';
  const lead = allNews[0];
  const rest = allNews.slice(1);

  const bodyHtml = `
  <div class="border-b-4 border-black pb-4 mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center space-x-3">
        <span class="w-3 h-8 bg-red-600 inline-block"></span>
        <h1 class="text-3xl sm:text-5xl font-black font-headline tracking-tight uppercase text-black">
          FINANCE NEWS WIRE
        </h1>
      </div>
      <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
        ${allNews.length} Stories Available
      </span>
    </div>
    <p class="text-gray-600 font-serif text-sm mt-2 italic">
      RBI, लोन, EMI, शेयर बाज़ार, म्यूचुअल फंड और टैक्स की सबसे तेज़ व सटीक हिंदी खबरें — बिना दोहराव के।
    </p>
    <div class="mt-4">
      <input id="hub-search" type="search" placeholder="हिंदी फाइनेंस न्यूज़ खोजें..." class="w-full sm:w-80 px-3.5 py-2 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:border-red-600" />
    </div>
  </div>

  ${lead ? `<div class="mb-12">${renderArticleCard(lead, 'lead')}</div>` : ''}
  ${renderAdBanner('9974716573')}

  <div class="border-t border-gray-200 pt-8">
    <h2 class="text-sm font-black font-headline uppercase tracking-widest text-black mb-6">
      Latest In Hindi Finance Wire
    </h2>
    <div id="hub-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${(rest.length ? rest : allNews).map((p) => renderArticleCard(p, 'standard')).join('')}
    </div>
  </div>

  <script>
    document.getElementById('hub-search')?.addEventListener('input', function(e) {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('#hub-grid article').forEach(el => {
        const hay = (el.getAttribute('data-search') || el.textContent || '').toLowerCase();
        el.style.display = !q || hay.includes(q) ? '' : 'none';
      });
    });
  </script>`;

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Hindi Finance News Wire | LoanKaise.in',
    url: canonical,
    inLanguage: 'hi-IN',
  });

  return renderPageDocument({
    title: 'ताज़ा हिंदी फाइनेंस न्यूज़ | LoanKaise.in',
    description: 'RBI, बैंक लोन, EMI, शेयर बाज़ार, म्यूचुअल फंड और टैक्स की ताज़ा और विश्वसनीय हिंदी खबरें।',
    canonical,
    ogImage: lead ? `https://loankaise.in${lead.featuredImage}` : '',
    schemaJson,
    currentKey: 'news',
    trendingStories: allNews,
    bodyHtml,
  });
}

export function renderEditorialArticleHtml({ post, allNews }) {
  const canonical = `https://loankaise.in/news/${post.slug}/`;
  const imageAbs = post.featuredImage?.startsWith('http')
    ? post.featuredImage
    : `https://loankaise.in${post.featuredImage || '/assets/favicon.png'}`;

  const relatedPosts = allNews.filter((p) => p.slug !== post.slug).slice(0, 3);
  const authorName = post.author?.name || post.authorName || 'राहुल शर्मा';
  const authorRole = post.author?.role || 'वरिष्ठ फाइनेंस संवाददाता';

  let count = 0;
  const contentWithAds = (post.content || `<p>${escHtml(post.excerpt || post.title)}</p>`).replace(/<\/p>/gi, (m) => {
    count++;
    if (count === 3) return `${m}\n${renderAdBanner('7602979116')}`;
    return m;
  });

  const shareText = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(canonical);

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
        author: { '@type': 'Person', name: authorName },
        publisher: {
          '@type': 'Organization',
          name: 'LoanKaise.in',
          url: 'https://loankaise.in/',
          logo: { '@type': 'ImageObject', url: 'https://loankaise.in/assets/favicon.png' },
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

  const bodyHtml = `
  <article class="max-w-4xl mx-auto">
    <nav class="flex items-center space-x-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
      <a href="/" class="hover:text-black transition">Home</a>
      <span>/</span>
      <a href="/news/" class="text-hollywood-red font-bold hover:underline">${escHtml(post.categoryLabel || 'फाइनेंस न्यूज़')}</a>
      <span>/</span>
      <span class="truncate max-w-[200px] sm:max-w-xs text-gray-400">${escHtml(post.title)}</span>
    </nav>

    <div class="space-y-4 mb-6">
      <span class="inline-block px-3 py-1 text-xs font-black uppercase tracking-widest bg-hollywood-red text-white">
        ${escHtml(post.badge || post.categoryLabel || 'BREAKING UPDATE')}
      </span>
      <h1 id="article-headline" class="text-2xl sm:text-4xl md:text-[42px] font-serif font-bold text-zinc-950 leading-[1.24] tracking-[-0.015em]">
        ${escHtml(post.title)}
      </h1>
      ${post.subtitle ? `<p class="text-base sm:text-lg text-zinc-600 font-serif leading-relaxed">${escHtml(post.subtitle)}</p>` : ''}
    </div>

    ${renderAdBanner('9974716573')}

    <div class="flex flex-wrap items-center justify-between border-t border-b border-gray-200 py-3 mb-8 gap-4 text-xs">
      <div class="flex items-center space-x-3">
        <img src="${getAuthorAvatarSvg(authorName)}" alt="${escHtml(authorName)}" class="w-10 h-10 rounded-full object-cover border border-zinc-200" />
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-zinc-950">By ${escHtml(authorName)}</span>
            <span class="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black" title="Verified Reporter">✓</span>
          </div>
          <p class="text-zinc-500 text-[11px]">${escHtml(authorRole)}</p>
        </div>
      </div>

      <div class="flex items-center space-x-4 text-gray-500">
        <time datetime="${escHtml(post.publishedAt)}" class="font-sans text-xs text-zinc-500">${escHtml(formatDateTimeHi(post.publishedAt))}</time>
        <span>•</span>
        <span class="uppercase tracking-wider font-semibold text-zinc-500">${post.readingTimeMinutes || 4} MIN READ</span>
      </div>
    </div>

    <figure class="mb-8 max-w-3xl mx-auto">
      <div class="overflow-hidden bg-gray-100 rounded-xl shadow-xs">
        <img src="${escHtml(post.featuredImage || '/assets/favicon.png')}" alt="${escHtml(post.title)}" width="1200" height="675" class="w-full h-auto object-cover max-h-[460px]" />
      </div>
    </figure>

    <div class="flex items-center justify-between py-3 mb-8 border-y border-gray-100 text-xs">
      <span class="font-bold uppercase tracking-wider text-gray-600">Share Story</span>
      <div class="flex items-center space-x-2">
        <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-black text-white font-bold rounded-sm hover:bg-gray-800 transition">𝕏 Post</a>
        <a href="https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-sm hover:opacity-90 transition">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-[#1877f2] text-white font-bold rounded-sm hover:opacity-90 transition">Facebook</a>
        <button type="button" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='Copied ✓'" class="px-3 py-1.5 bg-gray-100 text-gray-800 border border-gray-300 font-bold rounded-sm hover:bg-gray-200 transition cursor-pointer">Copy Link</button>
      </div>
    </div>

    <div class="p-4 mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-xs text-amber-950 leading-relaxed">
      <strong>महत्वपूर्ण सूचना:</strong> निवेश, लोन या ब्याज दर से जुड़ा कोई भी निर्णय लेने से पहले संबंधित बैंक, RBI या SEBI रजिस्टर्ड सलाहकार से नियम व शर्तें अवश्य जांच लें।
    </div>

    <div class="article-body">
      ${contentWithAds}
    </div>

    ${renderAdBanner('7602979116')}

    <div class="mt-10 p-6 bg-zinc-50 border border-zinc-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
      <div class="flex items-start space-x-4">
        <img src="${getAuthorAvatarSvg(authorName)}" alt="${escHtml(authorName)}" class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-zinc-950 uppercase tracking-wider">${escHtml(authorName)}</span>
            <span class="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">✓</span>
          </div>
          <p class="text-xs font-semibold text-red-600">${escHtml(authorRole)}</p>
          <p class="text-xs text-zinc-600 leading-relaxed max-w-xl">
            LoanKaise.in फाइनेंस न्यूज़ डेस्क — बैंकिंग नियमों, RBI नीतियों, म्यूचुअल फंड और लोन कैलकुलेशन पर सरल हिंदी पत्रकारिता।
          </p>
        </div>
      </div>
      <div class="flex-shrink-0">
        <a href="/emi-calculator/" class="inline-flex items-center px-3.5 py-2 bg-white border border-zinc-300 hover:border-red-600 text-zinc-800 hover:text-red-600 text-xs font-bold uppercase tracking-wider rounded-sm transition shadow-xs">
          Free EMI Tool →
        </a>
      </div>
    </div>

    <div class="mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div class="flex items-center space-x-2">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        <span class="font-medium text-zinc-700">LoanKaise.in Newsroom • Verified Hindi Editorial</span>
      </div>
      <div class="flex items-center space-x-4">
        <a href="/editorial-policy/" class="hover:text-black underline">Editorial Policy</a>
        <span class="text-zinc-300">•</span>
        <a href="/contact-us/" class="hover:text-black underline">Report Correction</a>
      </div>
    </div>

    ${
      relatedPosts.length
        ? `<section class="mt-14 pt-10 border-t-4 border-black">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl sm:text-2xl font-black font-headline uppercase tracking-wider text-black flex items-center gap-2">
                <span class="w-2.5 h-5 bg-hollywood-red inline-block"></span>
                More Finance Stories
              </h2>
              <a href="/news/" class="text-xs font-bold uppercase tracking-wider text-hollywood-red hover:underline">View All News →</a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              ${relatedPosts.map((rp) => renderArticleCard(rp, 'standard')).join('')}
            </div>
          </section>`
        : ''
    }
  </article>`;

  return renderPageDocument({
    title: `${post.title} | LoanKaise.in`,
    description: post.excerpt || post.subtitle || post.title,
    canonical,
    ogImage: imageAbs,
    schemaJson,
    currentKey: post.category || 'news',
    trendingStories: allNews,
    bodyHtml,
  });
}
