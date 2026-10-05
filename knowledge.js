(() => {
  'use strict';
  const K=window.ETO_KNOWLEDGE;
  if(!K) return;

  const SUP=['ru','en','et'];
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const storage={
    get(k){try{return localStorage.getItem(k)}catch{return null}},
    set(k,v){try{localStorage.setItem(k,v)}catch{}}
  };
  const browser=(navigator.language||'ru').slice(0,2).toLowerCase();
  let lang=SUP.includes(storage.get('eto-lang'))?storage.get('eto-lang'):(SUP.includes(browser)?browser:'ru');
  const ui=()=>K.ui[lang]||K.ui.ru;
  const tr=k=>ui()[k]||k;
  const tx=o=>o?.[lang]||o?.ru||o?.en||'';
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
    $('#languageSelect')?.addEventListener('change',e=>{
      lang=e.target.value;
      storage.set('eto-lang',lang);
      applyI18n();
      setTimeout(()=>window.dispatchEvent(new Event('eto:language')),0);
    });
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
    return `<article class="concept-card" id="${c.id}" data-domain="${c.domain}"><div class="concept-top"><span class="domain-pill">${d?.icon||''} ${tx(d?.label)}</span><span class="level-pill">${tr(c.level)}</span></div><h2>${tx(c.title)}</h2><p>${tx(c.text)}</p><div class="concept-links">${(c.links||[]).map(id=>{const x=K.concepts.find(c=>c.id===id);return x?`<a href="concepts.html#${x.id}">${tx(x.title)}</a>`:''}).join('')}</div></article>`;
  }

  function renderAcademy(){
    const mount=$('#academyMount');if(!mount)return;
    const localLabs={ru:['Лаборатории','Память, внимание, framing и MCDA — через действие.'],en:['Labs','Memory, attention, framing and MCDA through interaction.'],et:['Laborid','Mälu, tähelepanu, raamistamine ja MCDA läbi tegevuse.']}[lang];
    const cards=[
      {key:'courses',icon:'▶',href:'learn.html',title:tr('courses'),text:tr('academyText')},
      {key:'concepts',icon:'◎',href:'concepts.html',title:tr('concepts'),text:tr('conceptsText')},
      {key:'cases',icon:'⌕',href:'cases.html',title:tr('cases'),text:tr('casesText')},
      {key:'labs',icon:'✦',href:'labs.html',title:localLabs[0],text:localLabs[1]},
      {key:'atlas',icon:'◉',href:'atlas.html',title:tr('atlas'),text:tr('atlasText')},
      {key:'books',icon:'▤',href:'books.html',title:tr('books'),text:tr('booksText')},
      {key:'connections',icon:'⋈',href:'connections.html',title:tr('connections'),text:tr('connectionsText')}
    ];
    mount.innerHTML=`<div class="academy-hub-grid">${cards.map(c=>`<a class="academy-hub-card" href="${c.href}"><span class="academy-hub-icon">${c.icon}</span><h2>${c.title}</h2><p>${c.text}</p></a>`).join('')}</div><div class="knowledge-note">${tr('basisNote')}</div><section class="domain-overview"><h2>${tr('conceptsTitle')}</h2><div class="domain-grid">${K.domains.map(d=>{const n=K.concepts.filter(c=>c.domain===d.id).length;return `<a href="concepts.html?domain=${d.id}" class="domain-card"><span>${d.icon}</span><strong>${tx(d.label)}</strong><small>${n}</small></a>`}).join('')}</div></section>`;
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
      if(location.hash){const id=decodeURIComponent(location.hash.slice(1));document.getElementById(id)?.scrollIntoView({block:'center'})}
    };
    if(filters){filters.innerHTML=domainChips(active);bindFilter(draw)}
    query?.addEventListener('input',()=>draw(active));
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
        $$('.case-option',mount).forEach((x,i)=>{x.disabled=true;x.classList.toggle('correct',i===c.right);x.classList.toggle('wrong',i===chosen&&i!==c.right)});
        $('.case-feedback',mount).innerHTML=`<strong>${ok?tr('correct'):tr('incorrect')}</strong><p><b>${tr('why')}:</b> ${tx(c.explain)}</p><div class="concept-links"><b>${tr('related')}:</b> ${(c.links||[]).map(id=>{const x=K.concepts.find(c=>c.id===id);return x?`<a href="concepts.html#${id}">${tx(x.title)}</a>`:''}).join('')}</div>`;
        $('#caseNext').hidden=false;
      }));
      $('#caseNext')?.addEventListener('click',()=>{idx=(idx+1)%K.cases.length;answered=false;draw();$('.reasoning-card')?.focus()});
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
      mount.innerHTML=K.books.filter(b=>(dom==='all'||b.domains.includes(dom))&&(!needle||`${b.title} ${b.author}`.toLocaleLowerCase(lang).includes(needle))).map(b=>`<article class="book-card"><div class="book-status ${b.status}">${tr(b.status==='ordered'?'statusOrdered':'statusOwned')}</div><h2>${b.title}</h2>${b.author?`<p class="book-author">${b.author}</p>`:''}<div class="book-domains">${b.domains.map(id=>{const d=domain(id);return `<a href="concepts.html?domain=${id}" class="domain-pill">${d?.icon||''} ${tx(d?.label)}</a>`}).join('')}</div></article>`).join('')||'<div class="empty-state">0</div>';
    };
    const filters=$('#bookFilters');if(filters){filters.innerHTML=domainChips(active);bindFilter(draw)}
    q?.addEventListener('input',()=>draw(active));draw(active);
  }

  function renderConnections(){
    const mount=$('#connectionMount');if(!mount)return;
    mount.innerHTML=K.connections.map(c=>`<article class="connection-card"><div class="eyebrow">${tx(c.title)}</div><h2>${tx(c.question)}</h2><div class="connection-layers">${c.layers.map(l=>`<section><strong>${tx(l.label)}</strong><p>${tx(l.text)}</p></section>`).join('')}</div></article>`).join('');
  }
  function renderPage(){
    const p=document.body.dataset.page;
    if(p==='academy')renderAcademy();
    else if(p==='concepts')renderConcepts();
    else if(p==='cases')renderCases();
    else if(p==='atlas')renderAtlas();
    else if(p==='books')renderBooks();
    else if(p==='connections')renderConnections();
  }

  bindShell();
  applyI18n();
})();