/**
 * LoanKaise.in — Client-side Live Stock Market Alert Bar Hydrator
 * Polls /api/market-alert (same-origin) cleanly every 60 seconds and updates indices + Hindi alerts.
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
    const formatted = val.toLocaleString('en-IN', {
      minimumFractionDigits: val < 200 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return (unit || '') + formatted;
  }

  function renderQuotes(quotes) {
    const strip = document.getElementById('lk-mkt-indices');
    if (!strip || !Array.isArray(quotes) || !quotes.length) return;
    strip.innerHTML = quotes
      .map((q) => {
        const isUp = q.pct >= 0;
        const cls = isUp ? 'lk-mkt-up' : 'lk-mkt-down';
        const arrow = isUp ? '▲' : '▼';
        const sign = isUp ? '+' : '';
        return (
          '<span class="lk-mkt-chip">' +
          '<span class="lk-mkt-sym">' + esc(q.label) + '</span>' +
          '<span class="lk-mkt-val">' + esc(fmtNum(q.price, q.unit)) + '</span>' +
          '<span class="' + cls + '">' + arrow + ' ' + sign + q.pct.toFixed(2) + '%</span>' +
          '</span>'
        );
      })
      .join('');
  }

  function renderAlerts(alerts, tone) {
    const pill = document.getElementById('lk-mkt-status-pill');
    const marquee = document.getElementById('lk-mkt-alert-track');
    if (pill) {
      if (tone === 'drop') {
        pill.className = 'lk-mkt-pill lk-pill-drop';
        pill.textContent = '🔻 बड़ा अलर्ट: गिरावट';
      } else if (tone === 'surge') {
        pill.className = 'lk-mkt-pill lk-pill-surge';
        pill.textContent = '🚀 बड़ा अलर्ट: उछाल';
      } else {
        pill.className = 'lk-mkt-pill lk-pill-live';
        pill.textContent = '● LIVE MARKET RADAR';
      }
    }
    if (!marquee || !Array.isArray(alerts) || !alerts.length) return;

    const chunk = alerts
      .map((a) => {
        const badgeCls =
          a.type === 'drop'
            ? 'lk-al-badge lk-al-drop'
            : a.type === 'surge'
            ? 'lk-al-badge lk-al-surge'
            : 'lk-al-badge';
        const href = String(a.href || '/news/').startsWith('/') ? a.href : '/news/';
        return (
          '<a class="lk-al-item" href="' + esc(href) + '">' +
          '<span class="' + badgeCls + '">' + esc(a.badge) + '</span>' +
          '<span>' + esc(a.text) + '</span>' +
          '</a>'
        );
      })
      .join('');

    marquee.innerHTML = chunk + chunk;
  }

  async function refreshMarket() {
    try {
      const res = await fetch('/api/market-alert', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.success) return;
      renderQuotes(data.quotes);
      renderAlerts(data.alerts, data.tone);
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
