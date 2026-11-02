'use strict';
// ПЕРЕВІРЕНИЙ ЗРІЗ USA, 02.11.2026. Значення округлені як на доступних WDI/WB таблицях.
// Додаткові точки 2023 використані лише для графіків; без інтерполяції.
const SNAPSHOT_USA = {"grain":{"2023":8330,"2024":8414},"lifeF":{"2023":81.1,"2024":81.4},"lifeM":{"2023":75.8,"2024":76.5},"infantF":{"2023":5.0,"2024":5.0},"infantM":{"2023":5.9,"2024":5.9},"exports":{"2023":11.05,"2024":10.97},"imports":{"2023":13.88,"2024":14.04},"rnd":{"2023":3.45},"top10":{"2024":30.7},"low10":{"2024":1.7},"debt":{"2022":112.71753248772,"2023":114.73985759209,"2024":115.788609964778}};

// Методика: порогові інтервали буквально відтворені з наданих скриншотів іспиту.
// Дані: World Bank World Development Indicators, без підміни пропусків.
const SERIES = {
  grain: 'AG.YLD.CREL.KG', lifeF: 'SP.DYN.LE00.FE.IN', lifeM: 'SP.DYN.LE00.MA.IN',
  infantF: 'SP.DYN.IMRT.FE.IN', infantM: 'SP.DYN.IMRT.MA.IN',
  exports: 'NE.EXP.GNFS.ZS', imports: 'NE.IMP.GNFS.ZS',
  rnd: 'GB.XPD.RSDV.GD.ZS', top10: 'SI.DST.10TH.10', low10: 'SI.DST.FRST.10',
  debt: 'GC.DOD.TOTL.GD.ZS'
};
const COUNTRIES = {UKR:'Україна',POL:'Польща',DEU:'Німеччина',FRA:'Франція',USA:'США',CZE:'Чехія',LTU:'Литва',EST:'Естонія',MDA:'Молдова',ROU:'Румунія',HUN:'Угорщина',CAN:'Канада',JPN:'Японія',KOR:'Південна Корея',GBR:'Велика Британія',SVK:'Словаччина',ITA:'Італія',ESP:'Іспанія'};
const LEVELS = ['Абсолютна небезпека','Критичний','Небезпечний','Незадовільний','Задовільний','Оптимальний'];
// intervals: [lower bound, upper bound, is lower inclusive, is upper inclusive, security level]
const BANDS = {
  grain: [[0,15,true,false,0],[15,20,true,false,1],[20,25,true,false,2],[25,35,true,false,3],[35,45,true,false,4],[45,55,true,false,5],[55,75,true,false,4],[75,95,true,false,3],[95,100,true,false,2],[100,150,true,false,1],[150,Infinity,true,false,0]],
  life: [[0,66,true,false,0],[66,68,true,false,1],[68,70,true,false,2],[70,75,true,false,3],[75,78,true,false,4],[78,Infinity,true,false,5]],
  infant: [[0,4,true,true,5],[4,5,false,true,4],[5,7,false,true,3],[7,9,false,true,2],[9,11,false,true,1],[11,Infinity,false,false,0]],
  trade: [[0,.85,true,false,0],[.85,.9,true,false,1],[.9,.95,true,false,2],[.95,.975,true,false,3],[.975,1,true,false,4],[1,1.2,true,true,5],[1.2,1.25,false,true,4],[1.25,1.3,false,true,3],[1.3,1.5,false,true,2],[1.5,1.7,false,true,1],[1.7,Infinity,false,false,0]],
  rnd: [[0,.5,true,false,0],[.5,1,true,false,1],[1,1.5,true,false,2],[1.5,2,true,false,3],[2,3,true,false,4],[3,Infinity,true,false,5]],
  income: [[1,4.5,true,true,5],[4.5,5,false,true,4],[5,5.5,false,true,3],[5.5,6,false,true,2],[6,7,false,true,1],[7,Infinity,false,false,0]],
  debt: [[0,20,true,true,5],[20,30,false,true,4],[30,40,false,true,3],[40,50,false,true,2],[50,60,false,true,1],[60,Infinity,false,false,0]]
};
const GROUPS = [
 {key:'grain', title:'Урожайність зернових', units:'ц/га', sub:'АГРАРНА СТІЙКІСТЬ', raw:['grain']},
 {key:'life', title:'Очікувана тривалість життя', units:'років', sub:'ДЕМОГРАФІЯ', raw:['lifeF','lifeM']},
 {key:'infant', title:'Смертність немовлят', units:'на 1 000 народжень', sub:'ДЕМОГРАФІЯ', raw:['infantF','infantM']},
 {key:'trade', title:'Покриття імпорту експортом', units:'разів', sub:'ЗОВНІШНЯ ТОРГІВЛЯ', raw:['exports','imports']},
 {key:'rnd', title:'Витрати на дослідження та розробки', units:'% ВВП', sub:'ІННОВАЦІЇ', raw:['rnd']},
 {key:'income', title:'Співвідношення доходів 10% / 10%', units:'разів', sub:'СОЦІАЛЬНА РІВНІСТЬ', raw:['top10','low10']},
 {key:'debt', title:'Борг центрального уряду', units:'% ВВП', sub:'ДЕРЖАВНІ ФІНАНСИ', raw:['debt']}
];
const METRICS = [
 {key:'grain',name:'Урожайність зернових',group:'grain',series:'grain',divide:100},
 {key:'lifeF',name:'Очікувана тривалість життя — жінки',group:'life',series:'lifeF'},
 {key:'lifeM',name:'Очікувана тривалість життя — чоловіки',group:'life',series:'lifeM'},
 {key:'infantF',name:'Смертність немовлят — дівчатка',group:'infant',series:'infantF'},
 {key:'infantM',name:'Смертність немовлят — хлопчики',group:'infant',series:'infantM'},
 {key:'trade',name:'Коефіцієнт покриття імпорту експортом',group:'trade',fraction:['exports','imports']},
 {key:'rnd',name:'Витрати на R&D',group:'rnd',series:'rnd'},
 {key:'income',name:'Доходи найбагатших 10% / найбідніших 10%',group:'income',fraction:['top10','low10']},
 {key:'debt',name:'Борг центрального уряду',group:'debt',series:'debt'}
];
let currentRows=[];
let latestRequestId=0;
function cleanISO(value){return /^[A-Z]{3}$/.test((value||'').toUpperCase())?value.toUpperCase():null;}
function num(v,d=2){return v===null||!Number.isFinite(v)?'—':new Intl.NumberFormat('uk-UA',{maximumFractionDigits:d,minimumFractionDigits:0}).format(v);}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function classify(group,value){if(!Number.isFinite(value))return null;const band=BANDS[group].find(([l,u,li,ui])=>(li?value>=l:value>l)&&(ui?value<=u:value<u));return band?band[4]:null;}
function datePairs(rawSeries){return Object.entries(rawSeries||{}).filter(([y,v])=>Number.isFinite(v)).map(([year,value])=>({year:Number(year),value})).sort((a,b)=>a.year-b.year);}
function calculatedSeries(metric,source){
 if(metric.fraction){const [a,b]=metric.fraction;return datePairs(source[a]).filter(row=>Number.isFinite(source[b]?.[row.year])&&source[b][row.year]>0).map(row=>({year:row.year,value:row.value/source[b][row.year]}));}
 return datePairs(source[metric.series]).map(row=>({year:row.year,value:row.value/(metric.divide||1)}));
}
function jsonp(url,timeout=11500){
 return new Promise((resolve,reject)=>{
  const cb='wbdata_'+Date.now()+'_'+Math.floor(Math.random()*1e8);const tag=document.createElement('script');let finished=false;
  const cleanup=()=>{if(finished)return;finished=true;clearTimeout(timer);delete window[cb];tag.remove();};
  const timer=setTimeout(()=>{cleanup();reject(new Error('Час очікування API вичерпано'))},timeout);
  window[cb]=data=>{cleanup();resolve(data)};
  tag.onerror=()=>{cleanup();reject(new Error('API не відповідає'))};
  tag.src=url+'&format=jsonP&prefix='+cb;
  document.head.appendChild(tag);
 });
}
async function worldBankRequest(country){
 const codes=Object.values(SERIES).join(';');
 const base=`https://api.worldbank.org/v2/country/${country}/indicator/${codes}?source=2&date=1990:2026&per_page=2000`;
 try{
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),8000);
  try{const res=await fetch(base+'&format=json',{signal:ctrl.signal,cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);return await res.json();}
  finally{clearTimeout(timer);}
 }catch(err){return jsonp(base);}
}
function normalizeApiResponse(response){
 if(!Array.isArray(response)||!Array.isArray(response[1]))throw new Error('API не повернув статистичних записів для цієї країни.');
 const reverse=Object.fromEntries(Object.entries(SERIES).map(([k,v])=>[v,k]));
 const source=Object.fromEntries(Object.keys(SERIES).map(k=>[k,{}]));
 for(const rec of response[1]){
  const key=reverse[rec.indicator?.id];const year=Number(rec.date);const val=Number(rec.value);
  if(key&&rec.value!==null&&rec.value!==''&&Number.isFinite(val)&&Number.isInteger(year))source[key][year]=val;
 }
 return source;
}
function metricResults(source){return METRICS.map(metric=>{const series=calculatedSeries(metric,source);const last=series.length?series[series.length-1]:null;return {...metric,series,year:last?.year??null,value:last?.value??null,level:last?classify(metric.group,last.value):null,unit:GROUPS.find(g=>g.key===metric.group).units};});}
function statusBadge(level){return `<span class="status-chip ${level===null?'level-na':'level-'+level}">${level===null?'Немає даних':LEVELS[level]}</span>`;}
function statusCounts(rows){const ready=rows.filter(r=>r.level!==null);return {ready,safe:ready.filter(r=>r.level>=4),risk:ready.filter(r=>r.level<=2),watch:ready.filter(r=>r.level===3)};}
function groupMetricCards(rows){return rows.map(r=>{
 const subtitle=GROUPS.find(g=>g.key===r.group).sub;
 return `<article class="indicator-card"><div class="card-label">${escapeHtml(r.name)}</div><div class="card-value">${num(r.value)}<small>${escapeHtml(r.unit)}</small></div><div class="card-meta">${subtitle} • ${r.year??'рік не визначений'}</div>${statusBadge(r.level)}</article>`;
 }).join('');}
