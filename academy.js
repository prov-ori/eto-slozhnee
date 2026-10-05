(() => {
  'use strict';
  const A=window.ETO_ACADEMY||{ui:{},courses:[],nodes:[],edges:[],daily:[],simulator:[]};
  const D=window.ETO_DATA||{cards:[]};
  const SUP=['ru','et','en'];
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}},remove(k){try{localStorage.removeItem(k)}catch{}}};
  const PROGRESS_KEY='eto-learning-progress-v1';
  const saved=storage.get('eto-lang');
  const browser=(navigator.language||'ru').slice(0,2).toLowerCase();
  let lang=SUP.includes(saved)?saved:(SUP.includes(browser)?browser:'ru');
  const ui=()=>A.ui[lang]||A.ui.ru||{};
  const tr=(k,f='')=>ui()[k]??f;
  const tx=obj=>obj?.[lang]||obj?.ru||obj?.en||'';
  const readProgress=()=>{try{const p=JSON.parse(storage.get(PROGRESS_KEY)||'{}');p.cards ||= {};p.courses ||= {};p.daily ||= {};p.meta ||= {};return p}catch{return {cards:{},courses:{},daily:{},meta:{}}}};
  const saveProgress=p=>storage.set(PROGRESS_KEY,JSON.stringify(p));

  function applyTheme(){
    const stored=storage.get('eto-theme');
    if(stored==='dark'||(!stored&&matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark');
    const b=$('#themeToggle');if(b){b.setAttribute('aria-pressed',String(document.body.classList.contains('dark')));b.setAttribute('aria-label',tr('theme','Theme'));}
  }
  function toggleTheme(){document.body.classList.toggle('dark');storage.set('eto-theme',document.body.classList.contains('dark')?'dark':'light');applyTheme()}
  function applyI18n(){
    document.documentElement.lang=lang;
    $$('[data-a18n]').forEach(el=>{const v=tr(el.dataset.a18n);if(v!=='')el.textContent=v});
    const select=$('#languageSelect');if(select){select.value=lang;select.setAttribute('aria-label',tr('language','Language'))}
    document.title=`${tr(document.body.dataset.titleKey||'learn')} — ${tr('brand')}`;
    renderCurrent();
  }
  function bindShell(){
    $('#themeToggle')?.addEventListener('click',toggleTheme);
    $('#languageSelect')?.addEventListener('change',e=>{lang=e.target.value;storage.set('eto-lang',lang);applyI18n()});
    const menu=$('#menuToggle'),mobile=$('#mobileMenu');
    const close=()=>{if(!mobile)return;mobile.hidden=true;menu?.setAttribute('aria-expanded','false')};
    menu?.addEventListener('click',()=>{const open=mobile.hidden;mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open))});
    mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.addEventListener('click',e=>{if(!mobile?.hidden&&!mobile.contains(e.target)&&!menu?.contains(e.target))close()});
    const y=$('#year');if(y)y.textContent=new Date().getFullYear();
  }

  function courseStats(course,p){const done=new Set(p.courses?.[course.id]?.done||[]);return {done:done.size,total:course.lessons.length,pct:course.lessons.length?done.size/course.lessons.length*100:0}}
  function renderLearn(){
    const grid=$('#courseGrid');if(!grid)return;
    const p=readProgress();
    grid.innerHTML=A.courses.map(c=>{const s=courseStats(c,p);const action=s.done===0?tr('start'):s.done===s.total?tr('completed'):tr('continue');return `<article class="course-card" data-color="${c.color}"><div class="course-icon">${c.icon}</div><h2>${tx(c.title)}</h2><p>${tx(c.desc)}</p><div class="course-meta"><span>${s.done}/${s.total} ${s.total===1?tr('lesson'):tr('lessons')}</span><span>${Math.round(s.pct)}%</span></div><div class="mini-progress"><span style="width:${s.pct}%"></span></div><a class="btn primary" href="learn.html?course=${encodeURIComponent(c.id)}">${action}</a></article>`}).join('');
    const params=new URLSearchParams(location.search),id=params.get('course');if(id)renderCourse(id);else $('#courseView')?.setAttribute('hidden','');
  }
  function renderCourse(id){
    const course=A.courses.find(c=>c.id===id),view=$('#courseView');if(!course||!view)return;
    view.hidden=false;$('#courseGrid')?.setAttribute('hidden','');
    const p=readProgress();const cp=p.courses[id]||{done:[],current:0};const done=new Set(cp.done||[]);let current=Math.min(Math.max(Number(cp.current)||0,0),course.lessons.length-1);
    const renderLesson=()=>{
      const lesson=course.lessons[current],isDone=done.has(lesson.id);
      view.innerHTML=`<aside class="course-sidebar"><a class="text-button" href="learn.html">← ${tr('learn')}</a><h2>${tx(course.title)}</h2><div class="lesson-list">${course.lessons.map((l,i)=>`<button class="lesson-tab${i===current?' active':''}${done.has(l.id)?' done':''}" data-i="${i}" type="button">${i+1}. ${tx(l.title)}</button>`).join('')}</div><button class="text-button danger-btn" id="resetCourse" type="button">${tr('resetCourse')}</button></aside><article class="lesson-panel"><div class="eyebrow">${tr('lesson')} ${current+1} / ${course.lessons.length}</div><h2>${tx(lesson.title)}</h2><p>${tx(lesson.body)}</p><div class="lesson-actions"><button class="btn primary" id="completeLesson" type="button">${isDone?tr('done'):tr('markDone')}</button>${current>0?`<button class="btn ghost" id="prevLesson" type="button">${tr('back')}</button>`:''}${current<course.lessons.length-1?`<button class="btn ghost" id="nextLesson" type="button">${tr('next')}</button>`:''}</div></article>`;
      $$('.lesson-tab',view).forEach(b=>b.addEventListener('click',()=>{current=Number(b.dataset.i);persist();renderLesson()}));
      $('#completeLesson')?.addEventListener('click',()=>{if(done.has(lesson.id))done.delete(lesson.id);else done.add(lesson.id);persist();renderLesson()});
      $('#prevLesson')?.addEventListener('click',()=>{current--;persist();renderLesson()});
      $('#nextLesson')?.addEventListener('click',()=>{current++;persist();renderLesson()});
      $('#resetCourse')?.addEventListener('click',()=>{const pr=readProgress();delete pr.courses[id];saveProgress(pr);done.clear();current=0;renderLesson()});
    };
    const persist=()=>{const pr=readProgress();pr.courses[id]={done:[...done],current,updatedAt:Date.now()};saveProgress(pr)};
    renderLesson();
  }

  function renderMap(){
    const panel=$('#knowledgeMap');if(!panel)return;
    panel.innerHTML='';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('map-svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
    A.edges.forEach(([a,b])=>{const na=A.nodes.find(n=>n.id===a),nb=A.nodes.find(n=>n.id===b);if(!na||!nb)return;const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',na.x);line.setAttribute('y1',na.y);line.setAttribute('x2',nb.x);line.setAttribute('y2',nb.y);line.dataset.a=a;line.dataset.b=b;svg.appendChild(line)});panel.appendChild(svg);
    A.nodes.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='knowledge-node';b.dataset.group=n.group;b.dataset.id=n.id;b.style.left=`${n.x}%`;b.style.top=`${n.y}%`;b.innerHTML=`<strong>${tx(n.label)}</strong><small>${tx(n.desc)}</small>`;b.addEventListener('click',()=>showNode(n));panel.appendChild(b)});
    function showNode(n){const d=$('#mapDetail');if(!d)return;d.innerHTML=`<h2>${tx(n.label)}</h2><p>${tx(n.desc)}</p><a class="btn primary" href="${n.href}">${tr('open')}</a>`;d.scrollIntoView({behavior:'smooth',block:'nearest'})}
    $$('.map-filter').forEach(btn=>btn.onclick=()=>{const g=btn.dataset.group;$$('.map-filter').forEach(x=>x.classList.toggle('active',x===btn));$$('.knowledge-node').forEach(n=>n.classList.toggle('dim',g!=='all'&&n.dataset.group!==g));$$('.map-svg line').forEach(line=>{const a=A.nodes.find(n=>n.id===line.dataset.a),b=A.nodes.find(n=>n.id===line.dataset.b);line.style.opacity=g==='all'||a?.group===g||b?.group===g?'1':'.08'})});
  }

  function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function dayNumber(){const k=todayKey();return Math.floor(new Date(`${k}T12:00:00`).getTime()/86400000)}
  function dailyIndex(){return Math.abs(dayNumber())%A.daily.length}
  function computeStreak(records){let streak=0;let d=dayNumber();while(true){const dt=new Date(d*86400000);const k=`${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;if(records[k]){streak++;d--}else break}return streak}
  function renderDaily(){
    const mount=$('#dailyMount');if(!mount)return;const q=A.daily[dailyIndex()],p=readProgress(),key=todayKey(),state=p.daily[key],streak=computeStreak(p.daily||{});
    mount.innerHTML=`<article class="daily-card"><div class="daily-top"><span class="tag">${key}</span><span class="streak-pill">${tr('streak')}: ${streak} ${tr('days')}</span></div><h2>${tx(q.q)}</h2><div class="daily-options">${q.opts[lang].map((o,i)=>`<button class="daily-option${state&&i===q.right?' correct':''}${state&&i===state.selected&&i!==q.right?' wrong':''}" data-i="${i}" type="button" ${state?'disabled':''}>${o}</button>`).join('')}</div>${state?`<div class="daily-explanation"><strong>${state.correct?tr('correct'):tr('incorrect')}</strong><p>${tr('explanation')}: ${tx(q.exp)}</p><p>${tr('comeBack')}</p></div>`:''}</article>`;
    if(!state)$$('.daily-option',mount).forEach(btn=>btn.addEventListener('click',()=>{const selected=Number(btn.dataset.i),correct=selected===q.right,pr=readProgress();pr.daily[key]={selected,correct,answeredAt:Date.now()};saveProgress(pr);renderDaily()}));
  }

  function renderSimulator(){
    const mount=$('#simMount');if(!mount)return;let step=0;const picks={};
    const render=()=>{
      if(step>=A.simulator.length){renderReport();return}const s=A.simulator[step];
      mount.innerHTML=`<div class="sim-layout"><aside class="sim-steps">${A.simulator.map((x,i)=>`<div class="sim-step-indicator${i===step?' active':''}${i<step?' done':''}">${tr('step')} ${i+1}</div>`).join('')}</aside><article class="sim-card"><div class="eyebrow">${tr('step')} ${step+1} / ${A.simulator.length}</div><h2>${tx(s.title)}</h2><p class="sim-context">${tx(s.context)}</p><div class="sim-options">${s.options.map(o=>`<button class="sim-option${picks[s.id]===o.id?' selected':''}" data-id="${o.id}" type="button"><strong>${tx(o.label)}</strong><span>${picks[s.id]===o.id?tx(o.note):''}</span></button>`).join('')}</div><div class="sim-actions">${step>0?`<button class="btn ghost" id="simBack" type="button">${tr('back')}</button>`:'<span></span>'}<button class="btn primary" id="simNext" type="button" ${!picks[s.id]?'disabled':''}>${step===A.simulator.length-1?tr('finish'):tr('next')}</button></div></article></div>`;
      $$('.sim-option',mount).forEach(b=>b.addEventListener('click',()=>{picks[s.id]=b.dataset.id;render()}));$('#simBack')?.addEventListener('click',()=>{step--;render()});$('#simNext')?.addEventListener('click',()=>{if(!picks[s.id])return;step++;render()});
    };
    const renderReport=()=>{let score=0,max=0;const rows=[];A.simulator.forEach(s=>{const o=s.options.find(x=>x.id===picks[s.id]);const top=Math.max(...s.options.map(x=>x.score));max+=top;score+=o?.score||0;rows.push({good:(o?.score||0)>=top-1,title:tx(s.title),note:tx(o?.note)})});const pct=Math.max(0,Math.round(score/max*100));mount.innerHTML=`<article class="sim-card"><div class="eyebrow">${tr('score')}</div><div class="report-score">${pct}%</div><div class="sim-report">${rows.map(r=>`<div class="report-row ${r.good?'good':'warn'}"><strong>${r.good?tr('strong'):tr('risk')}: ${r.title}</strong><p>${r.note}</p></div>`).join('')}</div><div class="lesson-actions"><button class="btn primary" id="simRestart" type="button">${tr('restart')}</button></div></article>`;$('#simRestart')?.addEventListener('click',()=>{step=0;Object.keys(picks).forEach(k=>delete picks[k]);render()})};
    render();
  }

  function renderProgress(){
    const mount=$('#progressMount');if(!mount)return;const p=readProgress();const cardEntries=Object.entries(p.cards||{}),answered=cardEntries.reduce((a,[,v])=>a+(v.attempts||0),0),correct=cardEntries.reduce((a,[,v])=>a+(v.correct||0),0),lessons=A.courses.reduce((a,c)=>a+new Set(p.courses?.[c.id]?.done||[]).size,0),today=Boolean(p.daily?.[todayKey()]),accuracy=answered?Math.round(correct/answered*100):0,now=Date.now();const due=cardEntries.filter(([,v])=>(v.nextReview||Infinity)<=now).sort((a,b)=>(a[1].nextReview||0)-(b[1].nextReview||0));
    mount.innerHTML=`<div class="progress-grid"><article class="progress-card"><span>${tr('cardsAnswered')}</span><strong>${answered}</strong></article><article class="progress-card"><span>${tr('accuracy')}</span><strong>${accuracy}%</strong></article><article class="progress-card"><span>${tr('coursesDone')}</span><strong>${lessons}</strong></article><article class="progress-card"><span>${tr('dailyDone')}</span><strong>${today?'✓':'—'}</strong></article></div><section class="review-section"><div class="section-heading"><div><div class="eyebrow">${tr('due')}</div><h2>${due.length}</h2></div></div><div class="review-list">${due.length?due.map(([id,v])=>{const card=D.cards.find(c=>c.id===id),c=card?.[lang]||card?.ru;return `<article class="review-item"><div><h3>${c?.q||id}</h3><p>${v.lastCorrect?'✓':'↻'} · ${v.correct||0}/${v.attempts||0}</p></div><a class="btn primary" href="fact.html?id=${encodeURIComponent(id)}">${tr('review')}</a></article>`}).join(''):`<div class="empty-state">${tr('noReview')}</div>`}</div><p class="privacy-note">${tr('privacy')}</p><button class="btn ghost danger-btn" id="clearProgress" type="button">${tr('clearProgress')}</button></section>`;
    $('#clearProgress')?.addEventListener('click',()=>{if(confirm(tr('clearConfirm'))){storage.remove(PROGRESS_KEY);renderProgress()}});
  }

  function renderCurrent(){
    const page=document.body.dataset.page;
    if(page==='learn')renderLearn();
    if(page==='map')renderMap();
    if(page==='daily')renderDaily();
    if(page==='simulator')renderSimulator();
    if(page==='progress')renderProgress();
  }
  bindShell();applyTheme();applyI18n();
})();
