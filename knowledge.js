(() => {
  'use strict';
  const K=window.ETO_KNOWLEDGE;
  if(!K) return;

  const I=window.ETO_I18N;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const storage={
    get(k){try{return localStorage.getItem(k)}catch{return null}},
    set(k,v){try{localStorage.setItem(k,v)}catch{}}
  };
  let lang=I.get();
  const tr=k=>I.translate(K.ui,k,k);
  const tx=I.pick;
  const domain=id=>K.domains.find(d=>d.id===id);

  function applyTheme(){
    const stored=storage.get('eto-theme');
    const dark=stored==='dark'||(!stored&&matchMedia('(prefers-color-scheme:dark)').matches);
    document.body.classList.toggle('dark',dark);
    $('#themeToggle')?.setAttribute('aria-pressed',String(dark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#171817':'#f4f0e8');
  }
  function toggleTheme(){
    const next=!document.body.classList.contains('dark');
    storage.set('eto-theme',next?'dark':'light');
    applyTheme();
  }
  function bindShell(){
    applyTheme();
    $('#themeToggle')?.addEventListener('click',toggleTheme);
    window.addEventListener('eto:language',()=>{lang=I.get();applyI18n()});
    const menu=$('#menuToggle'),mobile=$('#mobileMenu');
    const close=()=>{if(!mobile)return;mobile.hidden=true;menu?.setAttribute('aria-expanded','false')};
    menu?.addEventListener('click',()=>{const open=mobile.hidden;mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open))});
    mobile?.addEventListener('click',e=>{if(e.target.closest('a'))close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.addEventListener('click',e=>{if(mobile&&!mobile.hidden&&!mobile.contains(e.target)&&!menu?.contains(e.target))close()});
    const y=$('#year');if(y)y.textContent=new Date().getFullYear();
  }
  function applyI18n(){
    document.documentElement.lang=lang;
    const shell={ru:{menu:'Меню',theme:'Тёмная тема',language:'Язык',skip:'Перейти к содержанию'},en:{menu:'Menu',theme:'Dark theme',language:'Language',skip:'Skip to content'},et:{menu:'Menüü',theme:'Tume teema',language:'Keel',skip:'Liigu sisu juurde'}}[lang];
    if($('#menuToggle'))$('#menuToggle').textContent=shell.menu;
    $('#themeToggle')?.setAttribute('aria-label',shell.theme);
    $('#languageSelect')?.setAttribute('aria-label',shell.language);
    if($('.skip-link'))$('.skip-link').textContent=shell.skip;
    $$('[data-k18n]').forEach(el=>{const v=tr(el.dataset.k18n);if(v)el.textContent=v});
    $$('[data-k18n-placeholder]').forEach(el=>el.setAttribute('placeholder',tr(el.dataset.k18nPlaceholder)));
    const s=$('#languageSelect');if(s)s.value=lang;
    renderPage();
  }

  function domainChips(active='all'){
    return `<div class="knowledge-filters"><button class="knowledge-chip${active==='all'?' active':''}" data-domain="all" type="button" aria-pressed="${active==='all'}">${tr('all')}</button>${K.domains.map(d=>`<button class="knowledge-chip${active===d.id?' active':''}" data-domain="${d.id}" type="button" aria-pressed="${active===d.id}"><span aria-hidden="true">${d.icon}</span>${tx(d.label)}</button>`).join('')}</div>`;
  }
  function bindFilter(render){
    $$('.knowledge-chip').forEach(btn=>btn.addEventListener('click',()=>{
      $$('.knowledge-chip').forEach(b=>{const on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
      render(btn.dataset.domain);
    }));
  }
  function conceptCard(c){
    const d=domain(c.domain);
    return `<article class="concept-card" id="${c.id}" data-domain="${c.domain}"><div class="concept-top"><span class="domain-pill">${d?.icon||''} ${tx(d?.label)}</span><span class="level-pill">${tr(c.level)}</span></div><h2><a href="#${c.id}">${tx(c.title)}</a></h2><p>${tx(c.text)}</p><div data-concept-bookmark></div>${window.ETO_MATERIALS.render("concept",c,lang)}<div class="concept-links">${(c.links||[]).map(id=>{const x=K.concepts.find(c=>c.id===id);return x?`<a href="concepts.html#${x.id}">${tx(x.title)}</a>`:''}).join('')}</div></article>`;
  }

  function renderConcepts(){
    const mount=$('#conceptMount');if(!mount)return;
    const params=new URLSearchParams(location.search);
    let active=params.get('domain')||'all';
    const query=$('#conceptSearch');
    const filters=$('#conceptFilters');
    const draw=(dom=active)=>{
      active=dom;
      const q=(query?.value||'').trim().toLocaleLowerCase(lang);
      const list=K.concepts.filter(c=>(dom==='all'||c.domain===dom)&&(!q||[tx(c.title),tx(c.text),tx(domain(c.domain)?.label)].join(' ').toLocaleLowerCase(lang).includes(q)));
      mount.innerHTML=list.map(conceptCard).join('')||'<div class="empty-state">0</div>';
      for (const card of mount.querySelectorAll('[data-concept-bookmark]')) {
        const id=card.closest('article').id;
        window.ETO_EXPERIENCE.materialControls(card,'concepts.html#'+id,K.concepts.find(c=>c.id===id).title,false);
      }
      if(location.hash){let id='';try{id=decodeURIComponent(location.hash.slice(1))}catch{}const card=document.getElementById(id);card?.scrollIntoView({block:'center'});const item=K.concepts.find(c=>c.id===id);if(item)window.ETO_EXPERIENCE.materialControls(card?.querySelector('[data-concept-bookmark]'),'concepts.html#'+id,item.title)}
    };
    if(filters){filters.innerHTML=domainChips(active);bindFilter(draw)}
    if(query)query.oninput=()=>draw(active);
    draw(active);
  }

  function renderCases(){
    const mount=$('#caseMount');if(!mount)return;
    let idx=0,score=0,answered=false;
    const draw=()=>{
      const c=K.cases[idx%K.cases.length],d=domain(c.domain),opts=c.options?.[lang]||c.options?.ru||[];
      mount.innerHTML=`<article class="reasoning-card" tabindex="-1"><div class="case-meta"><span class="domain-pill">${d?.icon||''} ${tx(d?.label)}</span><span>${idx+1}/${K.cases.length}</span></div><h2>${tx(c.prompt)}</h2><p class="case-question">${tr('caseQuestion')}</p><div class="case-options">${opts.map((o,i)=>`<button type="button" class="case-option" data-i="${i}">${o}</button>`).join('')}</div><div class="case-feedback" aria-live="polite"></div><div class="case-footer"><span>${score}/${idx+(answered?1:0)}</span><button class="btn primary" id="caseNext" type="button" hidden>${tr('next')}</button></div></article>`;
      $$('.case-option',mount).forEach(b=>b.addEventListener('click',()=>{
        if(answered)return;answered=true;
        const chosen=Number(b.dataset.i),ok=chosen===c.right;if(ok)score++;
        const skills=c.links?.flatMap(id=>({confounding:['bias'], 'selection-bias':['bias'], 'base-rate':['bayesian'], 'association-causation':['causality'], 'clinical-interview':['clinical'], 'differential-reasoning':['clinical']})[id]||[]);
        window.ETO_LEARNING.assess('case:'+c.id,skills,ok);
        $$('.case-option',mount).forEach((x,i)=>{x.disabled=true;x.classList.toggle('correct',i===c.right);x.classList.toggle('wrong',i===chosen&&i!==c.right)});
        $('.case-feedback',mount).innerHTML=`<strong>${ok?tr('correct'):tr('incorrect')}</strong><p><b>${tr('why')}:</b> ${tx(c.explain)}</p><div class="concept-links"><b>${tr('related')}:</b> ${(c.links||[]).map(id=>{const x=K.concepts.find(c=>c.id===id);return x?`<a href="concepts.html#${id}">${tx(x.title)}</a>`:''}).join('')}</div>`;
        $('.case-footer span',mount).textContent=`${score}/${idx+1}`;$('#caseNext').hidden=false;
      }));
      $('#caseNext')?.addEventListener('click',()=>{idx=(idx+1)%K.cases.length;if(idx===0)score=0;answered=false;draw();$('.reasoning-card')?.focus()});
    };
    draw();
  }

  function renderAtlas(){
    const mount=$('#atlasMount');if(!mount)return;
    let active='all';
    const draw=dom=>{active=dom;mount.innerHTML=K.atlas.filter(a=>dom==='all'||a.domain===dom).map(a=>{const d=domain(a.domain);return `<article class="atlas-card"><div class="domain-pill">${d?.icon||''} ${tx(d?.label)}</div><h2>${tx(a.title)}</h2><p>${tx(a.summary)}</p><div class="concept-links">${a.links.map(id=>{const x=K.concepts.find(c=>c.id===id);return x?`<a href="concepts.html#${id}">${tx(x.title)}</a>`:''}).join('')}</div></article>`}).join('')};
    const filters=$('#atlasFilters');if(filters){filters.innerHTML=domainChips(active);bindFilter(draw)}
    draw(active);
  }

  function renderBooks(){
    const mount=$('#bookMount');if(!mount)return;
    const q=$('#bookSearch');let active='all';
    const draw=dom=>{
      active=dom;const needle=(q?.value||'').trim().toLocaleLowerCase(lang);
      mount.innerHTML=K.books.filter(b=>(dom==='all'||b.domains.includes(dom))&&(!needle||`${b.title} ${b.author}`.toLocaleLowerCase(lang).includes(needle))).map(b=>`<article class="book-card" id="${b.id}"><div class="book-status ${b.status}">${tr(b.status==='ordered'?'statusOrdered':'statusOwned')}</div><h2><a href="#${b.id}">${b.title}</a></h2><p class="book-author">${b.author||tr('authorUnknown')}</p><div class="book-format">${tx(b.formatLabel)}</div><p class="book-reading-lens">${tx(b.readingLens)}</p><div data-book-bookmark></div>${window.ETO_MATERIALS.render("book",b,lang)}<div class="book-domains">${b.domains.map(id=>{const d=domain(id);return `<a href="concepts.html?domain=${id}" class="domain-pill">${d?.icon||''} ${tx(d?.label)}</a>`}).join('')}</div><div class="book-route-links">${(window.ETO_WORKSHOP?.modules||[]).filter(m=>m.books.includes(b.id)).map(m=>`<a href="workshop.html?topic=${m.id}">${tx(m.title)} →</a>`).join('')}</div></article>`).join('')||`<div class="empty-state">${tr('noBooks')}</div>`;
      for (const card of mount.querySelectorAll('[data-book-bookmark]')) {
        const id=card.closest('article').id;
        window.ETO_EXPERIENCE.materialControls(card,'books.html#'+id,K.books.find(b=>b.id===id).title,false);
      }
    };
    const filters=$('#bookFilters');if(filters){filters.innerHTML=domainChips(active);bindFilter(draw)}
    if(q)q.oninput=()=>draw(active);draw(active);let bookId='';try{bookId=decodeURIComponent(location.hash.slice(1))}catch{}if(/^book-\d+$/.test(bookId)){const card=document.getElementById(bookId);card?.scrollIntoView({block:'center'});const book=K.books.find(b=>b.id===bookId);if(book)window.ETO_EXPERIENCE.materialControls(card?.querySelector('[data-book-bookmark]'),'books.html#'+bookId,book.title)}
  }

  function renderConnections(){
    const mount=$('#connectionMount');if(!mount)return;
    mount.innerHTML=K.connections.map(c=>`<article class="connection-card"><div class="eyebrow">${tx(c.title)}</div><h2>${tx(c.question)}</h2><div class="connection-layers">${c.layers.map(l=>`<section><strong>${tx(l.label)}</strong><p>${tx(l.text)}</p></section>`).join('')}</div></article>`).join('');
  }
  function renderPage(){
    const p=document.body.dataset.page;
    if(p==='concepts')renderConcepts();
    else if(p==='cases')renderCases();
    else if(p==='atlas')renderAtlas();
    else if(p==='books')renderBooks();
    else if(p==='connections')renderConnections();
  }

  window.addEventListener('hashchange',renderPage);
  bindShell();
  applyI18n();
})();