function plotSVG(seriesMap){
 const all=seriesMap.flatMap(s=>s.points);if(!all.length)return '<p class="chart-subtitle">Немає доступних даних для побудови графіка.</p>';
 const w=570,h=230,l=51,r=15,t=20,b=36;let xmin=Math.min(...all.map(p=>p.year)),xmax=Math.max(...all.map(p=>p.year));if(xmin===xmax){xmin-=1;xmax+=1;}
 let ymin=Math.min(...all.map(p=>p.value)),ymax=Math.max(...all.map(p=>p.value));const range=ymax-ymin;const flat=Math.abs(range)<Math.max(1e-9,Math.abs(ymax)*1e-9);const delta=flat?Math.max(Math.abs(ymax)*.10,.2):range;if(flat){ymin-=delta/2;ymax+=delta/2;}else{ymin-=delta*.13;ymax+=delta*.13;}
 const x=y=>l+(y-xmin)/(xmax-xmin)*(w-l-r),y=v=>t+(ymax-v)/(ymax-ymin)*(h-t-b);
 const fmt=n=>Number(n.toFixed(1));let svg=`<svg viewBox="0 0 ${w} ${h}" class="chart-svg" role="img" aria-label="Динаміка показника за роками">`;
 for(let i=0;i<=4;i++){const yy=t+(h-t-b)*i/4;const val=ymax-(ymax-ymin)*i/4;svg+=`<line x1="${l}" y1="${fmt(yy)}" x2="${w-r}" y2="${fmt(yy)}" stroke="#e7eff0"/><text x="${l-10}" y="${fmt(yy+4)}" text-anchor="end" font-size="11" fill="#8ba0a6">${num(val,1)}</text>`;}
 const yearTicks=[xmin,Math.round((xmin+xmax)/2),xmax];for(const yr of [...new Set(yearTicks)])svg+=`<text x="${fmt(x(yr))}" y="${h-10}" font-size="11" text-anchor="middle" fill="#8ba0a6">${yr}</text>`;
 for(const s of seriesMap){let prev=null;let polylines=[];let curr=[];for(const p of s.points){if(prev!==null&&p.year-prev>1){if(curr.length)polylines.push(curr);curr=[];}curr.push(p);prev=p.year;}if(curr.length)polylines.push(curr);
  for(const points of polylines){if(points.length>=2)svg+=`<polyline points="${points.map(p=>`${fmt(x(p.year))},${fmt(y(p.value))}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;}
  for(const p of s.points){svg+=`<circle cx="${fmt(x(p.year))}" cy="${fmt(y(p.value))}" r="${p.year===s.points.at(-1).year?4:2.1}" fill="${s.color}"><title>${escapeHtml(s.name)}: ${p.year} — ${num(p.value)}</title></circle>`;}
 }
 svg+='</svg>';return svg;
}
function chartCard(group,rows){const items=rows.filter(r=>r.group===group.key);const mapped=items.map((m,i)=>({name:(m.name.includes('жінки')||m.name.includes('дівчатка'))?'Жінки / дівчатка':(m.name.includes('чоловіки')||m.name.includes('хлопчики'))?'Чоловіки / хлопчики':'Значення',points:m.series.slice(-15),color:i===0?'#159e91':'#6775c8'}));
 return `<article class="chart-card"><h3>${escapeHtml(group.title)}</h3><p class="chart-subtitle">${escapeHtml(group.units)} • останні до 15 наявних спостережень</p>${plotSVG(mapped)}<div class="chart-legend">${mapped.map(s=>`<span><i class="legend-dot" style="background:${s.color}"></i>${escapeHtml(s.name)}</span>`).join('')}</div></article>`;
}
function intervalText([lower,upper,lowerInc,upperInc]){const a=lowerInc?'[':'(';const b=upperInc?']':')';return `${a}${num(lower,3)}; ${upper===Infinity?'∞':num(upper,3)}${b}`;}
function makeThresholds(){document.getElementById('thresholds').innerHTML=GROUPS.map(g=>`<details class="threshold-group"><summary>${escapeHtml(g.title)} — порогові інтервали (${escapeHtml(g.units)})</summary><div class="threshold-grid">${BANDS[g.key].map(b=>`<div class="threshold-item"><span>${intervalText(b)}</span><strong>${LEVELS[b[4]]}</strong></div>`).join('')}</div></details>`).join('');}
function makeSources(country){document.getElementById('sources-list').innerHTML=Object.values(SERIES).map(code=>`<a href="https://data.worldbank.org/indicator/${code}?locations=${country}" target="_blank" rel="noopener noreferrer">${code} ↗</a>`).join('')+`<a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392" target="_blank" rel="noopener noreferrer">Документація World Bank API ↗</a>`;}
function makeLists(counts){const render=(arr)=>arr.length?`<ul>${arr.map(x=>`<li><strong>${escapeHtml(x.name)}</strong> — ${num(x.value)} ${escapeHtml(x.unit)}, ${x.year} р. (${LEVELS[x.level].toLowerCase()})</li>`).join('')}</ul>`:'<p>Немає показників у цій категорії серед доступних значень.</p>';
 document.getElementById('risk-list').innerHTML=render([...counts.risk,...counts.watch]);document.getElementById('positive-list').innerHTML=render(counts.safe);
}
function conclude(rows,country){const {ready,safe,risk,watch}=statusCounts(rows);if(!ready.length)return `Для ${country} немає достатніх доступних даних у вибраних рядах World Bank API. Робити підсумковий висновок неможливо.`;
 const notready=rows.length-ready.length;const risks=[...risk,...watch].map(r=>r.name.toLowerCase());let p=`Для країни ${country} проаналізовано ${ready.length} із ${rows.length} індикаторів. Оптимальний або задовільний рівень зафіксовано для ${safe.length}, незадовільний — для ${watch.length}, небезпечний, критичний або рівень абсолютної небезпеки — для ${risk.length}. `;
 if(risks.length)p+=`Серед проблемних напрямів: ${risks.slice(0,4).join('; ')}${risks.length>4?' та інші':''}. `;
 if(notready)p+=`Для ${notready} індикаторів дані відсутні; їх не можна вважати ні безпечними, ні небезпечними. `;
 p+=`Порівняння здійснено за останніми доступними роками, які можуть відрізнятися; отже, цей огляд не є оцінкою єдиного календарного року. За відсутності зважувань у завданні інтегральний бал не розраховується.`;return p;
}
function notify(message,status=''){const n=document.getElementById('data-notice');n.className='notice'+(status?' '+status:'');n.textContent=message;}
async function loadCountry(country){const thisRun=++latestRequestId;const countryName=COUNTRIES[country]||`Країна ${country}`;document.getElementById('dashboard').setAttribute('aria-busy','true');document.getElementById('country-title').textContent=countryName;notify(`Завантаження реальних даних Світового банку для країни: ${countryName}…`);document.getElementById('indicator-grid').innerHTML='<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
 try{const source=country==='USA'?SNAPSHOT_USA:normalizeApiResponse(await worldBankRequest(country));if(thisRun!==latestRequestId)return;const rows=metricResults(source);currentRows=rows;const counts=statusCounts(rows);const ready=counts.ready.length;
 document.getElementById('stats-evaluated').textContent=`${ready}/9`;document.getElementById('stats-safe').textContent=counts.safe.length;document.getElementById('stats-risk').textContent=counts.risk.length;
 document.getElementById('overview-description').textContent=`${countryName}: оцінка 7 груп економічної безпеки за останніми доступними статистичними спостереженнями.`;
 document.getElementById('indicator-grid').innerHTML=groupMetricCards(rows);
 document.getElementById('results-tbody').innerHTML=rows.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${r.year??'—'}</td><td>${num(r.value)}</td><td>${escapeHtml(r.unit)}</td><td>${statusBadge(r.level)}</td></tr>`).join('');
 document.getElementById('charts-grid').innerHTML=GROUPS.map(g=>chartCard(g,rows)).join('');makeLists(counts);document.getElementById('conclusion-text').textContent=conclude(rows,countryName);makeSources(country);
 document.getElementById('loaded-at').textContent=country==='USA'?'Перевірений зріз статистики США станом на 02.11.2026. Джерело: World Bank WDI; додаткова перевірка окремих рядів за FRED, Gender Data Portal та відкритими WDI-дзеркалами. Показники різних років не підмінюються.':`Оновлено через World Bank API: ${new Date().toLocaleString('uk-UA')}. Порожні значення не заповнюються штучно.`;
 notify(ready?`Дані США перевірено. Оцінено ${ready} із 9 показників; всі значення прив’язані до років спостережень.`:'Запит виконано, але показники у вибраних рядах відсутні.','ok');
 }catch(err){if(thisRun!==latestRequestId)return;currentRows=[];document.getElementById('indicator-grid').innerHTML='<div class="indicator-card"><h3>Дані не завантажилися</h3><p>Перевірте доступ до інтернету, ISO-код країни та роботу API. Значення не підміняються вигаданими числами.</p></div>';document.getElementById('results-tbody').innerHTML='<tr><td colspan="5">Не вдалося завантажити офіційні дані.</td></tr>';document.getElementById('charts-grid').innerHTML='';notify(`Помилка завантаження: ${err.message}. Спробуйте оновити сторінку.`, 'error');
 }finally{if(thisRun===latestRequestId)document.getElementById('dashboard').setAttribute('aria-busy','false');}
}
function exportCSV(){if(!currentRows.length){notify('Спочатку завантажте дані, щоб експортувати таблицю.','error');return;}const rows=[['Показник','Рік','Значення','Одиниця','Рівень безпеки'],...currentRows.map(r=>[r.name,r.year??'',r.value===null?'':String(r.value),r.unit,r.level===null?'Немає даних':LEVELS[r.level]])];const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Економічна_безпека_показники.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function init(){makeThresholds();document.querySelectorAll('.print-btn').forEach(b=>b.addEventListener('click',()=>window.print()));document.getElementById('download-csv').addEventListener('click',exportCSV);
 const select=document.getElementById('country-select');const custom=document.getElementById('custom-code');const wrapper=document.getElementById('custom-wrapper');const query=new URLSearchParams(location.search);const requested=cleanISO(query.get('country'))||'USA';select.value=COUNTRIES[requested]?requested:'CUSTOM';if(select.value==='CUSTOM'){wrapper.hidden=false;custom.value=requested;}
 select.addEventListener('change',()=>{wrapper.hidden=select.value!=='CUSTOM';custom.required=select.value==='CUSTOM';});
 document.getElementById('country-form').addEventListener('submit',event=>{event.preventDefault();const country=select.value==='CUSTOM'?cleanISO(custom.value):select.value;if(!country){custom.reportValidity();notify('Введіть коректний ISO 3166-1 alpha-3 код країни (три латинські літери).','error');return;}history.replaceState(null,'',`?country=${country}`);loadCountry(country);});loadCountry(requested);
}
document.addEventListener('DOMContentLoaded',init);
