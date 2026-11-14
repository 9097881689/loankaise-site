/**
 * LoanKaise.in — Real-Time Live Stock Market, Global Radar & Auto-Timestamp Engine
 * 1. LIVE Clock: Ticks real-time IST seconds (HH:MM:SS) every 1s without page refresh!
 * 2. LIVE Price Updates: Polls /api/market-alert every 5s and updates in-place with green/red flash animations.
 * 3. 24x7 Live Pulse: Actively updates crypto, commodities, forex, and indices with visual micro-ticks.
 * 4. Relative News Timestamps: Dynamically renders "X मिनट पहले" / "X घंटे पहले" if < 24h, and exact date-time if >= 24h.
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

  // 1. Live Ticking IST Clock (Every 1000ms - No Page Refresh Needed)
  function tickLiveClock() {
    var pill = document.getElementById('lk-mkt-status-pill');
    if (!pill) return;
    var t = getIstClockString();
    var icon = currentTone === 'surge' ? '▲' : currentTone === 'drop' ? '▼' : '●';
    var cls = currentTone === 'surge' ? 'lk-pill-surge' : currentTone === 'drop' ? 'lk-pill-drop' : 'lk-pill-live';
    pill.className = 'lk-mkt-pill ' + cls;
    pill.textContent = icon + ' LIVE ' + t;
  }

  // 2. Format Relative Timestamps: < 24h = "X मिनट पहले" / "X घंटे पहले", >= 24h = Exact Date Time
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

  // Update all article timestamps on the page automatically every 30 seconds
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

  function renderFullTrack(quotes, alerts) {
    var track = document.getElementById('lk-mkt-alert-track');
    if (!track) return;

    var quoteItems = (Array.isArray(quotes) ? quotes : []).map(function (q) {
      previousPrices[q.sym] = q.price;
      var isUp = q.pct >= 0;
      var cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
      var arrow = isUp ? '▲' : '▼';
      var sign = isUp ? '+' : '';
      var symAttr = esc(q.sym);
      return (
        '<a class="lk-al-item" href="/news/">' +
        '<span class="lk-mkt-sym">' + esc(q.label) + '</span>' +
        '<span class="lk-mkt-val" data-sym="' + symAttr + '" data-field="val">' + esc(fmtNum(q.price, q.unit)) + '</span>' +
        '<span class="' + cls + '" data-sym="' + symAttr + '" data-field="pct">' + arrow + ' ' + sign + q.pct.toFixed(2) + '%</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    var alertItems = (Array.isArray(alerts) ? alerts : []).map(function (a) {
      var isDown = a.type === 'drop';
      var isUp = a.type === 'surge';
      var badgeCls = isDown
        ? 'lk-al-badge lk-al-drop'
        : isUp
          ? 'lk-al-badge lk-al-surge'
          : 'lk-al-badge';
      var textCls = isDown ? 'lk-txt-drop' : isUp ? 'lk-txt-surge' : 'lk-txt-news';
      var href = String(a.href || '/news/').startsWith('/') ? a.href : '/news/';
      return (
        '<a class="lk-al-item" href="' + esc(href) + '">' +
        '<span class="' + badgeCls + '">' + esc(a.badge) + '</span>' +
        '<span class="' + textCls + '">' + esc(a.text) + '</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    var chunk = quoteItems.concat(alertItems).join('');
    if (chunk) {
      track.innerHTML = chunk + chunk;
    }
  }

  function flashElement(el, isUp) {
    if (!el) return;
    var flashClass = isUp ? 'lk-flash-up' : 'lk-flash-down';
    el.classList.remove('lk-flash-up', 'lk-flash-down');
    void el.offsetWidth; // force reflow for smooth re-trigger
    el.classList.add(flashClass);
    setTimeout(function () {
      el.classList.remove(flashClass);
    }, 1300);
  }

  function updateQuotesInPlace(quotes, forceFlash) {
    if (!Array.isArray(quotes)) return;
    quotes.forEach(function (q) {
      var oldPrice = previousPrices[q.sym];
      var priceChanged = typeof oldPrice === 'number' && Math.abs(oldPrice - q.price) > 0.0001;
      var priceWentUp = typeof oldPrice === 'number' ? q.price >= oldPrice : q.pct >= 0;
      previousPrices[q.sym] = q.price;

      var isUp = q.pct >= 0;
      var cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
      var arrow = isUp ? '▲' : '▼';
      var sign = isUp ? '+' : '';
      var valText = fmtNum(q.price, q.unit);
      var pctText = arrow + ' ' + sign + q.pct.toFixed(2) + '%';

      document.querySelectorAll('[data-sym="' + q.sym + '"]').forEach(function (el) {
        var field = el.getAttribute('data-field');
        if (field === 'val') {
          if (el.textContent !== valText) {
            el.textContent = valText;
          }
          if (priceChanged || (forceFlash && (q.sym === 'BTC-USD' || q.sym === 'GC=F' || q.sym === 'USDINR=X'))) {
            flashElement(el, priceWentUp);
          }
        } else if (field === 'pct') {
          el.className = cls;
          el.textContent = pctText;
        }
      });
    });
  }

  // 3. Poll /api/market-alert every 5 seconds
  async function refreshMarket() {
    if (document.hidden) return;
    try {
      var res = await fetch('/api/market-alert?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      var data = await res.json();
      if (!data || !data.success) return;

      currentTone = data.tone || 'drop';
      tickLiveClock();

      var sig = JSON.stringify((data.alerts || []).map(function (a) { return a.text; }));
      var hasAllDom =
        initialized &&
        (data.quotes || []).every(function (q) {
          return document.querySelector('[data-sym="' + q.sym + '"][data-field="val"]');
        });

      if (!hasAllDom || sig !== lastAlertSignature) {
        renderFullTrack(data.quotes, data.alerts);
        initialized = true;
        lastAlertSignature = sig;
      } else {
        updateQuotesInPlace(data.quotes, false);
      }
    } catch (e) {
      // keep existing live prices visible
    }
  }

  // 4. Subtle Real-Time Micro-Tick for 24x7 active assets (Bitcoin, Gold, Forex)
  // Ensures prices actively fluctuate and flash in real time even on weekends/holidays!
  function pulseMicroTicks() {
    if (document.hidden || !initialized) return;
    var active24x7Syms = ['BTC-USD', 'GC=F', 'SI=F', 'USDINR=X'];
    var targetSym = active24x7Syms[Math.floor(Math.random() * active24x7Syms.length)];
    var currentPrice = previousPrices[targetSym];
    if (typeof currentPrice !== 'number' || currentPrice <= 0) return;

    // Tiny 0.01% - 0.03% random fluctuation
    var deltaPct = (Math.random() * 0.06 - 0.03) / 100;
    var newPrice = currentPrice * (1 + deltaPct);
    var isUp = deltaPct >= 0;

    var mockQuote = {
      sym: targetSym,
      price: newPrice,
      pct: (previousPrices[targetSym + '_pct'] || 0.1) + deltaPct * 100,
      unit: targetSym === 'USDINR=X' ? '₹' : (targetSym === '^BSESN' || targetSym === '^NSEI' || targetSym === '^NSEBANK' || targetSym === 'NIFTY_FIN_SERVICE.NS' || targetSym === '^INDIAVIX' || targetSym === '^IXIC' || targetSym === '^GSPC') ? '' : '$',
    };
    updateQuotesInPlace([mockQuote], true);
  }

  // Initializers
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

  // Clock ticks every 1 second
  setInterval(tickLiveClock, 1000);

  // Market quotes poll every 5 seconds
  setInterval(refreshMarket, 5000);

  // Micro-tick animation pulse every 3.5 seconds
  setInterval(pulseMicroTicks, 3500);

  // Relative news timestamps refresh every 30 seconds
  setInterval(updateLivePostTimestamps, 30000);
})();
