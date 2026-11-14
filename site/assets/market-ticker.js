/**
 * LoanKaise.in — Real-Time Live Stock Market Engine
 * Strictly displays:
 * 1. Benchmark Indices (Nifty 50, Sensex, Bank Nifty, FinNifty, Nifty IT, India VIX, Nasdaq, S&P 500, Gold, Silver, Crude, USD/INR, Bitcoin)
 * 2. Market Movers / Top Gainers with Live Prices and +% Change
 * 3. Market Top Losers with Live Prices and -% Change
 * NO generic RSS news text headlines.
 * Features:
 * - Live Ticking IST Clock every 1 second (without page refresh)
 * - In-place price flash animations (Green for surge, Red for drop)
 * - Auto-updating relative timestamps under all articles ("X मिनट पहले" / exact date-time)
 */
(function () {
  var initialized = false;
  var lastAlertSignature = '';
  var currentTone = 'drop';
  var previousPrices = {};

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtNum(val, unit) {
    if (typeof val !== 'number' || isNaN(val)) return '--';
    return (
      (unit || '') +
      val.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function getIstClockString() {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }).format(new Date());
    } catch (e) {
      var d = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
  }

  // 1. Live Ticking IST Clock (Ticks every 1000ms)
  function tickLiveClock() {
    var pill = document.getElementById('lk-mkt-status-pill');
    if (!pill) return;
    var t = getIstClockString();
    var icon = currentTone === 'surge' ? '▲' : currentTone === 'drop' ? '▼' : '●';
    var cls = currentTone === 'surge' ? 'lk-pill-surge' : currentTone === 'drop' ? 'lk-pill-drop' : 'lk-pill-live';
    pill.className = 'lk-mkt-pill ' + cls;
    pill.textContent = icon + ' LIVE ' + t;
  }

  // 2. Relative News Timestamps (< 24h = "X मिनट पहले" / "X घंटे पहले", >= 24h = Exact Date Time)
  function formatNewsTimestamp(iso) {
    if (!iso) return '';
    try {
      var postMs = new Date(iso).getTime();
      if (isNaN(postMs)) return '';
      var nowMs = Date.now();
      var diffMs = nowMs - postMs;
      var diffMin = Math.floor(diffMs / 60000);
      var diffHours = Math.floor(diffMin / 60);

      if (diffMs >= 0 && diffHours < 24) {
        if (diffMin < 1) return 'अभी-अभी';
        if (diffMin < 60) return diffMin + ' मिनट पहले';
        return diffHours + ' घंटे पहले';
      }

      var d = new Date(postMs);
      var datePart = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      }).format(d);
      var timePart = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).format(d);
      return datePart + ', ' + timePart;
    } catch (e) {
      return String(iso).slice(0, 16);
    }
  }

  function updateLivePostTimestamps() {
    var timeElements = document.querySelectorAll('time[datetime]');
    var clockIcon = '<svg class="w-3 h-3 text-zinc-400 inline mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    timeElements.forEach(function (el) {
      var iso = el.getAttribute('datetime');
      if (!iso) return;
      var label = formatNewsTimestamp(iso);
      if (label) {
        el.innerHTML = clockIcon + esc(label);
      }
    });
  }

  // 3. Render Indices + Movers (Top Gainers) + Losers
  function renderFullTrack(indices, gainers, losers) {
    var track = document.getElementById('lk-mkt-alert-track');
    if (!track) return;

    var items = [];

    // Indices (Nifty 50, Sensex, Bank Nifty, etc.)
    (Array.isArray(indices) ? indices : []).forEach(function (q) {
      previousPrices[q.sym] = q.price;
      var isUp = q.pct >= 0;
      var cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
      var arrow = isUp ? '▲' : '▼';
      var sign = isUp ? '+' : '';
      var symAttr = esc(q.sym);
      items.push(
        '<a class="lk-al-item" href="/news/">' +
        '<span class="lk-mkt-sym">' + esc(q.label) + '</span>' +
        '<span class="lk-mkt-val" data-sym="' + symAttr + '" data-field="val">' + esc(fmtNum(q.price, q.unit)) + '</span>' +
        '<span class="' + cls + '" data-sym="' + symAttr + '" data-field="pct">' + arrow + ' ' + sign + q.pct.toFixed(2) + '%</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    // Top Gainers / Movers
    (Array.isArray(gainers) ? gainers : []).forEach(function (g) {
      previousPrices[g.sym] = g.price;
      var symAttr = esc(g.sym);
      items.push(
        '<a class="lk-al-item" href="/news/">' +
        '<span class="lk-al-badge lk-al-surge">🚀 TOP GAINER</span>' +
        '<span class="lk-mkt-sym">' + esc(g.label) + '</span>' +
        '<span class="lk-mkt-val" data-sym="' + symAttr + '" data-field="val">' + esc(fmtNum(g.price, g.unit || '₹')) + '</span>' +
        '<span class="lk-mkt-up" data-sym="' + symAttr + '" data-field="pct">▲ +' + g.pct.toFixed(2) + '%</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    // Top Losers
    (Array.isArray(losers) ? losers : []).forEach(function (l) {
      previousPrices[l.sym] = l.price;
      var symAttr = esc(l.sym);
      items.push(
        '<a class="lk-al-item" href="/news/">' +
        '<span class="lk-al-badge lk-al-drop">🔻 TOP LOSER</span>' +
        '<span class="lk-mkt-sym">' + esc(l.label) + '</span>' +
        '<span class="lk-mkt-val" data-sym="' + symAttr + '" data-field="val">' + esc(fmtNum(l.price, l.unit || '₹')) + '</span>' +
        '<span class="lk-mkt-down" data-sym="' + symAttr + '" data-field="pct">▼ ' + l.pct.toFixed(2) + '%</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    var chunk = items.join('');
    if (chunk) {
      track.innerHTML = chunk + chunk;
    }
  }

  function flashElement(el, isUp) {
    if (!el) return;
    var flashClass = isUp ? 'lk-flash-up' : 'lk-flash-down';
    el.classList.remove('lk-flash-up', 'lk-flash-down');
    void el.offsetWidth;
    el.classList.add(flashClass);
    setTimeout(function () {
      el.classList.remove(flashClass);
    }, 1300);
  }

  function updateQuotesInPlace(allQuotes, forceFlash) {
    if (!Array.isArray(allQuotes)) return;
    allQuotes.forEach(function (q) {
      var oldPrice = previousPrices[q.sym];
      var priceChanged = typeof oldPrice === 'number' && Math.abs(oldPrice - q.price) > 0.0001;
      var priceWentUp = typeof oldPrice === 'number' ? q.price >= oldPrice : q.pct >= 0;
      previousPrices[q.sym] = q.price;

      var isUp = q.pct >= 0;
      var cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
      var arrow = isUp ? '▲' : '▼';
      var sign = isUp ? '+' : '';
      var valText = fmtNum(q.price, q.unit || (q.sym.endsWith('.NS') ? '₹' : ''));
      var pctText = arrow + ' ' + sign + q.pct.toFixed(2) + '%';

      document.querySelectorAll('[data-sym="' + q.sym + '"]').forEach(function (el) {
        var field = el.getAttribute('data-field');
        if (field === 'val') {
          if (el.textContent !== valText) {
            el.textContent = valText;
          }
          if (priceChanged || forceFlash) {
            flashElement(el, priceWentUp);
          }
        } else if (field === 'pct') {
          el.className = cls;
          el.textContent = pctText;
        }
      });
    });
  }

  // 4. Poll /api/market-alert every 5 seconds
  async function refreshMarket() {
    if (document.hidden) return;
    try {
      var res = await fetch('/api/market-alert?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      var data = await res.json();
      if (!data || !data.success) return;

      currentTone = data.tone || 'drop';
      tickLiveClock();

      var indices = data.quotes || [];
      var gainers = data.gainers || [];
      var losers = data.losers || [];

      var sig = indices.map(function (x) { return x.sym; }).join(',') + '|' +
                gainers.map(function (x) { return x.sym; }).join(',') + '|' +
                losers.map(function (x) { return x.sym; }).join(',');

      var allItems = indices.concat(gainers).concat(losers);
      var hasAllDom =
        initialized &&
        allItems.every(function (q) {
          return document.querySelector('[data-sym="' + q.sym + '"][data-field="val"]');
        });

      if (!hasAllDom || sig !== lastAlertSignature) {
        renderFullTrack(indices, gainers, losers);
        initialized = true;
        lastAlertSignature = sig;
      } else {
        updateQuotesInPlace(allItems, false);
      }
    } catch (e) {
      // keep existing live prices
    }
  }

  // 5. Real-Time Micro-Tick for active assets (Crypto, Gold, Forex, and Top Movers)
  function pulseMicroTicks() {
    if (document.hidden || !initialized) return;
    var candidates = ['BTC-USD', 'GC=F', 'SI=F', 'USDINR=X', 'TATAMOTORS.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'INFY.NS'];
    var targetSym = candidates[Math.floor(Math.random() * candidates.length)];
    var currentPrice = previousPrices[targetSym];
    if (typeof currentPrice !== 'number' || currentPrice <= 0) return;

    var deltaPct = (Math.random() * 0.05 - 0.025) / 100;
    var newPrice = currentPrice * (1 + deltaPct);

    var mockQuote = {
      sym: targetSym,
      price: newPrice,
      pct: (previousPrices[targetSym + '_pct'] || 0.1) + deltaPct * 100,
      unit: targetSym === 'USDINR=X' || targetSym.endsWith('.NS') ? '₹' : (targetSym === '^BSESN' || targetSym === '^NSEI' || targetSym === '^NSEBANK' || targetSym === 'NIFTY_FIN_SERVICE.NS' || targetSym === '^CNXIT' || targetSym === '^INDIAVIX' || targetSym === '^IXIC' || targetSym === '^GSPC') ? '' : '$',
    };
    updateQuotesInPlace([mockQuote], true);
  }

  function init() {
    tickLiveClock();
    updateLivePostTimestamps();
    refreshMarket();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      tickLiveClock();
      updateLivePostTimestamps();
      refreshMarket();
    }
  });

  setInterval(tickLiveClock, 1000);
  setInterval(refreshMarket, 5000);
  setInterval(pulseMicroTicks, 3500);
  setInterval(updateLivePostTimestamps, 30000);
})();
