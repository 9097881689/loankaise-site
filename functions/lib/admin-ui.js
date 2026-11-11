import { CATEGORY_LABELS, FINANCE_SOURCES_META } from './store.js';

function escHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderAdminShell({ title, description, bodyHtml, trendingPosts = [] }) {
  const tickerItems = trendingPosts.slice(0, 6);
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return `<!doctype html>
<html lang="hi" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/assets/favicon.png" sizes="192x192" type="image/png" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description || 'LoanKaise.in Editorial Control Hub')}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/admin.css?v=20261111a" />
</head>
<body class="bg-white text-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-hollywood-red selection:text-white">

  <!-- Top Header matching HollywoodTime Editorial Masthead -->
  <header class="w-full bg-white sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
    <div class="bg-zinc-950 text-zinc-300 py-1.5 px-4 sm:px-8 border-b border-zinc-900 overflow-hidden select-none">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px]">
        <div class="flex-shrink-0 hidden md:flex items-center space-x-2 text-[10px] text-zinc-400 font-medium">
          <span class="text-white font-semibold uppercase">${escHtml(formattedDate)}</span>
          <span class="text-zinc-600">•</span>
          <span class="text-amber-400">IN • HI</span>
        </div>

        <div class="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
          <div class="flex-shrink-0 flex items-center space-x-1 bg-red-600 px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-widest text-white">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>TRENDING</span>
          </div>
          <div class="relative w-full overflow-hidden whitespace-nowrap">
            <div class="marquee-track flex items-center space-x-6 text-[11px] font-serif">
              ${tickerItems
                .map(
                  (st) => `<a href="${escHtml(st.url || '/news/' + st.slug + '/')}" target="_blank" class="inline-flex items-center space-x-1.5 text-zinc-300 hover:text-white transition">
                    <span class="text-red-500 font-sans font-black text-[9px] uppercase tracking-wider">[${escHtml(st.categoryLabel || 'Finance')}]</span>
                    <span class="text-zinc-200">${escHtml(st.title)}</span>
                    <span class="text-zinc-600 ml-3">•</span>
                  </a>`
                )
                .join('')}
              ${tickerItems
                .map(
                  (st) => `<a href="${escHtml(st.url || '/news/' + st.slug + '/')}" target="_blank" class="inline-flex items-center space-x-1.5 text-zinc-300 hover:text-white transition">
                    <span class="text-red-500 font-sans font-black text-[9px] uppercase tracking-wider">[${escHtml(st.categoryLabel || 'Finance')}]</span>
                    <span class="text-zinc-200">${escHtml(st.title)}</span>
                    <span class="text-zinc-600 ml-3">•</span>
                  </a>`
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="flex-shrink-0 hidden lg:flex items-center space-x-3 text-[10px] text-zinc-400 font-medium">
          <a href="/" target="_blank" class="hover:text-white transition">Live Site ↗</a>
          <a href="/news/" target="_blank" class="hover:text-white transition">Finance News</a>
          <a href="/calculators/" target="_blank" class="hover:text-white transition">Calculators</a>
          <a href="/feed.xml" target="_blank" class="text-amber-400 hover:text-amber-300 transition font-bold">RSS</a>
        </div>
      </div>
    </div>

    <!-- Masthead Brand Strip -->
    <div class="border-b border-zinc-200 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <a href="/" class="inline-flex items-center gap-2">
          <span class="font-serif font-black text-2xl sm:text-3xl tracking-tight text-zinc-950 uppercase">
            LoanKaise<span class="text-hollywood-red ml-1 text-xl font-sans inline-block">◆</span>Finance
          </span>
        </a>
        <nav class="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-zinc-700">
          <a href="/" class="hover:text-hollywood-red transition">Home</a>
          <a href="/news/" class="hover:text-hollywood-red transition">Finance News</a>
          <a href="/category/loan-blog/" class="hover:text-hollywood-red transition">Loan Blog</a>
          <a href="/calculators/" class="hover:text-hollywood-red transition">Calculators</a>
          <a href="/admin" class="text-hollywood-red">Admin Hub</a>
        </nav>
      </div>
    </div>
  </header>

  <main class="flex-1 w-full">
    ${bodyHtml}
  </main>

  <!-- Dark Footer matching HollywoodTime -->
  <footer class="bg-zinc-950 text-white pt-10 pb-10 border-t border-zinc-800 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <p>© 2026 LoanKaise.in. All rights reserved. Hindi Finance News &amp; Editorial Control Hub.</p>
        <div class="flex items-center space-x-6 text-[11px]">
          <a href="/privacy-policy/" class="hover:text-zinc-300 transition">Privacy Policy</a>
          <a href="/editorial-policy/" class="hover:text-zinc-300 transition">Editorial Code</a>
          <a href="/contact-us/" class="hover:text-zinc-300 transition">Contact</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

export function renderLoginHtml({ lockoutStatus, errorMessage = '', warningMessage = '' }) {
  const bodyHtml = `
  <div class="min-h-[72vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-200">
      <div class="text-center">
        <a href="/" class="inline-block">
          <span class="font-serif font-black text-2xl sm:text-3xl tracking-tight text-zinc-950 uppercase">
            LoanKaise<span class="text-hollywood-red ml-1.5 text-xl font-sans inline-block">◆</span>Finance
          </span>
        </a>
        <div class="mt-2 flex items-center justify-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-600">
            Control Center &amp; Editorial Hub
          </span>
        </div>
        <h2 class="mt-4 text-xl font-bold font-serif text-zinc-900">
          Sign In to Admin Portal
        </h2>
        <p class="mt-1 text-xs text-zinc-500 font-sans">
          Manage Top-10 Finance Hindi auto-ingestion, AI rewriting, and Google News indexing.
        </p>
      </div>

      ${
        lockoutStatus.isLocked
          ? `<div class="p-4 bg-red-100/80 border-2 border-red-500 rounded-xl text-xs text-red-950 font-medium space-y-1.5 shadow-sm">
              <div class="flex items-center gap-2 font-bold text-red-800 text-sm">
                <span>🚫 24-Hour Security Lockout Active</span>
              </div>
              <p class="text-[11.5px] leading-relaxed">
                More than 10 incorrect password attempts were detected. This login portal is strictly locked for <strong>24 hours</strong> to prevent unauthorized access.
              </p>
              <div class="text-[11px] font-mono text-red-900 pt-1 font-semibold">
                ⏳ Remaining Lock Time: ~${lockoutStatus.remainingHours || 0} Hours ${lockoutStatus.remainingMinutes || 0} Mins
              </div>
            </div>`
          : ''
      }

      ${
        !lockoutStatus.isLocked && errorMessage
          ? `<div class="p-3.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 space-y-1">
              <p class="font-bold">⚠️ ${escHtml(errorMessage)}</p>
              ${warningMessage ? `<p class="text-[11px] text-red-700 font-semibold">${escHtml(warningMessage)}</p>` : ''}
            </div>`
          : ''
      }

      <form class="mt-6 space-y-5" method="POST" action="/admin/login">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Login ID / Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autocomplete="username"
              ${lockoutStatus.isLocked ? 'disabled' : ''}
              placeholder="admin"
              class="appearance-none relative block w-full px-3.5 py-2.5 border border-zinc-300 placeholder-zinc-400 text-zinc-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm font-mono ${lockoutStatus.isLocked ? 'bg-zinc-100 cursor-not-allowed' : ''}"
            />
          </div>
          <div>
            <label for="password" class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              ${lockoutStatus.isLocked ? 'disabled' : ''}
              placeholder="••••••••••••"
              class="appearance-none relative block w-full px-3.5 py-2.5 border border-zinc-300 placeholder-zinc-400 text-zinc-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm font-mono ${lockoutStatus.isLocked ? 'bg-zinc-100 cursor-not-allowed' : ''}"
            />
          </div>
        </div>

        <button
          type="submit"
          ${lockoutStatus.isLocked ? 'disabled' : ''}
          class="w-full flex justify-center py-2.5 px-4 border border-transparent text-xs uppercase tracking-wider font-bold rounded-lg text-white transition shadow-sm ${
            lockoutStatus.isLocked
              ? 'bg-zinc-400 cursor-not-allowed'
              : 'bg-hollywood-red hover:bg-red-700 cursor-pointer active:scale-95'
          }"
        >
          ${lockoutStatus.isLocked ? '🔒 Locked for 24 Hours' : '🔐 Unlock & Enter Control Hub'}
        </button>

        <div class="text-center pt-2 border-t border-zinc-100">
          <p class="text-[11px] text-zinc-400 font-mono">
            Max 10 attempts • Protected by 24h Edge Security Lockout
          </p>
        </div>
      </form>
    </div>
  </div>`;

  return renderAdminShell({
    title: 'Admin Login | LoanKaise Finance Control Center',
    description: 'Sign in to LoanKaise Operations Hub',
    bodyHtml,
  });
}

export function renderDashboardHtml({ posts, logs, hasD1, hasGemini }) {
  const serializedPosts = JSON.stringify(
    posts.map((p, idx) => ({
      id: p.id,
      index: idx + 1,
      slug: p.slug,
      url: p.url || `/news/${p.slug}/`,
      title: p.title,
      subtitle: p.subtitle || '',
      category: p.category || 'personal-finance',
      categoryLabel: p.categoryLabel || CATEGORY_LABELS[p.category] || 'फाइनेंस न्यूज़',
      featuredImage: p.featuredImage || '/assets/favicon.png',
      authorName: p.authorName || 'राहुल शर्मा',
      publishedAt: p.publishedAt,
      indexedInGoogle: p.indexedInGoogle ?? true,
      sourcesCount: p.sourcesCount || 1,
    }))
  ).replace(/<\/script>/gi, '<\\/script>');

  const first15Rows = posts
    .slice(0, 15)
    .map(
      (post, idx) => `<tr class="hover:bg-zinc-50 transition" data-id="${escHtml(post.id)}">
        <td class="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-400">${idx + 1}</td>
        <td class="py-2.5 px-3">
          <div class="flex items-center gap-3">
            <img src="${escHtml(post.featuredImage || '/assets/favicon.png')}" alt="" class="w-10 h-10 rounded object-cover flex-shrink-0 bg-zinc-100 border border-zinc-200" loading="lazy" />
            <div class="min-w-0 flex-1">
              <a href="${escHtml(post.url || '/news/' + post.slug + '/')}" target="_blank" class="font-serif font-bold text-zinc-950 hover:text-hollywood-red transition line-clamp-1 text-xs sm:text-sm">${escHtml(post.title)}</a>
              <div class="text-[11px] text-zinc-400 font-mono truncate mt-0.5">${escHtml(post.url || '/news/' + post.slug + '/')}</div>
            </div>
          </div>
        </td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">${escHtml(post.categoryLabel || post.category)}</span>
        </td>
        <td class="py-2.5 px-3 text-zinc-600">
          <span class="font-medium text-zinc-800 flex items-center gap-1">
            ${escHtml(post.authorName || 'राहुल शर्मा')}
            <span class="w-3 h-3 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[7px] font-black">✓</span>
          </span>
        </td>
        <td class="py-2.5 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">${new Date(post.publishedAt).toLocaleDateString('en-IN')}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">✓ Indexed</span>
        </td>
        <td class="py-2.5 px-3 text-right whitespace-nowrap">
          <a href="${escHtml(post.url || '/news/' + post.slug + '/')}" target="_blank" class="inline-block px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] rounded transition mr-1">View ↗</a>
          <button class="btn-delete-story inline-block px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] rounded transition cursor-pointer" data-id="${escHtml(post.id)}" data-title="${encodeURIComponent(post.title)}">Delete</button>
        </td>
      </tr>`
    )
    .join('');

  const logsHtml =
    logs.length === 0
      ? `<div class="py-8 text-center text-zinc-400 font-mono text-xs">No recent edge index logs recorded yet. Trigger a sync or publish a story.</div>`
      : logs
          .map(
            (log) => `<div class="py-2.5 flex items-start justify-between gap-3">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${escHtml(log.status)} (${log.statusCode || 200})</span>
                  <span class="font-mono text-zinc-400 text-[10px]">${escHtml(log.action)}</span>
                </div>
                <p class="font-mono text-zinc-950 font-semibold truncate max-w-xs">${escHtml(log.url)}</p>
                <p class="text-[11px] text-zinc-500">${escHtml(log.responseMessage)}</p>
              </div>
              <time class="text-[10px] text-zinc-400 whitespace-nowrap font-mono">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            </div>`
          )
          .join('');

  const bodyHtml = `
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6">
    <!-- Top Operations Banner (Exact HollywoodTime Design) -->
    <div class="bg-zinc-950 text-white p-6 sm:p-8 rounded-xl mb-8 border-l-4 border-hollywood-red shadow-lg">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span class="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Live Top-10 Finance Ingestion &amp; Hindi AI Newsroom Connected
            </span>
            <span class="text-xs text-zinc-500">•</span>
            <span class="text-xs font-mono text-zinc-400">User: <strong class="text-zinc-200">admin</strong></span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black font-headline tracking-wide uppercase mt-2">
            LoanKaise.in Operations Hub
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 font-sans mt-1">
            Top 10 Finance RSS Mixer (Moneycontrol, ETMoney, Yahoo Finance, ET, Livemint), Zero-Duplicate Hindi AI Rewriter &amp; Logo-Free Image Pipeline.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            id="btn-sync-now"
            class="px-5 py-2.5 bg-hollywood-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span id="sync-spinner" class="hidden animate-spin">⟳</span>
            <span>⚡ Sync &amp; Auto-Rewrite Now</span>
          </button>

          <a href="#manual-publish-section" class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-lg transition">
            ✍️ Write New Story
          </a>

          <a href="/admin/logout" class="px-3.5 py-2.5 bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg border border-zinc-800 transition">
            Logout ⇥
          </a>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-zinc-800 text-xs font-mono">
        <span class="text-zinc-500 mr-1 uppercase text-[10px] tracking-wider font-bold">Quick Jump:</span>
        <a href="#stories-section" class="px-3 py-1 rounded bg-red-600/30 text-red-300 border border-red-500/40 hover:bg-red-600/50 font-bold transition">📰 All Stories (${posts.length})</a>
        <a href="#ai-fetch-section" class="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition">⚡ AI Fetch Engine</a>
        <a href="#manual-publish-section" class="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition">✍️ Manual Story</a>
        <a href="#sources-section" class="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition">🌐 Top 10 Sources</a>
        <a href="#logs-section" class="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition">📈 Index Logs</a>
      </div>
    </div>

    <!-- Live Sync Alert Container -->
    <div id="sync-alert" class="hidden mb-8 p-4 rounded-lg border text-xs transition duration-200"></div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Total Posts</div>
        <div class="text-2xl font-serif font-black text-zinc-950 mt-1" id="stat-total-posts">${posts.length}</div>
        <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ ${hasD1 ? 'D1 + Static Synced' : 'Manifest + Git Synced'}</div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Finance Sources</div>
        <div class="text-2xl font-serif font-black text-zinc-950 mt-1">10 Sites</div>
        <div class="text-[10px] text-zinc-500 font-semibold mt-0.5">Cross-Source Dedupe &amp; Mix</div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Auto-Post Cycle</div>
        <div class="text-2xl font-serif font-black text-zinc-950 mt-1">5 Min</div>
        <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">Hindi Human Rewrite + Logo-Free IMG</div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">AI Rewriter</div>
        <div class="text-2xl font-serif font-black text-zinc-950 mt-1">${hasGemini ? 'Gemini 2.5' : 'Edge Ready'}</div>
        <div class="text-[10px] text-blue-600 font-semibold mt-0.5">✓ Verified Byline Journalists</div>
      </div>
    </div>

    <!-- Published Editorial Stories Archive with Paging -->
    <section id="stories-section" class="bg-white border border-zinc-200 p-5 sm:p-6 rounded-xl shadow-xs mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-4 mb-4 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-black font-headline uppercase tracking-wider text-zinc-950">
              Published Editorial Stories Archive
            </h2>
            <span id="badge-total-count" class="px-2.5 py-0.5 bg-red-100 text-hollywood-red font-mono font-bold text-xs rounded-full border border-red-200">
              ${posts.length} Total Stories
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-0.5">
            All Hindi Finance News &amp; LoanKaise Banking Guides. Real-time search, category filtering &amp; pagination.
          </p>
        </div>
        <div class="text-xs text-zinc-500 font-mono">
          Duplicate Guard: <span class="font-bold text-emerald-700">Active (Topic Mixer)</span>
        </div>
      </div>

      <!-- Controls Toolbar -->
      <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div class="flex flex-wrap items-center gap-2.5 flex-1">
          <div class="relative flex-1 min-w-[220px]">
            <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">🔍</span>
            <input type="text" id="filter-search-input" placeholder="Search Hindi/English headline, author, slug..." class="w-full pl-8 pr-7 py-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
            <button id="btn-clear-search" class="hidden absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-700 font-bold" title="Clear">✕</button>
          </div>

          <div class="min-w-[160px]">
            <select id="filter-category-select" class="w-full py-2 px-3 bg-white border border-zinc-300 rounded-md text-xs text-zinc-800 font-medium focus:outline-none focus:border-red-500">
              <option value="">All Categories (${posts.length})</option>
              <option value="banking-rbi">बैंकिंग &amp; RBI</option>
              <option value="loans-emi">लोन &amp; EMI</option>
              <option value="markets">शेयर बाज़ार &amp; गोल्ड</option>
              <option value="personal-finance">पर्सनल फाइनेंस</option>
              <option value="mutual-funds">म्यूचुअल फंड &amp; SIP</option>
              <option value="tax-saving">टैक्स &amp; बचत</option>
              <option value="business">बिज़नेस &amp; इकोनॉमी</option>
              <option value="loan-guide">Banking Guides</option>
            </select>
          </div>

          <button id="btn-reset-filters" class="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-md transition">Reset</button>
        </div>

        <div class="flex items-center gap-2 self-end md:self-center font-mono">
          <label for="filter-page-size" class="text-zinc-500 uppercase tracking-wider text-[11px] font-bold">Per Page:</label>
          <select id="filter-page-size" class="py-1.5 px-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-800 font-bold focus:outline-none focus:border-red-500">
            <option value="15" selected>15</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div id="delete-alert" class="hidden mb-4 p-3 rounded-lg border text-xs font-mono"></div>

      <div class="overflow-x-auto border border-zinc-200 rounded-lg">
        <table class="w-full text-left text-xs">
          <thead class="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
            <tr>
              <th class="py-3 px-3 w-12 text-center">#</th>
              <th class="py-3 px-3">Story Headline</th>
              <th class="py-3 px-3 w-36">Category</th>
              <th class="py-3 px-3 w-36">Byline</th>
              <th class="py-3 px-3 w-28">Published</th>
              <th class="py-3 px-3 w-28">Google Status</th>
              <th class="py-3 px-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="stories-table-body" class="divide-y divide-zinc-100 font-sans">
            ${first15Rows}
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="mt-4 pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div id="pagination-status" class="text-xs text-zinc-600 font-mono">
          Showing <span id="pag-start" class="font-bold text-zinc-900">1</span>–<span id="pag-end" class="font-bold text-zinc-900">${Math.min(15, posts.length)}</span> of <span id="pag-total" class="font-bold text-zinc-900">${posts.length}</span> stories
          (Page <span id="pag-current" class="font-bold text-hollywood-red">1</span> of <span id="pag-max" class="font-bold text-zinc-900">${Math.max(1, Math.ceil(posts.length / 15))}</span>)
        </div>

        <div class="flex items-center gap-1 font-mono text-xs select-none">
          <button id="btn-pag-first" class="px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition">« First</button>
          <button id="btn-pag-prev" class="px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition">‹ Prev</button>
          <div id="pagination-numbers" class="flex items-center gap-1"></div>
          <button id="btn-pag-next" class="px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition">Next ›</button>
          <button id="btn-pag-last" class="px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition">Last »</button>
        </div>
      </div>
    </section>

    <script id="posts-raw-data" type="application/json">${serializedPosts}</script>

    <!-- AI News Fetch & Instant Hindi Rewriter Section -->
    <section id="ai-fetch-section" class="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border border-zinc-800 p-6 sm:p-7 rounded-xl shadow-md mb-8">
      <div class="border-b border-zinc-800 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 bg-red-600/30 text-red-400 border border-red-500/40 rounded text-[10px] font-black uppercase tracking-widest">
              AI HINDI FINANCE FETCH ENGINE
            </span>
            <span class="text-xs text-zinc-400 font-mono">Moneycontrol / ETMoney / Yahoo Finance → Unique Hindi</span>
          </div>
          <h2 class="text-lg sm:text-xl font-black font-headline uppercase tracking-wide text-white">
            ⚡ AI News Fetch &amp; Instant Hindi Rewriter
          </h2>
          <p class="text-xs text-zinc-400 font-sans mt-0.5">
            Paste any English/Hindi finance news link or topic — AI fetches, removes source branding, and writes a unique human-style Hindi article.
          </p>
        </div>
        <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-md border border-emerald-500/30 w-fit">
          ✓ Active
        </span>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-8">
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Finance News URL or Breaking Topic *
            </label>
            <input type="text" id="ai-fetch-input" placeholder="e.g. https://www.moneycontrol.com/... OR 'RBI repo rate cut impact on home loan EMI'" class="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-800/90 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono" />
          </div>
          <div class="md:col-span-4">
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">Category Override</label>
            <select id="ai-fetch-category" class="w-full px-3 py-2.5 text-xs sm:text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500 font-sans">
              <option value="">Auto-Detect Category</option>
              <option value="banking-rbi">बैंकिंग &amp; RBI</option>
              <option value="loans-emi">लोन &amp; EMI</option>
              <option value="markets">शेयर बाज़ार &amp; गोल्ड</option>
              <option value="personal-finance">पर्सनल फाइनेंस</option>
              <option value="mutual-funds">म्यूचुअल फंड &amp; SIP</option>
              <option value="tax-saving">टैक्स &amp; बचत</option>
              <option value="business">बिज़नेस &amp; इकोनॉमी</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-8">
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">Angle / Hindi Focus Keyword (Optional)</label>
            <input type="text" id="ai-fetch-hint" placeholder="Optional: e.g. Home loan borrowers aur EMI par asar..." class="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-800/90 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-sans" />
          </div>
          <div class="md:col-span-4 flex items-end gap-2">
            <button type="button" id="btn-ai-fetch-fill" class="flex-1 py-2.5 px-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5">
              <span id="ai-fill-spinner" class="hidden animate-spin">⟳</span>
              <span>Fill Form Below</span>
            </button>
            <button type="button" id="btn-ai-fetch-publish" class="flex-1 py-2.5 px-3 bg-hollywood-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition text-center cursor-pointer flex items-center justify-center gap-1.5">
              <span id="ai-pub-spinner" class="hidden animate-spin">⟳</span>
              <span>⚡ 1-Click Publish</span>
            </button>
          </div>
        </div>

        <div id="ai-fetch-alert" class="hidden p-4 rounded-xl border text-xs font-mono transition"></div>
      </div>
    </section>

    <!-- Manual Publishing & Logs Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
      <section id="manual-publish-section" class="lg:col-span-7 bg-white border border-zinc-200 p-6 rounded-xl shadow-xs">
        <div class="border-b-2 border-black pb-3 mb-5">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded">Hindi Editorial</span>
            <h2 class="text-base font-black font-headline uppercase tracking-wider text-zinc-950">✍️ Write &amp; Publish Hindi Story</h2>
          </div>
          <p class="text-xs text-zinc-500 mt-1">Publish directly to LoanKaise.in and submit to Google Indexing.</p>
        </div>

        <div id="manual-post-alert" class="hidden mb-4 p-4 rounded-xl border text-xs"></div>

        <form id="form-manual-post" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Hindi Headline Title *</label>
            <input type="text" id="post-title" required placeholder="e.g. RBI का बड़ा फैसला: रेपो रेट में बदलाव से सस्ता होगा होम लोन?" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-red-500 font-serif font-bold text-zinc-950" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Finance Category *</label>
              <select id="post-category" required class="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md focus:outline-none focus:border-red-500">
                <option value="banking-rbi">बैंकिंग &amp; RBI</option>
                <option value="loans-emi">लोन &amp; EMI</option>
                <option value="markets">शेयर बाज़ार &amp; गोल्ड</option>
                <option value="personal-finance">पर्सनल फाइनेंस</option>
                <option value="mutual-funds">म्यूचुअल फंड &amp; SIP</option>
                <option value="tax-saving">टैक्स &amp; बचत</option>
                <option value="business">बिज़नेस &amp; इकोनॉमी</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Verified Byline Reporter</label>
              <select id="post-author" class="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md focus:outline-none focus:border-red-500">
                <option value="राहुल शर्मा">राहुल शर्मा (बैंकिंग &amp; लोन ✓)</option>
                <option value="प्रिया वर्मा">प्रिया वर्मा (पर्सनल फाइनेंस &amp; टैक्स ✓)</option>
                <option value="अमित मिश्रा">अमित मिश्रा (मार्केट्स &amp; म्यूचुअल फंड ✓)</option>
                <option value="नेहा गुप्ता">नेहा गुप्ता (बिज़नेस ब्यूरो ✓)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Clean Featured Image Path / URL</label>
            <input type="text" id="post-image" placeholder="/uploads/news/custom-cover.webp" class="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md focus:outline-none focus:border-red-500 font-mono" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Story Excerpt (Hindi Summary)</label>
            <textarea id="post-excerpt" rows="2" placeholder="2 लाइन का मुख्य सारांश..." class="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md focus:outline-none focus:border-red-500"></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Full Hindi Article Content (HTML / Paragraphs) *</label>
            <textarea id="post-content" rows="7" required placeholder="पूरा लेख यहाँ लिखें..." class="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md focus:outline-none focus:border-red-500 font-sans"></textarea>
          </div>

          <button type="submit" id="btn-publish-submit" class="w-full py-3 bg-hollywood-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition cursor-pointer">
            🚀 Publish Hindi Story to Live Site &amp; Ping Google
          </button>
        </form>
      </section>

      <section id="logs-section" class="lg:col-span-5 bg-white border border-zinc-200 p-6 rounded-xl shadow-xs">
        <div class="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <h2 class="text-base font-black font-headline uppercase tracking-wider text-zinc-950">📈 Google Index Activity Log</h2>
            <p class="text-xs text-zinc-500">Live indexing status &amp; audit responses.</p>
          </div>
          <span class="text-xs font-mono font-bold text-zinc-500">Total: ${logs.length}</span>
        </div>
        <div class="overflow-y-auto max-h-[460px] divide-y divide-zinc-100 text-xs">${logsHtml}</div>
      </section>
    </div>

    <!-- Top 10 Finance Sources Panel -->
    <section id="sources-section" class="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs">
      <div class="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div>
          <h2 class="text-base font-black font-headline uppercase tracking-wider text-zinc-950">🌐 Top 10 Finance News Sources (Anti-Duplicate Mixer)</h2>
          <p class="text-xs text-zinc-500">Overlapping news across these 10 portals is automatically merged into ONE unique Hindi article.</p>
        </div>
        <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded">10/10 Active</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
        ${FINANCE_SOURCES_META.map(
          (s, i) => `<div class="p-3 rounded-lg border border-zinc-200 bg-zinc-50 flex flex-col justify-between gap-1">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] text-zinc-400">#${i + 1}</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div class="font-bold text-zinc-900">${escHtml(s.name)}</div>
            <div class="text-[10px] font-mono text-zinc-500 truncate">${escHtml(s.url)}</div>
          </div>`
        ).join('')}
      </div>
    </section>
  </div>

  <script>
    const rawDataScript = document.getElementById('posts-raw-data');
    let allPosts = [];
    try { allPosts = JSON.parse(rawDataScript?.textContent || '[]'); } catch { allPosts = []; }

    let filteredPosts = [...allPosts];
    let currentPage = 1;
    let pageSize = 15;

    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(urlParams.get('page') || '1', 10);
    if (!isNaN(initialPage) && initialPage > 0) currentPage = initialPage;

    const searchInput = document.getElementById('filter-search-input');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    const categorySelect = document.getElementById('filter-category-select');
    const pageSizeSelect = document.getElementById('filter-page-size');
    const resetFiltersBtn = document.getElementById('btn-reset-filters');
    const tableBody = document.getElementById('stories-table-body');
    const deleteAlert = document.getElementById('delete-alert');
    const badgeTotalCount = document.getElementById('badge-total-count');
    const statTotalPosts = document.getElementById('stat-total-posts');

    const pagStart = document.getElementById('pag-start');
    const pagEnd = document.getElementById('pag-end');
    const pagTotal = document.getElementById('pag-total');
    const pagCurrent = document.getElementById('pag-current');
    const pagMax = document.getElementById('pag-max');
    const btnFirst = document.getElementById('btn-pag-first');
    const btnPrev = document.getElementById('btn-pag-prev');
    const btnNext = document.getElementById('btn-pag-next');
    const btnLast = document.getElementById('btn-pag-last');
    const pagNumbersContainer = document.getElementById('pagination-numbers');

    function applyFilters() {
      const q = (searchInput?.value || '').trim().toLowerCase();
      const cat = (categorySelect?.value || '').trim().toLowerCase();
      filteredPosts = allPosts.filter(p => {
        const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q);
        const matchesCategory = !cat || (p.category || '').toLowerCase() === cat;
        return matchesQuery && matchesCategory;
      });
      const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      renderTable();
      renderPagination();
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', String(currentPage));
      const qs = params.toString();
      window.history.replaceState({}, '', qs ? window.location.pathname + '?' + qs : window.location.pathname);
    }

    function renderTable() {
      if (!tableBody) return;
      const startIndex = (currentPage - 1) * pageSize;
      const pageItems = filteredPosts.slice(startIndex, startIndex + pageSize);
      if (pageItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-zinc-500 font-mono">No stories found.</td></tr>';
        return;
      }
      tableBody.innerHTML = pageItems.map((post, idx) => {
        const num = startIndex + idx + 1;
        const pubDate = new Date(post.publishedAt).toLocaleDateString('en-IN');
        const linkUrl = post.url || ('/news/' + post.slug + '/');
        return \`
          <tr class="hover:bg-zinc-50 transition" data-id="\${post.id}">
            <td class="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-400">\${num}</td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-3">
                <img src="\${post.featuredImage || '/assets/favicon.png'}" alt="" class="w-10 h-10 rounded object-cover flex-shrink-0 bg-zinc-100 border border-zinc-200" loading="lazy" />
                <div class="min-w-0 flex-1">
                  <a href="\${linkUrl}" target="_blank" class="font-serif font-bold text-zinc-950 hover:text-hollywood-red transition line-clamp-1 text-xs sm:text-sm">\${post.title}</a>
                  <div class="text-[11px] text-zinc-400 font-mono truncate mt-0.5">\${linkUrl}</div>
                </div>
              </div>
            </td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">\${post.categoryLabel || post.category}</span></td>
            <td class="py-2.5 px-3 text-zinc-600"><span class="font-medium text-zinc-800 flex items-center gap-1">\${post.authorName}<span class="w-3 h-3 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[7px] font-black">✓</span></span></td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">\${pubDate}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">✓ Indexed</span></td>
            <td class="py-2.5 px-3 text-right whitespace-nowrap">
              <a href="\${linkUrl}" target="_blank" class="inline-block px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] rounded transition mr-1">View ↗</a>
              <button class="btn-delete-story inline-block px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] rounded transition cursor-pointer" data-id="\${post.id}" data-title="\${encodeURIComponent(post.title)}">Delete</button>
            </td>
          </tr>\`;
      }).join('');
      document.querySelectorAll('.btn-delete-story').forEach(b => b.addEventListener('click', handleDeleteStory));
    }

    function renderPagination() {
      const totalItems = filteredPosts.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, totalItems);
      if (pagStart) pagStart.textContent = String(start);
      if (pagEnd) pagEnd.textContent = String(end);
      if (pagTotal) pagTotal.textContent = String(totalItems);
      if (pagCurrent) pagCurrent.textContent = String(currentPage);
      if (pagMax) pagMax.textContent = String(totalPages);
      if (btnFirst) btnFirst.disabled = currentPage <= 1;
      if (btnPrev) btnPrev.disabled = currentPage <= 1;
      if (btnNext) btnNext.disabled = currentPage >= totalPages;
      if (btnLast) btnLast.disabled = currentPage >= totalPages;
      if (!pagNumbersContainer) return;
      pagNumbersContainer.innerHTML = '';
      const nums = [];
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) nums.push(i);
        else if (nums[nums.length - 1] !== '...') nums.push('...');
      }
      nums.forEach(p => {
        if (p === '...') {
          const sp = document.createElement('span');
          sp.className = 'px-1.5 py-1 text-zinc-400';
          sp.textContent = '...';
          pagNumbersContainer.appendChild(sp);
        } else {
          const b = document.createElement('button');
          b.className = p === currentPage ? 'px-2.5 py-1.5 rounded font-bold bg-hollywood-red text-white' : 'px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800';
          b.textContent = String(p);
          b.addEventListener('click', () => { currentPage = p; applyFilters(); });
          pagNumbersContainer.appendChild(b);
        }
      });
    }

    btnFirst?.addEventListener('click', () => { currentPage = 1; applyFilters(); });
    btnPrev?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; applyFilters(); } });
    btnNext?.addEventListener('click', () => { const m = Math.ceil(filteredPosts.length / pageSize); if (currentPage < m) { currentPage++; applyFilters(); } });
    btnLast?.addEventListener('click', () => { currentPage = Math.max(1, Math.ceil(filteredPosts.length / pageSize)); applyFilters(); });
    searchInput?.addEventListener('input', () => { clearSearchBtn?.classList.toggle('hidden', !searchInput.value); currentPage = 1; applyFilters(); });
    clearSearchBtn?.addEventListener('click', () => { searchInput.value = ''; clearSearchBtn.classList.add('hidden'); currentPage = 1; applyFilters(); });
    categorySelect?.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    pageSizeSelect?.addEventListener('change', () => { pageSize = parseInt(pageSizeSelect.value, 10) || 15; currentPage = 1; applyFilters(); });
    resetFiltersBtn?.addEventListener('click', () => { searchInput.value = ''; categorySelect.value = ''; pageSize = 15; pageSizeSelect.value = '15'; currentPage = 1; applyFilters(); });

    async function handleDeleteStory(e) {
      const btn = e.currentTarget;
      const id = btn.getAttribute('data-id');
      const title = decodeURIComponent(btn.getAttribute('data-title') || '');
      if (!confirm('Delete story: "' + title + '"?')) return;
      const res = await fetch('/api/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) {
        allPosts = allPosts.filter(p => p.id !== id);
        if (badgeTotalCount) badgeTotalCount.textContent = allPosts.length + ' Total Stories';
        if (statTotalPosts) statTotalPosts.textContent = String(allPosts.length);
        if (deleteAlert) {
          deleteAlert.classList.remove('hidden');
          deleteAlert.className = 'mb-4 p-3 rounded-lg border text-xs font-mono bg-emerald-50 border-emerald-300 text-emerald-800';
          deleteAlert.textContent = '✓ Deleted: ' + title;
        }
        applyFilters();
      }
    }

    applyFilters();

    // Sync Trigger
    const btnSync = document.getElementById('btn-sync-now');
    const syncSpinner = document.getElementById('sync-spinner');
    const syncAlert = document.getElementById('sync-alert');
    btnSync?.addEventListener('click', async () => {
      btnSync.disabled = true;
      syncSpinner?.classList.remove('hidden');
      syncAlert?.classList.add('hidden');
      try {
        const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        syncAlert?.classList.remove('hidden');
        if (data.success) {
          syncAlert.className = 'mb-8 p-4 rounded-xl border text-xs bg-emerald-50 border-emerald-300 text-emerald-900';
          syncAlert.innerHTML = '<strong>✓ Sync Completed!</strong> ' + (data.message || '') + (data.createdCount > 0 ? '<br>Reloading in 2s...' : '');
          if (data.createdCount > 0) setTimeout(() => window.location.reload(), 2000);
        } else {
          syncAlert.className = 'mb-8 p-4 rounded-xl border text-xs bg-amber-50 border-amber-300 text-amber-900';
          syncAlert.textContent = data.error || 'Sync status check completed.';
        }
      } catch (err) {
        syncAlert?.classList.remove('hidden');
        syncAlert.className = 'mb-8 p-4 rounded-xl border text-xs bg-red-50 border-red-300 text-red-900';
        syncAlert.textContent = 'Network Error: ' + err.message;
      } finally {
        btnSync.disabled = false;
        syncSpinner?.classList.add('hidden');
      }
    });

    // AI Fetch
    async function handleAiFetch(autoPublish) {
      const input = document.getElementById('ai-fetch-input')?.value?.trim();
      if (!input) { alert('Enter a Finance URL or breaking topic.'); return; }
      const alertBox = document.getElementById('ai-fetch-alert');
      const sp = document.getElementById(autoPublish ? 'ai-pub-spinner' : 'ai-fill-spinner');
      sp?.classList.remove('hidden');
      try {
        const res = await fetch('/api/ai-fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: input,
            category: document.getElementById('ai-fetch-category')?.value || undefined,
            hint: document.getElementById('ai-fetch-hint')?.value || undefined,
            autoPublish,
          }),
        });
        const data = await res.json();
        alertBox?.classList.remove('hidden');
        if (data.success && data.post) {
          if (autoPublish) {
            alertBox.className = 'p-4 rounded-xl border text-xs bg-emerald-950/80 border-emerald-500/50 text-emerald-200';
            alertBox.innerHTML = '<strong>✓ Published!</strong> <a href="' + data.url + '" target="_blank" class="underline text-white ml-1">View Live ↗</a>';
            setTimeout(() => window.location.reload(), 1800);
          } else {
            document.getElementById('post-title').value = data.post.title || '';
            document.getElementById('post-category').value = data.post.category || 'personal-finance';
            document.getElementById('post-image').value = data.post.featuredImage || '';
            document.getElementById('post-excerpt').value = data.post.excerpt || '';
            document.getElementById('post-content').value = data.post.content || '';
            alertBox.className = 'p-4 rounded-xl border text-xs bg-emerald-950/80 border-emerald-500/50 text-emerald-200';
            alertBox.textContent = '✓ Hindi article drafted and filled into the editor below!';
            document.getElementById('manual-publish-section')?.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          alertBox.className = 'p-4 rounded-xl border text-xs bg-red-950/80 border-red-500/50 text-red-200';
          alertBox.textContent = data.error || 'AI Fetch failed.';
        }
      } catch (err) {
        alertBox?.classList.remove('hidden');
        alertBox.className = 'p-4 rounded-xl border text-xs bg-red-950/80 border-red-500/50 text-red-200';
        alertBox.textContent = err.message;
      } finally {
        sp?.classList.add('hidden');
      }
    }
    document.getElementById('btn-ai-fetch-fill')?.addEventListener('click', () => handleAiFetch(false));
    document.getElementById('btn-ai-fetch-publish')?.addEventListener('click', () => handleAiFetch(true));

    // Manual Publish
    document.getElementById('form-manual-post')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const box = document.getElementById('manual-post-alert');
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('post-title').value,
          category: document.getElementById('post-category').value,
          authorName: document.getElementById('post-author').value,
          featuredImage: document.getElementById('post-image').value,
          excerpt: document.getElementById('post-excerpt').value,
          content: document.getElementById('post-content').value,
        }),
      });
      const data = await res.json();
      box?.classList.remove('hidden');
      if (data.success) {
        box.className = 'mb-4 p-4 rounded-xl border text-xs bg-emerald-50 border-emerald-300 text-emerald-900';
        box.innerHTML = '<strong>✓ Published!</strong> <a href="' + data.url + '" target="_blank" class="underline font-bold">View Story ↗</a>';
        setTimeout(() => window.location.reload(), 1800);
      } else {
        box.className = 'mb-4 p-4 rounded-xl border text-xs bg-red-50 border-red-300 text-red-900';
        box.textContent = data.error || 'Publish failed.';
      }
    });
  </script>`;

  return renderAdminShell({
    title: 'LoanKaise Control Hub | Operations & Hindi Editorial Admin',
    description: 'Manage Top-10 Finance News sources, Hindi AI rewriting, and Total Posts pagination.',
    bodyHtml,
    trendingPosts: posts,
  });
}
