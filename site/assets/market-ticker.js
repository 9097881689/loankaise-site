/**
 * LoanKaise.in — Real-Time 10s Live Stock Market & Global Radar Ticker
 * Polls /api/market-alert every 10 seconds and updates all Sensex/Nifty/Global prices IN-PLACE
 * without resetting the marquee scroll animation!
 */
(function () {
  var initialized = false;
  var lastAlertSignature = '';

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
        minimumFractionDigits: val < 200 ? 2 : 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function formatIstTime(iso) {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }).format(iso ? new Date(iso) : new Date());
    } catch {
      return 'LIVE';
    }
  }

  function updatePill(tone, updatedAt) {
    var pill = document.getElementById('lk-mkt-status-pill');
    if (!pill) return;
    var t = formatIstTime(updatedAt);
    if (tone === 'drop') {
      pill.className = 'lk-mkt-pill lk-pill-drop';
      pill.textContent = '▼ LIVE ' + t;
    } else if (tone === 'surge') {
      pill.className = 'lk-mkt-pill lk-pill-surge';
      pill.textContent = '▲ LIVE ' + t;
    } else {
      pill.className = 'lk-mkt-pill lk-pill-live';
      pill.textContent = '● LIVE ' + t;
    }
  }

  function renderFullTrack(quotes, alerts) {
    var track = document.getElementById('lk-mkt-alert-track');
    if (!track) return;

    var quoteItems = (Array.isArray(quotes) ? quotes : []).map(function (q) {
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

  function updateQuotesInPlace(quotes) {
    if (!Array.isArray(quotes)) return;
    quotes.forEach(function (q) {
      var isUp = q.pct >= 0;
      var cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
      var arrow = isUp ? '▲' : '▼';
      var sign = isUp ? '+' : '';
      var valText = fmtNum(q.price, q.unit);
      var pctText = arrow + ' ' + sign + q.pct.toFixed(2) + '%';

      document.querySelectorAll('[data-sym="' + q.sym + '"]').forEach(function (el) {
        var field = el.getAttribute('data-field');
        if (field === 'val') {
          el.textContent = valText;
        } else if (field === 'pct') {
          el.className = cls;
          el.textContent = pctText;
        }
      });
    });
  }

  async function refreshMarket() {
    if (document.hidden) return;
    try {
      var res = await fetch('/api/market-alert?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      var data = await res.json();
      if (!data || !data.success) return;

      updatePill(data.tone, data.updatedAt);

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
        // Smooth live tick in-place without restarting scroll animation
        updateQuotesInPlace(data.quotes);
      }
    } catch {
      // keep existing live values visible
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshMarket);
  } else {
    refreshMarket();
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshMarket();
  });
  setInterval(refreshMarket, 10000);
})();
