import { getD1PostBySlug, loadAllPosts, CATEGORY_LABELS } from '../lib/store.js';

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function onRequestGet({ params, request, env, next }) {
  const staticRes = await next();
  if (staticRes && staticRes.status !== 404) {
    return staticRes;
  }

  const slug = String(params.slug || '').replace(/\/+$/, '');
  if (!slug) return new Response('Not Found', { status: 404 });

  const d1Post = await getD1PostBySlug(slug, env);
  if (!d1Post) {
    return new Response('Story Not Found', { status: 404 });
  }

  const allPosts = await loadAllPosts(request, env);
  const ticker = allPosts.filter((p) => !p.isLegacyGuide).slice(0, 6);
  const related = allPosts.filter((p) => p.slug !== slug && !p.isLegacyGuide).slice(0, 3);

  const title = d1Post.title;
  const catLabel = d1Post.category_label || d1Post.categoryLabel || CATEGORY_LABELS[d1Post.category] || 'फाइनेंस न्यूज़';
  const image = d1Post.featured_image || d1Post.featuredImage || '/assets/favicon.png';
  const authorName = d1Post.author_name || d1Post.authorName || 'राहुल शर्मा';
  const publishedAt = d1Post.published_at || d1Post.publishedAt || new Date().toISOString();
  const excerpt = d1Post.excerpt || d1Post.subtitle || title;
  const content = d1Post.content || `<p>${esc(excerpt)}</p>`;
  const canonical = `https://loankaise.in/news/${esc(slug)}/`;

  const dateText = new Date(publishedAt).toLocaleString('hi-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  const html = `<!doctype html>
<html lang="hi" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)} | LoanKaise.in</title>
  <meta name="description" content="${esc(excerpt)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/assets/favicon.png" sizes="192x192" type="image/png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/admin.css?v=20261112a" />
  <meta name="google-adsense-account" content="ca-pub-4298058382758528" />
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4298058382758528" crossorigin="anonymous"></script>
</head>
<body class="bg-white text-gray-900 font-sans antialiased min-h-screen flex flex-col">
  <header class="w-full bg-white sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
    <div class="bg-zinc-950 text-zinc-300 py-1.5 px-4 sm:px-8 border-b border-zinc-900 overflow-hidden">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px]">
        <div class="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
          <div class="flex-shrink-0 flex items-center space-x-1 bg-red-600 px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-widest text-white">
            <span>TRENDING</span>
          </div>
          <div class="relative w-full overflow-hidden whitespace-nowrap">
            <div class="marquee-track flex items-center space-x-6 text-[11px] font-serif">
              ${[...ticker, ...ticker].map((st) => `<a href="/news/${esc(st.slug)}/" class="text-zinc-200 hover:text-amber-300"><span class="text-red-500 font-sans font-black text-[9px] uppercase mr-1">[${esc(st.categoryLabel)}]</span>${esc(st.title)}</a>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="py-3 px-4 sm:px-8 bg-white border-b border-zinc-200 text-center">
      <a href="/" class="inline-flex items-center space-x-2">
        <span class="inline-block w-2.5 h-2.5 bg-red-600 transform rotate-45"></span>
        <span class="text-2xl sm:text-3xl font-black font-serif tracking-tight text-zinc-950 uppercase">LOANKAISE<span class="text-red-600">.IN</span></span>
      </a>
    </div>
    <nav class="bg-white border-b border-zinc-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-8">
        <ul class="flex items-center justify-center space-x-5 overflow-x-auto py-1.5 text-[11px] font-bold tracking-[0.12em] uppercase no-scrollbar">
          <li><a href="/" class="text-zinc-900 hover:text-red-600">HOME</a></li>
          <li><a href="/news/" class="text-red-600 font-black">FINANCE NEWS</a></li>
          <li><a href="/calculators/" class="text-zinc-900 hover:text-red-600">CALCULATORS</a></li>
          <li><a href="/mock-test/" class="text-zinc-900 hover:text-red-600">MOCK TEST</a></li>
          <li><a href="/#guides" class="text-zinc-900 hover:text-red-600">GUIDES</a></li>
        </ul>
      </div>
    </nav>
  </header>
  <section class="lk-mkt-bar" aria-label="Live Stock Market Alerts">
    <div class="lk-mkt-inner">
      <span id="lk-mkt-status-pill" class="lk-mkt-pill lk-pill-live">● MARKET LIVE</span>
      <div class="lk-al-viewport">
        <div id="lk-mkt-alert-track" class="lk-al-track">${[...ticker, ...ticker].map((st) => `<a class="lk-al-item" href="/news/${esc(st.slug)}/"><span class="lk-al-badge">👀 बाज़ार पर नज़र</span><span class="lk-txt-news">${esc(st.title)}</span><span class="lk-sep">•</span></a>`).join('')}</div>
      </div>
    </div>
  </section>

  <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
    <article class="max-w-4xl mx-auto">
      <nav class="flex items-center space-x-2 text-xs text-gray-500 uppercase tracking-wider mb-4">
        <a href="/" class="hover:text-black">Home</a><span>/</span>
        <a href="/news/" class="text-hollywood-red font-bold hover:underline">${esc(catLabel)}</a>
      </nav>
      <div class="space-y-4 mb-6">
        <span class="inline-block px-3 py-1 text-xs font-black uppercase tracking-widest bg-hollywood-red text-white">${esc(catLabel)}</span>
        <h1 class="text-2xl sm:text-4xl font-serif font-bold text-zinc-950 leading-[1.24]">${esc(title)}</h1>
      </div>
      <div class="flex flex-wrap items-center justify-between border-t border-b border-gray-200 py-3 mb-8 text-xs text-zinc-500">
        <span class="font-bold text-zinc-950">By ${esc(authorName)} ✓</span>
        <time datetime="${esc(publishedAt)}">${esc(dateText)} IST</time>
      </div>
      <figure class="mb-8 max-w-3xl mx-auto">
        <div class="overflow-hidden bg-gray-100 rounded-xl shadow-xs">
          <img src="${esc(image)}" alt="${esc(title)}" width="1200" height="675" class="w-full h-auto object-cover max-h-[460px]" />
        </div>
      </figure>
      <div class="article-body">${content}</div>
      ${
        related.length
          ? `<section class="mt-14 pt-10 border-t-4 border-black">
              <h2 class="text-xl font-black font-headline uppercase tracking-wider text-black mb-6">More Finance Stories</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${related.map((r) => `<a href="/news/${esc(r.slug)}/" class="block p-4 bg-white border border-gray-200 rounded-xl hover:border-red-600"><h3 class="font-serif font-bold text-zinc-950 text-base">${esc(r.title)}</h3></a>`).join('')}
              </div>
            </section>`
          : ''
      }
    </article>
  </main>

  <footer class="bg-zinc-950 text-white py-10 border-t border-zinc-800 mt-12 text-center text-xs text-zinc-500">
    © 2026 LoanKaise.in. All rights reserved.
  </footer>
  <script src="/assets/market-ticker.js?v=20261112a" defer></script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
