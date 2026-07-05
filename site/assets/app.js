document.querySelector('.menu-btn')?.addEventListener('click',()=>document.querySelector('.navlinks')?.classList.toggle('open'));
const q=document.querySelector('#site-search');
if(q){q.addEventListener('input',()=>{const s=q.value.toLowerCase().trim();let shown=0;document.querySelectorAll('[data-search]').forEach(el=>{const ok=el.dataset.search.toLowerCase().includes(s);el.style.display=ok?'flex':'none';if(ok)shown++});document.querySelector('.empty').style.display=shown?'none':'block'})}
function money(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)}
window.calcEMI=()=>{const p=+document.querySelector('#amount').value,r=+document.querySelector('#rate').value/1200,n=+document.querySelector('#months').value;if(!p||!r||!n)return;const emi=p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1),total=emi*n;document.querySelector('#emi-out').innerHTML=`<strong>${money(emi)} / month</strong><p>Total payment: ${money(total)} &nbsp; • &nbsp; Interest: ${money(total-p)}</p>`;document.querySelector('#emi-out').classList.add('show')}
window.calcEligibility=()=>{const income=+document.querySelector('#income').value,existing=+document.querySelector('#existing').value||0,rate=+document.querySelector('#rate').value/1200,n=+document.querySelector('#months').value;if(!income||!rate||!n)return;const capacity=Math.max(0,income*.45-existing),loan=capacity*(Math.pow(1+rate,n)-1)/(rate*Math.pow(1+rate,n));document.querySelector('#elig-out').innerHTML=`<strong>Estimated eligibility: ${money(loan)}</strong><p>Safe estimated EMI capacity: ${money(capacity)}. Final approval lender policy और credit profile पर निर्भर है।</p>`;document.querySelector('#elig-out').classList.add('show')}
window.calcPrepay=()=>{const p=+document.querySelector('#balance').value,r=+document.querySelector('#rate').value/1200,n=+document.querySelector('#months').value,x=+document.querySelector('#prepay').value;if(!p||!r||!n||!x)return;const emi=p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1),newp=Math.max(0,p-x),newemi=newp*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1),save=(emi-newemi)*n-x;document.querySelector('#pre-out').innerHTML=`<strong>Approx. interest saving: ${money(Math.max(0,save))}</strong><p>Same tenure रखने पर estimated new EMI: ${money(newemi)}.</p>`;document.querySelector('#pre-out').classList.add('show')}
window.makeLetter=()=>{const name=document.querySelector('#name').value,bank=document.querySelector('#bank').value,subject=document.querySelector('#subject').value,detail=document.querySelector('#detail').value;if(!name||!bank||!subject)return;const today=new Date().toLocaleDateString('en-IN');document.querySelector('#letter-out').innerHTML=`<div id="letter"><p>दिनांक: ${today}</p><p>सेवा में,<br>शाखा प्रबंधक<br>${bank}</p><p><b>विषय: ${subject}</b></p><p>महोदय/महोदया,</p><p>सविनय निवेदन है कि ${detail||subject.toLowerCase()}. कृपया मेरे अनुरोध पर आवश्यक कार्रवाई करने की कृपा करें।</p><p>धन्यवाद।</p><p>भवदीय,<br><b>${name}</b></p></div><button class="btn btn-primary" onclick="window.print()">Print / Save PDF</button>`;document.querySelector('#letter-out').classList.add('show')}

