/**
 * LoanKaise.in — Single-Line Live Stock Market & Global Radar Ticker
 * Polls /api/market-alert every 60s and streams quotes + green/red surge/drop/news alerts in 1 marquee line.
 */
(function () {
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
        minimumFractionDigits: val < 200 ? 2 : 0,
        maximumFractionDigits: 2,
      })
    );
  }

  function updateSingleLine(quotes, alerts, tone) {
    const pill = document.getElementById('lk-mkt-status-pill');
    const track = document.getElementById('lk-mkt-alert-track');

    if (pill) {
      if (tone === 'drop') {
        pill.className = 'lk-mkt-pill lk-pill-drop';
        pill.textContent = '▼ MARKET ALERT';
      } else if (tone === 'surge') {
        pill.className = 'lk-mkt-pill lk-pill-surge';
        pill.textContent = '▲ MARKET ALERT';
      } else {
        pill.className = 'lk-mkt-pill lk-pill-live';
        pill.textContent = '● MARKET LIVE';
      }
    }

    if (!track) return;

    const quoteItems = (Array.isArray(quotes) ? quotes : []).map((q) => {
      const isUp = q.pct >= 0;
      const cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
      const arrow = isUp ? '▲' : '▼';
      const sign = isUp ? '+' : '';
      return (
        '<a class="lk-al-item" href="/news/">' +
        '<span class="lk-mkt-sym">' + esc(q.label) + '</span>' +
        '<span class="lk-mkt-val">' + esc(fmtNum(q.price, q.unit)) + '</span>' +
        '<span class="' + cls + '">' + arrow + ' ' + sign + q.pct.toFixed(2) + '%</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    const alertItems = (Array.isArray(alerts) ? alerts : []).map((a) => {
      const isDown = a.type === 'drop';
      const isUp = a.type === 'surge';
      const badgeCls = isDown
        ? 'lk-al-badge lk-al-drop'
        : isUp
          ? 'lk-al-badge lk-al-surge'
          : 'lk-al-badge';
      const textCls = isDown ? 'lk-txt-drop' : isUp ? 'lk-txt-surge' : 'lk-txt-news';
      const href = String(a.href || '/news/').startsWith('/') ? a.href : '/news/';
      return (
        '<a class="lk-al-item" href="' + esc(href) + '">' +
        '<span class="' + badgeCls + '">' + esc(a.badge) + '</span>' +
        '<span class="' + textCls + '">' + esc(a.text) + '</span>' +
        '<span class="lk-sep">•</span>' +
        '</a>'
      );
    });

    const chunk = quoteItems.concat(alertItems).join('');
    if (chunk) {
      track.innerHTML = chunk + chunk;
    }
  }

  async function refreshMarket() {
    try {
      const res = await fetch('/api/market-alert', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.success) return;
      updateSingleLine(data.quotes, data.alerts, data.tone);
    } catch {
      // keep pre-rendered fallback visible
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshMarket);
  } else {
    refreshMarket();
  }
  setInterval(refreshMarket, 60000);
})();
