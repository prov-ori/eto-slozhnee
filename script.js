(() => {
  const DATA = window.ETO_DATA || {ui:{},cards:[],glossary:[]};
  const saved = localStorage.getItem('eto-lang');
  const browser = (navigator.language || 'ru').slice(0,2);
  let lang = ['ru','en','et'].includes(saved) ? saved : (['ru','en','et'].includes(browser) ? browser : 'ru');
  const ui = () => DATA.ui[lang] || DATA.ui.ru;
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];

  function applyI18n(){
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el=>{ const v=ui()[el.dataset.i18n]; if(v!=null) el.textContent=v; });
    $$('[data-i18n-placeholder]').forEach(el=>{ const v=ui()[el.dataset.i18nPlaceholder]; if(v!=null) el.placeholder=v; });
    const select=$('#languageSelect'); if(select) select.value=lang;
    document.title = ui().brand || 'Это сложнее';
  }

  function evidence(level){ return ui()['level'+level] || ''; }
  const answered=new Set();
  let activeFilter='all';

  function cardHTML(card){
    const c=card[lang] || card.ru;
    return `<article class="fact-card" id="${card.id}" data-category="${card.category}">
      <div class="card-topline"><span class="tag">${c.tag}</span><span class="evidence-badge" data-level="${card.level}">${evidence(card.level)}</span></div>
      <p class="kicker">${c.kicker}</p><h3>${c.q}</h3>
      ${c.options.map((o,i)=>`<button class="choice" data-index="${i}">${o}</button>`).join('')}
      <div class="feedback" hidden><p><strong>${c.answer}</strong></p><p class="caveat">${c.caveat}</p>
      <details class="source-details"><summary>${ui().sourceQuality}</summary><p><b>${c.design}</b></p><a href="${card.source}" target="_blank" rel="noreferrer">${card.sourceName} ↗</a></details></div>
      <div class="card-footer"><span>${ui().checked}</span><button class="share-button" type="button">${ui().share}</button><button class="retry-button" type="button" hidden>${ui().retry}</button></div>
    </article>`;
  }

  function renderCards(){
    const grid=$('#factsGrid'); if(!grid) return;
    const cards = document.body.dataset.page==='home' ? DATA.cards.slice(0,8) : DATA.cards;
    grid.innerHTML=cards.map(cardHTML).join('');
    $('#cardCount') && ($('#cardCount').textContent=DATA.cards.length);
    bindCards(grid);
    filterCards(activeFilter);
    updateProgress();
    if(location.hash){ const t=$(location.hash); if(t) setTimeout(()=>t.scrollIntoView({block:'center'}),60); }
  }

  function bindCards(root){
    $$('.fact-card',root).forEach(cardEl=>{
      const card=DATA.cards.find(x=>x.id===cardEl.id); if(!card) return;
      const choices=$$('.choice',cardEl), feedback=$('.feedback',cardEl), retry=$('.retry-button',cardEl);
      choices.forEach(btn=>btn.addEventListener('click',()=>{
        const idx=Number(btn.dataset.index);
        choices.forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===card[lang].right);b.classList.toggle('wrong',i===idx&&i!==card[lang].right);});
        feedback.hidden=false; retry.hidden=false; answered.add(card.id); updateProgress();
      }));
      retry?.addEventListener('click',()=>resetCard(cardEl));
      $('.share-button',cardEl)?.addEventListener('click',()=>shareCard(card));
    });
  }

  function resetCard(el){ $$('.choice',el).forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong')}); const f=$('.feedback',el); if(f) f.hidden=true; const r=$('.retry-button',el); if(r) r.hidden=true; answered.delete(el.id); updateProgress(); }
  function updateProgress(){ const visible=$$('.fact-card').filter(x=>x.style.display!=='none'); const n=visible.filter(x=>answered.has(x.id)).length; const t=visible.length; const p=$('#progressText'); if(p)p.textContent=`${ui().answered} ${n} ${ui().of} ${t}`; const b=$('#progressBar');if(b)b.style.width=t?`${n/t*100}%`:'0%'; }
  function filterCards(cat){ activeFilter=cat; $$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===cat)); $$('.fact-card').forEach(c=>{c.style.display=cat==='all'||c.dataset.category.split(' ').includes(cat)?'flex':'none'}); updateProgress(); }
  $$('.filter').forEach(b=>b.addEventListener('click',()=>filterCards(b.dataset.filter)));
  $('#resetAll')?.addEventListener('click',()=>{$$('.fact-card').forEach(resetCard)});

  const toast=$('#toast'); let tt; function showToast(msg){if(!toast)return;toast.textContent=msg;toast.hidden=false;clearTimeout(tt);tt=setTimeout(()=>toast.hidden=true,1800)}
  async function shareCard(card){ const c=card[lang]||card.ru; const url=`${location.origin}${location.pathname}#${card.id}`; try{if(navigator.share)await navigator.share({title:ui().brand,text:c.q,url});else{await navigator.clipboard.writeText(url);showToast(ui().copied)}}catch(e){if(e.name!=='AbortError')showToast(ui().shareFail)}}

  function renderLibrary(){ const grid=$('#libraryGrid'); if(!grid)return; const q=($('#librarySearch')?.value||'').trim().toLowerCase(); const cat=$('#libraryCategory')?.value||'all'; const list=DATA.cards.filter(card=>{const c=card[lang]||card.ru; const text=[c.q,c.kicker,c.tag,c.answer].join(' ').toLowerCase(); return (!q||text.includes(q))&&(cat==='all'||card.category.split(' ').includes(cat));}); grid.innerHTML=list.length?list.map(card=>{const c=card[lang]||card.ru;return `<article class="library-item"><div class="card-topline"><span class="tag">${c.tag}</span><span class="evidence-badge" data-level="${card.level}">${evidence(card.level)}</span></div><h3>${c.q}</h3><p>${c.answer}</p><a href="index.html#${card.id}">${ui().openCard} →</a></article>`}).join(''):`<div class="empty-state">${ui().noResults}</div>`; }
  $('#librarySearch')?.addEventListener('input',renderLibrary); $('#libraryCategory')?.addEventListener('change',renderLibrary);

  function renderGlossary(){ const grid=$('#glossaryGrid');if(!grid)return;const q=($('#glossarySearch')?.value||'').trim().toLowerCase();const list=DATA.glossary.filter(x=>`${x.term[lang]||x.term.ru} ${x.def[lang]||x.def.ru}`.toLowerCase().includes(q));grid.innerHTML=list.map(x=>`<article class="glossary-card"><h2>${x.term[lang]||x.term.ru}</h2><p>${x.def[lang]||x.def.ru}</p></article>`).join(''); }
  $('#glossarySearch')?.addEventListener('input',renderGlossary);

  function initRiskLab(){const base=$('#baselineRisk'),rr=$('#relativeRisk');if(!base||!rr)return;const run=()=>{const b=+base.value,r=+rr.value,n=Math.min(100,b*r),d=n-b;$('#baselineRiskValue').textContent=b.toFixed(1)+'%';$('#relativeRiskValue').textContent=r.toFixed(1)+'×';$('#newRisk').textContent=n.toFixed(1)+'%';$('#absoluteChange').textContent=(d>=0?'+':'')+d.toFixed(1)+' pp';$('#per1000').textContent=Math.round(n*10)+' / 1000';$('#riskBar').style.width=n+'%'};base.addEventListener('input',run);rr.addEventListener('input',run);run();}
  function initOddsLab(){const base=$('#oddsBase'),or=$('#oddsRatio');if(!base||!or)return;const run=()=>{const p=+base.value/100,o=+or.value,newOdds=(p/(1-p))*o,n=newOdds/(1+newOdds);$('#oddsBaseValue').textContent=(p*100).toFixed(1)+'%';$('#oddsRatioValue').textContent=(+or.value).toFixed(1);$('#oddsProbability').textContent=(n*100).toFixed(1)+'%';$('#oddsBar').style.width=(n*100)+'%'};base.addEventListener('input',run);or.addEventListener('input',run);run();}

  const biasScenarios=[
    {q:{ru:'Исследование связи соцсетей и депрессии набирает участников только через рекламу в Instagram.',en:'A study of social media and depression recruits participants only through Instagram ads.',et:'Sotsiaalmeedia ja depressiooni uuring värbab osalejaid ainult Instagrami reklaamide kaudu.'},a:'selection',e:{ru:'Выборка может систематически отличаться от целевой популяции.',en:'The recruited sample may differ systematically from the target population.',et:'Värvatud valim võib sihtpopulatsioonist süstemaatiliselt erineda.'}},
    {q:{ru:'Людей спрашивают через 15 лет, сколько алкоголя они пили каждую неделю в университете.',en:'People are asked 15 years later how much alcohol they drank each week at university.',et:'Inimestelt küsitakse 15 aastat hiljem, kui palju alkoholi nad ülikooli ajal igal nädalal jõid.'},a:'recall',e:{ru:'Долгая ретроспектива повышает риск ошибки памяти.',en:'Long retrospective recall increases memory error.',et:'Pikk tagasivaateline meenutamine suurendab mäluvigade riski.'}},
    {q:{ru:'У курящих чаще бывает болезнь, но анализ не учитывает возраст, хотя курящие участники заметно старше.',en:'Smokers have more disease, but the analysis ignores age even though smokers are much older.',et:'Suitsetajatel on haigust rohkem, kuid analüüs ei arvesta vanust, kuigi suitsetajad on palju vanemad.'},a:'confounding',e:{ru:'Возраст связан и с группой, и с исходом и может искажать связь.',en:'Age is related to both exposure group and outcome and may distort the association.',et:'Vanus on seotud nii kokkupuute kui tulemusega ja võib seost moonutada.'}}
  ];
  let biasIndex=0,biasScore=0;
  function renderBias(){const s=biasScenarios[biasIndex%biasScenarios.length];const box=$('#biasScenario');if(!box)return;box.textContent=s.q[lang]||s.q.ru;$$('.game-option[data-bias]').forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong')});$('#biasFeedback').textContent='';$('#biasScore').textContent=`${ui().score}: ${biasScore}`;}
  $$('.game-option[data-bias]').forEach(b=>b.addEventListener('click',()=>{const s=biasScenarios[biasIndex%biasScenarios.length],ok=b.dataset.bias===s.a;if(ok)biasScore++;$$('.game-option[data-bias]').forEach(x=>{x.disabled=true;x.classList.toggle('correct',x.dataset.bias===s.a);x.classList.toggle('wrong',x===b&&!ok)});$('#biasFeedback').textContent=`${ok?ui().correct:ui().incorrect}: ${s.e[lang]||s.e.ru}`;$('#biasScore').textContent=`${ui().score}: ${biasScore}`;}));
  $('#biasNext')?.addEventListener('click',()=>{biasIndex++;renderBias()});

  $('#headlineCheck')?.addEventListener('click',()=>{const needed=['baseline','population','effect','design'];let hit=0;needed.forEach(id=>{const el=$(`#h-${id}`);if(el?.checked)hit++});const out=$('#headlineFeedback');if(out)out.textContent=`${hit}/4 — ${hit===4?ui().correct:ui().incorrect}`;});

  const theme=$('#themeToggle'); const storedTheme=localStorage.getItem('eto-theme'); if(storedTheme==='dark'||(!storedTheme&&matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark'); theme?.setAttribute('aria-pressed',String(document.body.classList.contains('dark'))); theme?.addEventListener('click',()=>{document.body.classList.toggle('dark');const d=document.body.classList.contains('dark');localStorage.setItem('eto-theme',d?'dark':'light');theme.setAttribute('aria-pressed',String(d));});
  const menu=$('#menuToggle'),mobile=$('#mobileMenu');menu?.addEventListener('click',()=>{const open=mobile.hasAttribute('hidden');mobile.toggleAttribute('hidden');menu.setAttribute('aria-expanded',String(open))});
  $('#languageSelect')?.addEventListener('change',e=>{lang=e.target.value;localStorage.setItem('eto-lang',lang);applyI18n();renderCards();renderLibrary();renderGlossary();renderBias();});

  applyI18n(); renderCards(); renderLibrary(); renderGlossary(); initRiskLab(); initOddsLab(); renderBias(); const y=$('#year');if(y)y.textContent=new Date().getFullYear();
})();