const mockState={questions:[],answers:{},secondsLeft:7200,timer:null,started:false};
function seededShuffle(items,seed){const arr=[...items];let s=seed||Date.now();for(let i=arr.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=Math.floor((s/233280)*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function bankingQuestionBank(){
 const base=[
  ['Banking Awareness','किस संस्था को भारत का केंद्रीय बैंक कहा जाता है?',['भारतीय रिज़र्व बैंक','भारतीय स्टेट बैंक','नाबार्ड','सेबी'],0,'RBI monetary policy, currency issue और banking regulation से जुड़ा केंद्रीय बैंक है।'],
  ['Banking Awareness','CASA का full form क्या है?',['Current Account Savings Account','Cash Account Salary Account','Credit And Saving Asset','Current Asset Saving Asset'],0,'CASA deposits bank के low-cost deposits होते हैं।'],
  ['Banking Awareness','KYC का मुख्य उद्देश्य क्या है?',['Customer identity verify करना','Loan interest घटाना','Cheque print करना','ATM cash भरना'],0,'KYC से customer identity और address verification होता है।'],
  ['Banking Awareness','NEFT में fund transfer किस आधार पर settle होता है?',['Batch settlement','Only cash settlement','Cheque clearing only','Card network only'],0,'NEFT batch-based electronic fund transfer system है।'],
  ['Banking Awareness','IMPS की खासियत क्या है?',['24x7 instant transfer','सिर्फ branch timing में transfer','केवल cheque से transfer','केवल FD के लिए'],0,'IMPS instant और generally 24x7 fund transfer facility देता है।'],
  ['Banking Awareness','UPI PIN किसके लिए use होता है?',['Payment authorize करने के लिए','Mobile recharge plan चुनने के लिए','Passbook print के लिए','Cheque book request के लिए'],0,'UPI PIN transaction authentication के लिए होता है।'],
  ['Banking Awareness','NPA कब कहा जाता है?',['जब loan repayment लंबे समय तक overdue रहे','जब account में salary आए','जब FD mature हो','जब debit card expire हो'],0,'NPA यानी non-performing asset, overdue repayment से जुड़ा classification है।'],
  ['Banking Awareness','Cheque पर MICR code किस काम आता है?',['Cheque processing में','ATM PIN बदलने में','Insurance claim में','UPI ID बनाने में'],0,'MICR cheque clearing में machine-readable identification के लिए होता है।'],
  ['Banking Awareness','Demand Draft किस तरह का instrument है?',['Prepaid negotiable instrument','Credit card bill','Savings passbook','ATM withdrawal slip'],0,'DD bank द्वारा prepaid payment instrument की तरह issue होता है।'],
  ['Banking Awareness','Nominee का role क्या है?',['Account holder की मृत्यु पर claim process आसान करना','Loan interest decide करना','ATM limit बढ़ाना','PAN card issue करना'],0,'Nomination legal claim process को सरल बनाता है।'],
  ['Quantitative Aptitude','₹10,000 पर 10% वार्षिक simple interest से 2 वर्ष में interest कितना होगा?',['₹2,000','₹1,000','₹1,500','₹2,500'],0,'Simple Interest = P × R × T / 100 = 10000×10×2/100।'],
  ['Quantitative Aptitude','अगर EMI ₹8,000 और monthly income ₹40,000 है, EMI-to-income ratio कितना है?',['20%','25%','30%','40%'],0,'8000/40000×100 = 20%।'],
  ['Quantitative Aptitude','₹50,000 का 12% कितना होगा?',['₹6,000','₹5,000','₹7,500','₹4,500'],0,'50000×12/100 = 6000।'],
  ['Quantitative Aptitude','एक amount 3 साल में simple interest पर double होता है, rate कितना है?',['33.33%','25%','30%','50%'],0,'Double होने पर interest principal के बराबर; R=100/3 = 33.33% approx।'],
  ['Quantitative Aptitude','₹2,000 का 15% discount कितना होगा?',['₹300','₹150','₹250','₹350'],0,'2000×15/100 = 300।'],
  ['Reasoning','श्रृंखला पूरी करें: 2, 4, 8, 16, ?',['32','24','30','36'],0,'हर पद पिछले पद का double है।'],
  ['Reasoning','यदि BANK को CBNL लिखा जाए, तो LOAN को कैसे लिखा जाएगा?',['MPBO','KNAO','MQBP','NQCP'],0,'हर letter को +1 shift किया गया है।'],
  ['Reasoning','Odd one out चुनें: Saving, Current, Fixed Deposit, Keyboard',['Keyboard','Saving','Current','Fixed Deposit'],0,'Keyboard banking account/deposit type नहीं है।'],
  ['Reasoning','A, B का भाई है और B, C की बहन है; A का C से संबंध क्या है?',['भाई','बहन','माता','पिता'],0,'B बहन है और A उसका भाई है, इसलिए A C का भाई होगा।'],
  ['Reasoning','अगर आज Monday है, 10 दिन बाद कौन सा दिन होगा?',['Thursday','Wednesday','Friday','Saturday'],0,'10 दिन बाद Monday +3 days = Thursday।'],
  ['English','Choose the correct spelling.',['Cheque','Chek','Chaeque','Cheqe'],0,'Cheque सही spelling है।'],
  ['English','Opposite of “Credit” in banking context is generally?',['Debit','Deposit','Interest','Balance'],0,'Debit account से amount घटने/निकासी side को दर्शाता है।'],
  ['English','Fill in the blank: Please ____ your KYC documents.',['submit','submitted','submitting','submits'],0,'Please के बाद base verb submit आता है।'],
  ['English','Synonym of “verify” is:',['confirm','deny','ignore','delay'],0,'Verify का अर्थ confirm/check करना है।'],
  ['English','Correct phrase चुनें.',['Savings account','Savinging account','Save account','Saved account'],0,'Banking product का standard phrase savings account है।']
 ];
 const generated=[];
 const names=['Amit','Ravi','Sita','Neha','Rahul','Pooja','Arjun','Kiran','Vikas','Meena'];
 const banks=['SBI','PNB','Canara Bank','Bank of Baroda','Union Bank','HDFC Bank','ICICI Bank','Axis Bank'];
 for(let i=0;i<2000;i++){
  const b=base[i%base.length],round=Math.floor(i/base.length)+1;
  let q={id:i+1,cat:b[0],q:b[1],opts:[...b[2]],ans:b[3],ex:b[4]};
  if(i>=base.length){
   if(b[0]==='Quantitative Aptitude'){
    const p=5000+(round%40)*1000,r=5+(round%16),t=1+(round%5),si=p*r*t/100;
    q={id:i+1,cat:b[0],q:`${names[round%names.length]} ने ${banks[round%banks.length]} में ₹${p.toLocaleString('en-IN')} जमा किए। ${r}% simple interest से ${t} वर्ष का interest कितना होगा?`,opts:[`₹${si.toLocaleString('en-IN')}`,`₹${(si+500).toLocaleString('en-IN')}`,`₹${Math.max(100,si-250).toLocaleString('en-IN')}`,`₹${(si+1000).toLocaleString('en-IN')}`],ans:0,ex:`SI = P×R×T/100 = ${p}×${r}×${t}/100 = ₹${si.toLocaleString('en-IN')}.`};
   }else if(b[0]==='Banking Awareness'){
    q={id:i+1,cat:b[0],q:`${banks[round%banks.length]} के customer को यह concept समझना है: ${b[1]}`,opts:[...b[2]],ans:b[3],ex:b[4]};
   }else if(b[0]==='Reasoning'){
    const start=round%9+1;
    q={id:i+1,cat:b[0],q:`श्रृंखला पूरी करें: ${start}, ${start*2}, ${start*4}, ${start*8}, ?`,opts:[`${start*16}`,`${start*12}`,`${start*10}`,`${start*20}`],ans:0,ex:'हर पद पिछले पद का double है।'};
   }else{
    q={id:i+1,cat:b[0],q:`Banking English practice ${round}: ${b[1]}`,opts:[...b[2]],ans:b[3],ex:b[4]};
   }
  }
  generated.push(q);
 }
 return generated;
}
function formatTime(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
window.startBankingMock=()=>{
 const root=document.querySelector('#mock-root');if(!root)return;
 const cat=document.querySelector('#mock-category').value,mins=Math.max(5,Math.min(240,+document.querySelector('#mock-minutes').value||120));
 let pool=bankingQuestionBank();if(cat!=='All')pool=pool.filter(x=>x.cat===cat);
 mockState.questions=seededShuffle(pool,Date.now()).slice(0,100);mockState.answers={};mockState.secondsLeft=mins*60;mockState.started=true;
 const qs=mockState.questions.map((x,idx)=>`<section class="mock-question" id="q${idx+1}"><h3>${idx+1}. <span class="tag">${x.cat}</span> ${x.q}</h3><div class="mock-options">${x.opts.map((op,oi)=>`<label><input type="radio" name="q${idx}" value="${oi}" onchange="saveMockAnswer(${idx},${oi})"> <span>${String.fromCharCode(65+oi)}. ${op}</span></label>`).join('')}</div></section>`).join('');
 root.innerHTML=`<div class="mock-status"><span class="mock-pill">Question: <b id="mock-answered">0</b>/100</span><span class="mock-pill mock-timer">Time: <b id="mock-time">${formatTime(mockState.secondsLeft)}</b></span><div class="mock-progress"><span id="mock-bar"></span></div></div>${qs}<div class="mock-actions"><button class="btn btn-primary" style="background:#0757d5;color:#fff" onclick="submitBankingMock()">Submit Test</button><button class="btn" onclick="startBankingMock()">New 100 Questions</button></div>`;
 clearInterval(mockState.timer);mockState.timer=setInterval(()=>{mockState.secondsLeft--;document.querySelector('#mock-time').textContent=formatTime(Math.max(0,mockState.secondsLeft));if(mockState.secondsLeft<=0)submitBankingMock()},1000);
 root.scrollIntoView({behavior:'smooth',block:'start'});
}
window.saveMockAnswer=(idx,oi)=>{mockState.answers[idx]=oi;const c=Object.keys(mockState.answers).length;document.querySelector('#mock-answered').textContent=c;document.querySelector('#mock-bar').style.width=`${c}%`}
window.submitBankingMock=()=>{
 if(!mockState.started)return;clearInterval(mockState.timer);mockState.started=false;
 let right=0,wrong=0,skip=0;const review=mockState.questions.map((x,idx)=>{const given=mockState.answers[idx];if(given==null)skip++;else if(given===x.ans)right++;else wrong++;const cls=given===x.ans?'correct':(given==null?'':'wrong');return `<details><summary>${idx+1}. ${x.q}</summary><p>आपका उत्तर: <span class="${cls}">${given==null?'Not attempted':x.opts[given]}</span></p><p>सही उत्तर: <span class="correct">${x.opts[x.ans]}</span></p><p>${x.ex}</p></details>`}).join('');
 const score=right,percent=Math.round(score),grade=percent>=85?'Excellent':percent>=70?'Good':percent>=50?'Average':'Needs Practice';
 document.querySelector('#mock-root').innerHTML=`<div class="score-card"><p>Banking Mock Test Result</p><strong>${score}/100</strong><h2>${grade}</h2><p>Correct: ${right} • Wrong: ${wrong} • Skipped: ${skip}</p></div><div class="mock-actions"><button class="btn btn-primary" style="background:#0757d5;color:#fff" onclick="startBankingMock()">Retake New Set</button><button class="btn" onclick="window.print()">Print Result</button></div><div class="answer-review"><h2>Answer Key with Explanation</h2>${review}</div>`;
 document.querySelector('#mock-root').scrollIntoView({behavior:'smooth'});
}
