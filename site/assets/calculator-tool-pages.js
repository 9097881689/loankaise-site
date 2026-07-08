(function(){
  const CONFIG = window.TOOL_PAGE_CONFIG;
  if(!CONFIG) return;

  const $ = (id) => document.getElementById(id);
  const formGrid = $('form-grid');
  const resultBox = $('result-box');
  const state = { lastText:'', printableHtml:'' };

  function formatNumber(v,d=2){
    return isFinite(v) ? Number(v).toLocaleString('en-IN',{maximumFractionDigits:d,minimumFractionDigits:d}) : '—';
  }

  function formatMoney(v){
    if(!isFinite(v)) return '—';
    return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v);
  }

  function escapeHtml(text){
    return String(text).replace(/[&<>]/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  }

  function setTheme(){
    const saved = localStorage.getItem('lk-theme');
    if(saved==='dark') document.documentElement.style.colorScheme='dark';
  }

  function toggleTheme(){
    const next = localStorage.getItem('lk-theme')==='dark' ? 'light' : 'dark';
    localStorage.setItem('lk-theme', next);
    document.documentElement.style.colorScheme = next==='dark' ? 'dark' : 'light';
  }

  function renderFields(){
    formGrid.innerHTML = CONFIG.fields.map((field) => {
      const tag = field.type === 'textarea' ? 'textarea' : 'input';
      const money = field.money ? '<span class="field-prefix">₹</span>' : '';
      const attrs = field.type === 'textarea'
        ? `id="${field.id}" rows="${field.rows||4}" placeholder="${field.placeholder||''}" aria-label="${field.label}">${field.value||''}</textarea>`
        : `id="${field.id}" type="${field.type||'number'}" value="${field.value||''}" step="${field.step||'any'}" ${field.type!=='text'?'min="0"':''} placeholder="${field.placeholder||''}" aria-label="${field.label}">`;
      return `<div class="field ${field.full?'full':''}">
        <label for="${field.id}">${field.label}</label>
        <div class="input-shell">${money}<${tag} ${attrs}</div>
        <span class="help">${field.help||''}</span>
      </div>`;
    }).join('');
  }

  function values(){
    const out = {};
    CONFIG.fields.forEach((field) => {
      const el = $(field.id);
      out[field.id] = field.type === 'text' || field.type === 'textarea'
        ? String(el.value || '').trim()
        : parseFloat(el.value);
    });
    return out;
  }

  function validate(v){
    for(const field of CONFIG.fields){
      const value = v[field.id];
      if(field.required !== false && (field.type === 'text' || field.type === 'textarea')){
        if(!value) return `Please enter ${field.label.toLowerCase()}.`;
      }
      if(field.type !== 'text' && field.type !== 'textarea' && (!isFinite(value) || value < 0)){
        return `Please enter a valid ${field.label.toLowerCase()}.`;
      }
    }
    return '';
  }

  function monthlyEmi(principal, monthlyRate, months){
    if(months<=0) return 0;
    if(monthlyRate===0) return principal/months;
    return principal*monthlyRate*Math.pow(1+monthlyRate,months)/(Math.pow(1+monthlyRate,months)-1);
  }

  function buildMetrics(metrics){
    return `<div class="metrics">${metrics.map(([label,val]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(val))}</strong></div>`).join('')}</div>`;
  }

  function showError(message){
    resultBox.className='result-box show error';
    resultBox.innerHTML=`<strong style="color:#b91c1c">${escapeHtml(message)}</strong>`;
    state.lastText = message;
    state.printableHtml = `<p>${escapeHtml(message)}</p>`;
  }

  function renderResult({badge, hero, metrics, steps, table, summaryLines, printableHtml}){
    state.lastText = [CONFIG.name, ...summaryLines].join('\n');
    state.printableHtml = printableHtml || `<h1>${escapeHtml(CONFIG.name)}</h1><p>${summaryLines.map(escapeHtml).join('<br>')}</p>`;
    const stepsHtml = steps?.length ? `<div class="steps"><h3>Calculation steps</h3><ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></div>` : '';
    const tableHtml = table?.length ? `<div class="table-card"><div class="table-wrap"><table class="result-table"><tbody>${table.map((row) => `<tr><th>${escapeHtml(row[0])}</th><td>${escapeHtml(String(row[1]))}</td></tr>`).join('')}</tbody></table></div></div>` : '';
    resultBox.className='result-box show';
    resultBox.innerHTML = `<div class="result-hero"><div><span class="result-pill">${escapeHtml(badge)}</span><strong>${escapeHtml(String(hero))}</strong></div></div>${buildMetrics(metrics||[])}${stepsHtml}${tableHtml}`;
  }

  function calculateEligibility(v){
    const monthlyRate = v.rate/1200;
    const months = v.months;
    const foir = (v.foir || 45) / 100;
    const emiCapacity = Math.max(0, v.income*foir - v.existing);
    const eligibility = monthlyRate===0
      ? emiCapacity*months
      : emiCapacity*(Math.pow(1+monthlyRate,months)-1)/(monthlyRate*Math.pow(1+monthlyRate,months));
    const totalRepay = emiCapacity*months;
    renderResult({
      badge:'Estimated loan eligibility',
      hero:formatMoney(eligibility),
      metrics:[
        ['Safe EMI capacity', formatMoney(emiCapacity)],
        ['Approx total repayment', formatMoney(totalRepay)],
        ['Assumed FOIR', `${formatNumber(foir*100,0)}%`]
      ],
      steps:[
        `Safe EMI capacity = monthly income × FOIR - existing EMI`,
        `Monthly rate = annual interest ÷ 12 = ${formatNumber(v.rate/12,4)}%`,
        `Eligibility is reverse-calculated from EMI, rate and tenure`
      ],
      table:[
        ['Monthly income', formatMoney(v.income)],
        ['Existing EMI', formatMoney(v.existing)],
        ['Safe new EMI capacity', formatMoney(emiCapacity)],
        ['Indicative eligibility', formatMoney(eligibility)]
      ],
      summaryLines:[
        `Estimated eligibility: ${formatMoney(eligibility)}`,
        `Safe EMI capacity: ${formatMoney(emiCapacity)}`,
        `Assumed FOIR: ${formatNumber(foir*100,0)}%`
      ]
    });
  }

  function calculatePrepayment(v){
    const monthlyRate = v.rate/1200;
    const currentEmi = monthlyEmi(v.balance, monthlyRate, v.months);
    const originalInterest = currentEmi*v.months - v.balance;
    const reducedBalance = Math.max(0, v.balance - v.prepay);
    const newEmi = monthlyEmi(reducedBalance, monthlyRate, v.months);
    const newInterest = newEmi*v.months - reducedBalance;
    const interestSaved = Math.max(0, originalInterest - newInterest);
    const revisedMonths = currentEmi>0 && monthlyRate>=0 ? Math.ceil(Math.log(currentEmi/(currentEmi-reducedBalance*monthlyRate))/Math.log(1+monthlyRate)) : 0;
    renderResult({
      badge:'Estimated prepayment benefit',
      hero:formatMoney(interestSaved),
      metrics:[
        ['Current EMI', formatMoney(currentEmi)],
        ['New EMI (same tenure)', formatMoney(newEmi)],
        ['Balance after prepayment', formatMoney(reducedBalance)]
      ],
      steps:[
        `Current EMI is calculated on outstanding balance, current rate and remaining tenure`,
        `Prepayment reduces the principal immediately, so future interest is charged on a smaller balance`,
        `Interest saved = old total interest - revised total interest`
      ],
      table:[
        ['Outstanding balance', formatMoney(v.balance)],
        ['Prepayment amount', formatMoney(v.prepay)],
        ['Estimated interest saved', formatMoney(interestSaved)],
        ['Approx revised tenure if EMI stays same', revisedMonths ? `${revisedMonths} months` : '—']
      ],
      summaryLines:[
        `Estimated interest saved: ${formatMoney(interestSaved)}`,
        `New EMI for same tenure: ${formatMoney(newEmi)}`,
        `Approx revised tenure at same EMI: ${revisedMonths ? `${revisedMonths} months` : 'not available'}`
      ]
    });
  }

  function calculateApplication(v){
    const today = new Date().toLocaleDateString('en-IN');
    const detail = v.detail || v.subject;
    const letter = `
      <div id="letter">
        <p><strong>दिनांक:</strong> ${escapeHtml(today)}</p>
        <p>सेवा में,<br>शाखा प्रबंधक<br>${escapeHtml(v.bank)}</p>
        <p><strong>विषय:</strong> ${escapeHtml(v.subject)}</p>
        <p>महोदय/महोदया,</p>
        <p>सविनय निवेदन है कि ${escapeHtml(detail)}. कृपया मेरे अनुरोध पर आवश्यक कार्रवाई करने की कृपा करें।</p>
        <p>धन्यवाद।</p>
        <p>भवदीय,<br><strong>${escapeHtml(v.name)}</strong></p>
      </div>`;
    renderResult({
      badge:'Application generated',
      hero:'Ready to copy / print',
      metrics:[
        ['Applicant name', v.name],
        ['Bank / branch', v.bank],
        ['Subject', v.subject]
      ],
      steps:[
        'Apni basic details aur request subject fill karein',
        'Generated letter ko review karein aur zarurat ho to wording customize karein',
        'Copy, print ya PDF save karke branch me submit karein'
      ],
      table:[
        ['Date', today],
        ['Applicant', v.name],
        ['Bank', v.bank]
      ],
      summaryLines:[
        `Applicant: ${v.name}`,
        `Bank/Branch: ${v.bank}`,
        `Subject: ${v.subject}`
      ],
      printableHtml: letter
    });
    resultBox.insertAdjacentHTML('beforeend', `<div class="steps"><h3>Generated application</h3>${letter}</div>`);
  }

  function calculate(){
    const v = values();
    const err = validate(v);
    if(err) return showError(err);
    if(CONFIG.engine==='eligibility') return calculateEligibility(v);
    if(CONFIG.engine==='prepayment') return calculatePrepayment(v);
    if(CONFIG.engine==='application') return calculateApplication(v);
  }

  function copyResult(){
    if(!state.lastText) return;
    navigator.clipboard.writeText(state.lastText).then(() => alert('Result copied to clipboard.'));
  }

  function downloadPdf(){
    if(!state.lastText) return;
    const lines = state.lastText.split('\n');
    let y = 760;
    let stream = 'BT /F1 16 Tf 50 800 Td ('+CONFIG.name.replace(/[()]/g,'')+') Tj ET\n';
    for(const line of lines){
      stream += `BT /F1 11 Tf 50 ${y} Td (${String(line).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}) Tj ET\n`;
      y -= 18;
      if(y < 60) break;
    }
    const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj
4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
5 0 obj<< /Length ${stream.length} >>stream
${stream}endstream endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000243 00000 n 
0000000313 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
${313+stream.length+32}
%%EOF`;
    const blob = new Blob([pdf],{type:'application/pdf'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (CONFIG.slug || 'calculator') + '.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function shareResult(){
    if(!state.lastText) return;
    const payload = { title: CONFIG.name, text: state.lastText, url: location.href };
    if(navigator.share) navigator.share(payload).catch(()=>{});
    else navigator.clipboard.writeText(location.href).then(()=>alert('Link copied to clipboard.'));
  }

  function printResult(){
    if(CONFIG.engine !== 'application') return window.print();
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if(!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(CONFIG.name)}</title><style>body{font-family:Arial,sans-serif;padding:32px;line-height:1.7;color:#111}#letter{max-width:700px;margin:auto}</style></head><body>${state.printableHtml || ''}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function resetForm(){
    renderFields();
    resultBox.className='result-box';
    resultBox.innerHTML='';
    state.lastText='';
    bindFieldEvents();
  }

  function bindFieldEvents(){
    CONFIG.fields.forEach((field)=>{
      const el = $(field.id);
      if(!el) return;
      el.addEventListener('input', () => {
        if(CONFIG.engine !== 'application') calculate();
      });
      el.addEventListener('change', () => {
        if(CONFIG.engine !== 'application') calculate();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTheme();
    renderFields();
    bindFieldEvents();
    $('calc-form')?.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
    $('reset-btn')?.addEventListener('click', resetForm);
    $('copy-btn')?.addEventListener('click', copyResult);
    $('print-btn')?.addEventListener('click', printResult);
    $('pdf-btn')?.addEventListener('click', downloadPdf);
    $('share-btn')?.addEventListener('click', shareResult);
    $('theme-toggle')?.addEventListener('click', toggleTheme);
    if(CONFIG.engine !== 'application') calculate();
  });
})();
