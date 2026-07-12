(function(){
  if(typeof CONFIG === 'undefined' || typeof document === 'undefined'){ return; }

  const CURRENCIES = [
    ['INR','₹','en-IN','Indian Rupee'],
    ['USD','$','en-US','US Dollar'],
    ['EUR','€','de-DE','Euro'],
    ['GBP','£','en-GB','British Pound'],
    ['AED','د.إ','en-AE','UAE Dirham'],
    ['SAR','﷼','ar-SA','Saudi Riyal'],
    ['SGD','S$','en-SG','Singapore Dollar'],
    ['AUD','A$','en-AU','Australian Dollar'],
    ['CAD','C$','en-CA','Canadian Dollar']
  ];

  const currencyMap = Object.fromEntries(CURRENCIES.map(([code,symbol,locale,name]) => [code,{symbol,locale,name}]));
  const toINR = { INR:1, USD:83.5, EUR:91, GBP:106, AED:22.74, SAR:22.25, SGD:62, AUD:55, CAD:60 };
  const isConverter = CONFIG.engine === 'currency';
  const storageKey = 'lk-display-currency';
  const root = document.documentElement;
  let autoCalcTimer = null;

  function activeCode(){
    const saved = localStorage.getItem(storageKey);
    if(saved && currencyMap[saved]) return saved;
    return 'INR';
  }

  function setCurrencyMeta(code){
    const picked = currencyMap[code] || currencyMap.INR;
    CONFIG.currencyCode = code;
    CONFIG.currencySymbol = picked.symbol;
    CONFIG.currencyLocale = picked.locale;
    root.style.setProperty('--lk-currency-symbol', `'${picked.symbol}'`);
    return picked;
  }

  setCurrencyMeta(activeCode());

  function formatLocalizedNumber(v, d=2){
    return isFinite(v) ? Number(v).toLocaleString(CONFIG.currencyLocale || 'en-IN', {
      maximumFractionDigits:d,
      minimumFractionDigits:d
    }) : '—';
  }

  window.formatNumber = formatLocalizedNumber;
  window.formatMoney = function(v){
    if(!isFinite(v)) return '—';
    try{
      return new Intl.NumberFormat(CONFIG.currencyLocale || 'en-IN', {
        style:'currency',
        currency:CONFIG.currencyCode || 'INR',
        maximumFractionDigits:2
      }).format(v);
    }catch(_err){
      return `${CONFIG.currencySymbol || '₹'}${formatLocalizedNumber(v,2)}`;
    }
  };

  function needsMoneyPrefix(field){
    return /amount|principal|price|cost|income|balance|payment|salary|savings|value|expenses|portfolio|rent|fees|debt|tax|cash|asset|liabilit|contribution|proceeds|gross|hourly|down/i.test(`${field.id} ${field.label}`);
  }

  function getRangeSpec(field){
    const label = `${field.id} ${field.label}`.toLowerCase();
    const val = Math.abs(parseFloat(field.value || '0')) || 0;
    const step = parseFloat(field.step || '1') || 1;
    if(/rate|apr|interest|yield|roi|return|vacancy|dti|residual|marking|withdrawal/i.test(label)){
      return { min: 0, max: 40, step: Math.max(step,0.01), ticks: ['0','10','20','30','40'] };
    }
    if(/month/i.test(label)){
      return { min: 1, max: 360, step: Math.max(step,1), ticks: ['1','60','120','240','360'] };
    }
    if(/year|age/i.test(label)){
      return { min: 1, max: /age/.test(label) ? 80 : 40, step: Math.max(step,1), ticks: /age/.test(label) ? ['18','30','45','60','80'] : ['1','10','20','30','40'] };
    }
    if(/hour/i.test(label)){
      return { min: 1, max: 100, step: Math.max(step,1), ticks: ['1','25','50','75','100'] };
    }
    if(/week/i.test(label)){
      return { min: 1, max: 52, step: Math.max(step,1), ticks: ['1','13','26','39','52'] };
    }
    if(/compound/i.test(label)){
      return { min: 1, max: 365, step: Math.max(step,1), ticks: ['1','12','52','365'] };
    }
    if(/score/i.test(label)){
      return { min: 300, max: 900, step: Math.max(step,1), ticks: ['300','600','750','900'] };
    }
    if(/percent|pct|needs|wants|savings/i.test(label)){
      return { min: 0, max: 100, step: Math.max(step,1), ticks: ['0','25','50','75','100'] };
    }
    const maxBase = Math.max(val || 100000, 1000);
    const max = Math.max(maxBase * 4, maxBase + step * 10);
    return {
      min: 0,
      max,
      step,
      ticks: ['0', shortTick(max*0.25), shortTick(max*0.5), shortTick(max*0.75), shortTick(max)]
    };
  }

  function shortTick(v){
    const n = Number(v);
    if(!isFinite(n)) return '0';
    if(n >= 10000000) return `${Math.round(n/10000000)}Cr`;
    if(n >= 100000) return `${Math.round(n/100000)}L`;
    if(n >= 1000) return `${Math.round(n/1000)}K`;
    return String(Math.round(n));
  }

  function fieldHtml(field){
    const isCurrencyField = isConverter && (field.id === 'from' || field.id === 'to');
    const isMoney = !isCurrencyField && needsMoneyPrefix(field) && field.type !== 'text';
    const range = field.type !== 'text' ? getRangeSpec(field) : null;
    const spanFull = /from|to|amount|question|name|description/i.test(field.id) ? ' full' : '';
    const input = isCurrencyField
      ? `<div class="input-shell"><select aria-label="${field.label}" id="${field.id}">${CURRENCIES.map(([code,, ,name]) => `<option value="${code}" ${String(field.value).toUpperCase()===code?'selected':''}>${code} — ${name}</option>`).join('')}</select></div>`
      : `<div class="input-shell">${isMoney?`<span class="field-prefix">${CONFIG.currencySymbol || '₹'}</span>`:''}<input aria-label="${field.label}" id="${field.id}" type="${field.type}" value="${field.value}" step="${field.step||'any'}" ${field.type!=='text'?'min="0"':''}></div>`;
    const slider = range && !isCurrencyField ? `
      <div class="range-row">
        <input id="${field.id}-range" type="range" min="${range.min}" max="${range.max}" step="${range.step}" value="${field.value}">
        <div class="range-ticks">${(range.ticks || []).map((tick) => `<span>${tick}</span>`).join('')}</div>
      </div>` : '';
    return `<div class="field${spanFull}"><label for="${field.id}">${field.label}</label>${input}${slider}<span class="help">${field.help||''}</span></div>`;
  }

  window.renderFields = function(){
    formGrid.innerHTML = CONFIG.fields.map(fieldHtml).join('');
    bindFieldEnhancements();
  };

  function bindFieldEnhancements(){
    CONFIG.fields.forEach((field) => {
      const input = document.getElementById(field.id);
      const slider = document.getElementById(`${field.id}-range`);
      if(slider && input){
        slider.addEventListener('input', () => {
          input.value = slider.value;
          scheduleAutoCalc();
        });
        input.addEventListener('input', () => {
          const num = parseFloat(input.value);
          if(isFinite(num)){ slider.value = num; }
          scheduleAutoCalc();
        });
      }else if(input){
        input.addEventListener('input', scheduleAutoCalc);
        input.addEventListener('change', scheduleAutoCalc);
      }
    });
    if(isConverter){
      const from = document.getElementById('from');
      const to = document.getElementById('to');
      if(from){ from.addEventListener('change', () => { syncConverterRate(); scheduleAutoCalc(); }); }
      if(to){ to.addEventListener('change', () => { syncConverterRate(); scheduleAutoCalc(); }); }
      syncConverterRate();
    }
    updateMoneyPrefixes();
  }

  function updateMoneyPrefixes(){
    document.querySelectorAll('.field-prefix').forEach((node) => {
      node.textContent = CONFIG.currencySymbol || '₹';
    });
  }

  function injectToolbar(){
    const head = document.querySelector('.calc-head');
    if(!head || head.querySelector('.calc-toolbar')) return;
    const existingTheme = document.getElementById('theme-toggle');
    const toolbar = document.createElement('div');
    toolbar.className = 'calc-toolbar';
    toolbar.innerHTML = `
      <select id="display-currency" class="currency-switch" aria-label="Display currency">
        ${CURRENCIES.map(([code,, ,name]) => `<option value="${code}" ${activeCode()===code?'selected':''}>${code} — ${name}</option>`).join('')}
      </select>
    `;
    if(existingTheme){
      existingTheme.classList.add('theme-toggle');
      toolbar.appendChild(existingTheme);
    }
    head.appendChild(toolbar);
    const picker = document.getElementById('display-currency');
    if(picker){
      picker.addEventListener('change', () => {
        localStorage.setItem(storageKey, picker.value);
        setCurrencyMeta(picker.value);
        updateMoneyPrefixes();
        if(typeof calculate === 'function'){ calculate().catch(() => {}); }
      });
    }
  }

  function scheduleAutoCalc(){
    clearTimeout(autoCalcTimer);
    autoCalcTimer = setTimeout(() => {
      if(typeof calculate === 'function'){ calculate().catch(() => {}); }
    }, 140);
  }

  function patchTitles(){
    if(isConverter){
      const intro = document.querySelector('.calc-head p');
      if(intro){ intro.textContent = 'Indian users ke liye INR default hai. Kisi bhi dusri currency me convert karne ke liye apna source aur target code select karein.'; }
      const from = document.getElementById('from');
      const to = document.getElementById('to');
      const rate = document.getElementById('rate');
      if(from && !from.dataset.lkInitialized){
        from.value = 'INR';
        from.dataset.lkInitialized = '1';
      }
      if(to && !to.dataset.lkInitialized){
        to.value = 'USD';
        to.dataset.lkInitialized = '1';
      }
      if(rate && !rate.dataset.lkInitialized){
        rate.dataset.lkInitialized = '1';
      }
      syncConverterRate();
    }
  }

  function enhanceSidebar(){
    const side = document.querySelector('.side-card');
    if(!side || side.dataset.lkSidebarEnhanced === '1') return;
    side.dataset.lkSidebarEnhanced = '1';
    const currentPath = location.pathname.replace(/\/+$/,'/');
    const popular = [
      ['EMI Calculator','/emi-calculator/'],
      ['Loan Calculator','/loan-calculator/'],
      ['Personal Loan Calculator','/personal-loan-calculator/'],
      ['Mortgage Calculator','/mortgage-calculator/'],
      ['Business Loan Calculator','/business-loan-calculator/'],
      ['Interest Calculator','/interest-calculator/'],
      ['Simple Interest Calculator','/simple-interest-calculator/'],
      ['Compound Interest Calculator','/compound-interest-calculator/'],
      ['Savings Calculator','/savings-calculator/'],
      ['Investment Calculator','/investment-calculator/'],
      ['Budget Calculator','/budget-calculator/'],
      ['Income Tax Calculator','/income-tax-calculator/']
    ].filter(([,href]) => href !== currentPath).slice(0,10);
    side.innerHTML = `
      <h3 class="lk-sidebar-title">Popular Calculators</h3>
      <ul class="lk-sidebar-list">
        ${popular.map(([label,href]) => `<li><a href="${href}"><span>${label}</span><span>›</span></a></li>`).join('')}
      </ul>
      <a class="lk-all-calculators" href="/calculators/">All Calculators</a>
    `;
  }

  function syncConverterRate(){
    if(!isConverter) return;
    const from = document.getElementById('from');
    const to = document.getElementById('to');
    const rate = document.getElementById('rate');
    if(!from || !to || !rate) return;
    const fromCode = String(from.value || 'INR').toUpperCase();
    const toCode = String(to.value || 'USD').toUpperCase();
    if(!toINR[fromCode] || !toINR[toCode]) return;
    rate.value = (toINR[fromCode] / toINR[toCode]).toFixed(6);
  }

  const originalReset = window.resetForm;
  window.resetForm = function(){
    if(typeof originalReset === 'function'){ originalReset(); }
    bindFieldEnhancements();
    injectToolbar();
    setCurrencyMeta(activeCode());
    scheduleAutoCalc();
  };

  document.addEventListener('DOMContentLoaded', () => {
    setCurrencyMeta(activeCode());
    if(typeof renderFields === 'function'){ renderFields(); }
    injectToolbar();
    enhanceSidebar();
    patchTitles();
    scheduleAutoCalc();
    const form = document.getElementById('calc-form');
    if(form){
      form.addEventListener('change', scheduleAutoCalc);
    }
  });
})();
(()=>{if(window.__lkGoogleAnnoClean)return;window.__lkGoogleAnnoClean=true;const clean=()=>{document.querySelectorAll('.google-anno-sc,.google-anno-skip').forEach(el=>el.remove());document.querySelectorAll('a.google-anno').forEach(a=>{const text=(a.querySelector('.google-anno-t')?.textContent||a.textContent||'').trim();a.replaceWith(document.createTextNode(text?` ${text}`:''))})};const schedule=()=>{clearTimeout(window.__lkGoogleAnnoTimer);window.__lkGoogleAnnoTimer=setTimeout(clean,80)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true})})();
(()=>{if(window.__lkAdGapClean)return;window.__lkAdGapClean=true;const started=Date.now();const collapse=box=>{box.classList.add('ad-collapsed');box.classList.remove('ad-visible');box.style.display='none';box.style.height='0';box.style.minHeight='0';box.style.maxHeight='0';box.style.margin='0';box.style.padding='0';box.style.border='0';box.style.overflow='hidden'};const show=box=>{box.classList.remove('ad-collapsed');box.classList.add('ad-visible');box.style.display='';box.style.height='';box.style.minHeight='';box.style.maxHeight='';box.style.margin='';box.style.padding='';box.style.border='';box.style.overflow=''};const scan=()=>{document.querySelectorAll('.ad-section,.ad-slot').forEach(box=>{const ad=box.querySelector('.adsbygoogle');if(!ad)return;const status=(ad.dataset.adStatus||'').toLowerCase();const hasFrame=!!ad.querySelector('iframe');const hasSize=(ad.offsetHeight||0)>30;const oldEnough=Date.now()-started>5200;if(status==='filled'||hasFrame){show(box);return}if(status==='unfilled'||status==='unfill-optimized'||(oldEnough&&!hasSize)){collapse(box)}})};const schedule=(delay=180)=>{clearTimeout(window.__lkAdGapTimer);window.__lkAdGapTimer=setTimeout(scan,delay)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(900));else schedule(900);[2200,5200,9000].forEach(t=>setTimeout(scan,t));new MutationObserver(()=>schedule()).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ad-status','style','class']})})();
