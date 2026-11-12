(() => {
  'use strict';
  const A=window.ETO_ACADEMY||{ui:{},courses:[],nodes:[],edges:[],daily:[],simulator:[]};
  const L=window.ETO_LEARNING;
  const I=window.ETO_I18N;
  const E=window.ETO_EXPERIENCE_DATA;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const storage=L.storage;
  let lang=I.get();
  const tr=(key,fallback="")=>I.translate(A.ui,key,fallback);
  const tx=I.pick;
  const readProgress=()=>L?L.read():({cards:{},courses:{},daily:{},meta:{}});
  const saveProgress=p=>L?L.write(p):storage.set('eto-learning-progress-v2',JSON.stringify(p));
  const extra={
    ru:{skip:'Перейти к содержанию',primary:'Основная навигация',mobile:'Мобильное меню',bottom:'Нижняя навигация',checkpointPrompt:'Выбери формулировку, которая точнее всего передаёт смысл урока.',passed:'Проверка пройдена',tryAgain:'Попробуй ещё раз',mastered:'Освоено',notMastered:'Нужно доработать',validity:'Внутренняя валидность',sampling:'Выборка',measurement:'Измерение',analysis:'Анализ',high:'сильная',medium:'средняя',low:'слабая',mapList:'Темы карты знаний'},
    en:{skip:'Skip to content',primary:'Primary navigation',mobile:'Mobile menu',bottom:'Bottom navigation',checkpointPrompt:'Choose the statement that best captures the lesson.',passed:'Checkpoint passed',tryAgain:'Try again',mastered:'Mastered',notMastered:'Needs work',validity:'Internal validity',sampling:'Sampling',measurement:'Measurement',analysis:'Analysis',high:'strong',medium:'moderate',low:'weak',mapList:'Knowledge map topics'},
    et:{skip:'Liigu sisu juurde',primary:'Põhinavigatsioon',mobile:'Mobiilimenüü',bottom:'Alumine navigatsioon',checkpointPrompt:'Vali väide, mis annab õppetunni mõtte kõige täpsemalt edasi.',passed:'Kontroll läbitud',tryAgain:'Proovi uuesti',mastered:'Omandatud',notMastered:'Vajab kordamist',validity:'Sisemine valiidsus',sampling:'Valim',measurement:'Mõõtmine',analysis:'Analüüs',high:'tugev',medium:'keskmine',low:'nõrk',mapList:'Teadmiste kaardi teemad'}
  };
  const ex=k=>I.translate(extra,k,k);

  function ensureA11y(){
    if(!$('.skip-link')){const a=document.createElement('a');a.className='skip-link';a.href='#main';a.textContent=ex('skip');document.body.prepend(a)}
    $('main')?.setAttribute('id','main');
    $('.desktop-nav')?.setAttribute('aria-label',ex('primary'));
    $('#mobileMenu')?.setAttribute('aria-label',ex('mobile'));
    $('.bottom-nav')?.setAttribute('aria-label',ex('bottom'));
  }
  function applyTheme(){const stored=storage.get('eto-theme');const dark=stored==='dark'||(!stored&&matchMedia('(prefers-color-scheme: dark)').matches);document.body.classList.toggle('dark',dark);const b=$('#themeToggle');if(b){b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',tr('theme','Theme'))}const meta=$('meta[name="theme-color"]');if(meta)meta.content=dark?'#171715':'#f4f0e8'}
  function toggleTheme(){const dark=!document.body.classList.contains('dark');document.body.classList.toggle('dark',dark);storage.set('eto-theme',dark?'dark':'light');applyTheme()}
  function applyI18n(){document.documentElement.lang=lang;$$('[data-a18n]').forEach(el=>{const v=tr(el.dataset.a18n);if(v!=='')el.textContent=v});const select=$('#languageSelect');if(select){select.value=lang;select.setAttribute('aria-label',tr('language','Language'))}document.title=`${tr(document.body.dataset.titleKey||'learn')} — ${tr('brand')}`;ensureA11y();applyTheme();renderCurrent()}
  function bindShell(){
    $('#themeToggle')?.addEventListener('click',toggleTheme);
    window.addEventListener('eto:language',()=>{lang=I.get();applyI18n()});
    const menu=$('#menuToggle'),mobile=$('#mobileMenu');const close=()=>{if(!mobile)return;mobile.hidden=true;menu?.setAttribute('aria-expanded','false')};
    menu?.addEventListener('click',()=>{const open=mobile.hidden;mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open));if(open)mobile.querySelector('a')?.focus()});mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();menu?.focus()}});document.addEventListener('click',e=>{if(!mobile?.hidden&&!mobile.contains(e.target)&&!menu?.contains(e.target))close()});
    const y=$('#year');if(y)y.textContent=new Date().getFullYear();
  }
  function courseStats(course,p){const done=new Set((p.courses?.[course.id]?.done||[]).filter(id=>course.lessons.some(l=>l.id===id)));return{done:done.size,total:course.lessons.length,pct:course.lessons.length?done.size/course.lessons.length*100:0}}
  function renderLearn(){
    const grid=$('#courseGrid');if(!grid)return;const p=readProgress();const params=new URLSearchParams(location.search),id=params.get('course');
    const hasCourse=A.courses.some(c=>c.id===id);
    $('[data-diagnostic]').hidden=hasCourse;
    $('.academy-hero').hidden=hasCourse;
    if(hasCourse){grid.hidden=true;renderCourse(id,params.get('lesson'));return}
    grid.hidden=false;$('#courseView')?.setAttribute('hidden','');grid.innerHTML=A.courses.map(c=>{const s=courseStats(c,p),action=s.done===0?tr('start'):s.done===s.total?tr('completed'):tr('continue');return `<article class="course-card" data-color="${c.color}"><div class="course-icon" aria-hidden="true">${c.icon}</div><h2>${tx(c.title)}</h2><p>${tx(c.desc)}</p><div class="course-meta"><span>${s.done}/${s.total} ${s.total===1?tr('lesson'):tr('lessons')}</span><span>${Math.round(s.pct)}%</span></div><div class="mini-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(s.pct)}"><span style="width:${s.pct}%"></span></div><a class="btn primary" href="learn.html?course=${encodeURIComponent(c.id)}">${action}</a></article>`}).join('')
  }
  function checkpointChoices(course,index){const correct=course.lessons[index];const others=course.lessons.filter((_,i)=>i!==index).slice(0,2);const choices=[correct,...others];for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}return choices}
  function renderCourse(id,lessonId){
    const course=A.courses.find(c=>c.id===id),view=$('#courseView');if(!course||!view)return;view.hidden=false;
    const p=readProgress(),cp=p.courses?.[id]||{done:[],current:0};const done=new Set(cp.done||[]);const linked=course.lessons.findIndex(l=>l.id===lessonId);let current=linked>=0?linked:Math.min(Math.max(Math.floor(Number(cp.current)||0),0),course.lessons.length-1);
    const persist=()=>{const pr=readProgress();pr.meta.lastCourse=id;pr.courses[id]={...(pr.courses[id]||{}),done:[...done],current,updatedAt:Date.now()};saveProgress(pr)};
    const move=()=>{history.pushState(null,'',E.lesson(id,course.lessons[current].id));persist();renderLesson();$('.lesson-panel')?.focus()};
    const renderLesson=()=>{
      const lesson=course.lessons[current],isDone=done.has(lesson.id),choices=checkpointChoices(course,current);
      view.innerHTML=`<aside class="course-sidebar"><a class="text-button" href="learn.html">← ${tr('learn')}</a><h2>${tx(course.title)}</h2><div class="lesson-list">${course.lessons.map((l,i)=>`<button class="lesson-tab${i===current?' active':''}${done.has(l.id)?' done':''}" data-i="${i}" type="button" aria-current="${i===current?'step':'false'}">${i+1}. ${tx(l.title)}</button>`).join('')}</div><button class="text-button danger-btn" id="resetCourse" type="button">${tr('resetCourse')}</button></aside><article class="lesson-panel" tabindex="-1"><div class="eyebrow">${tr('lesson')} ${current+1} / ${course.lessons.length}</div><h2>${tx(lesson.title)}</h2><div data-lesson-bookmark></div><p>${tx(lesson.body)}</p>${window.ETO_MATERIALS.render("lesson",{...lesson,course:id},lang)}<section class="lesson-checkpoint" aria-labelledby="checkpointTitle"><div class="eyebrow">${tr('checkpoint')}</div><h3 id="checkpointTitle">${ex('checkpointPrompt')}</h3><div class="checkpoint-options">${choices.map(c=>`<button class="choice checkpoint-choice" type="button" data-id="${c.id}">${tx(c.body)}</button>`).join('')}</div><p class="checkpoint-feedback" aria-live="polite">${isDone?`✓ ${ex('passed')}`:''}</p></section><div class="lesson-actions">${current>0?`<button class="btn ghost" id="prevLesson" type="button">${tr('back')}</button>`:''}${current<course.lessons.length-1?`<button class="btn ghost" id="nextLesson" type="button">${tr('next')}</button>`:''}</div>${E.workshopByCourse[id]?`<p><a class="btn ghost" href="${E.workshopByCourse[id]}">${I.pick(E.labels.applyLesson)}</a></p>`:""}</article>`;
      window.ETO_EXPERIENCE.materialControls($('[data-lesson-bookmark]'),E.lesson(id,lesson.id),lesson.title);
      $$('.lesson-tab',view).forEach(b=>b.addEventListener('click',()=>{current=Number(b.dataset.i);move()}));
      $$('.checkpoint-choice',view).forEach(b=>b.addEventListener('click',()=>{const ok=b.dataset.id===lesson.id;$$('.checkpoint-choice',view).forEach(x=>{x.disabled=true;x.classList.toggle('correct',x.dataset.id===lesson.id);x.classList.toggle('wrong',x===b&&!ok)});const fb=$('.checkpoint-feedback',view);if(fb)fb.textContent=ok?`✓ ${ex('passed')}`:`↻ ${ex('tryAgain')}`;if(ok){done.add(lesson.id);L?.markLesson(id,lesson.id,true);persist()}else setTimeout(()=>{$$('.checkpoint-choice',view).forEach(x=>{x.disabled=false;x.classList.remove('correct','wrong')})},900)}));
      $('#prevLesson')?.addEventListener('click',()=>{current--;move()});$('#nextLesson')?.addEventListener('click',()=>{current++;move()});$('#resetCourse')?.addEventListener('click',()=>{const pr=readProgress();delete pr.courses[id];saveProgress(pr);done.clear();current=0;history.replaceState(null,'',E.lesson(id,course.lessons[0].id));renderLesson()})
    };if(p.meta.lastCourse!==id || cp.current!==current || !p.courses[id])persist();renderLesson()
  }
  function renderMap(){
    const panel=$('#knowledgeMap');if(!panel)return;panel.innerHTML='';const mobile=matchMedia('(max-width:700px)').matches;panel.classList.toggle('map-list-mode',mobile);
    if(!mobile){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('map-svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');A.edges.forEach(([a,b])=>{const na=A.nodes.find(n=>n.id===a),nb=A.nodes.find(n=>n.id===b);if(!na||!nb)return;const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',na.x);line.setAttribute('y1',na.y);line.setAttribute('x2',nb.x);line.setAttribute('y2',nb.y);line.dataset.a=a;line.dataset.b=b;svg.appendChild(line)});panel.appendChild(svg)}
    A.nodes.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='knowledge-node';b.dataset.group=n.group;b.dataset.id=n.id;if(!mobile){b.style.left=`${n.x}%`;b.style.top=`${n.y}%`}b.innerHTML=`<strong>${tx(n.label)}</strong><small>${tx(n.desc)}</small>`;b.addEventListener('click',()=>showNode(n));panel.appendChild(b)});
    panel.setAttribute('aria-label',ex('mapList'));
    function showNode(n){const d=$('#mapDetail');if(!d)return;d.innerHTML=`<h2>${tx(n.label)}</h2><p>${tx(n.desc)}</p><a class="btn primary" href="${n.href}">${tr('open')}</a>`;d.setAttribute('tabindex','-1');d.focus({preventScroll:true});d.scrollIntoView({behavior:'smooth',block:'nearest'})}
    $$('.map-filter').forEach(btn=>{
      btn.setAttribute('aria-pressed',String(btn.classList.contains('active')));
      btn.onclick=()=>{
        const g=btn.dataset.group;
        $$('.map-filter').forEach(x=>{const active=x===btn;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});
        $$('.knowledge-node').forEach(n=>{const hide=g!=='all'&&n.dataset.group!==g;n.classList.toggle('dim',hide);if(mobile)n.hidden=hide});
        $$('.map-svg line').forEach(line=>{const a=A.nodes.find(n=>n.id===line.dataset.a),b=A.nodes.find(n=>n.id===line.dataset.b);line.style.opacity=g==='all'||a?.group===g||b?.group===g?'1':'.08'});
      };
    });
  }
  function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function dayNumber(){const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)}
  function dailyIndex(){return A.daily.length?Math.abs(dayNumber())%A.daily.length:0}
  function computeStreak(records){let streak=0,d=dayNumber();if(!records[todayKey()])d--;while(true){const dt=new Date(d*86400000),k=`${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;if(records[k]){streak++;d--}else break}return streak}
  function renderDaily(){const mount=$('#dailyMount');if(!mount||!A.daily.length)return;const q=A.daily[dailyIndex()],p=readProgress(),key=todayKey(),state=p.daily?.[key],streak=computeStreak(p.daily||{}),opts=q.opts?.[lang]||q.opts?.ru||[];mount.innerHTML=`<article class="daily-card"><div class="daily-top"><span class="tag">${key}</span><span class="streak-pill">${tr('streak')}: ${streak} ${tr('days')}</span></div><h2>${tx(q.q)}</h2><div class="daily-options">${opts.map((o,i)=>`<button class="daily-option${state&&i===q.right?' correct':''}${state&&i===state.selected&&i!==q.right?' wrong':''}" data-i="${i}" type="button" ${state?'disabled':''}>${o}</button>`).join('')}</div>${state?`<div class="daily-explanation" role="status"><strong>${state.correct?tr('correct'):tr('incorrect')}</strong><p>${tr('explanation')}: ${tx(q.exp)}</p><p>${tr('comeBack')}</p></div>`:''}</article>`;if(!state)$$('.daily-option',mount).forEach(btn=>btn.addEventListener('click',()=>{const selected=Number(btn.dataset.i),correct=selected===q.right,pr=readProgress();pr.daily ||= {};pr.daily[key]={selected,correct,answeredAt:Date.now(),questionIndex:dailyIndex()};L.addEvidence(pr,'daily:'+dailyIndex(),[['absolute-risk','relative-risk'],['uncertainty'],['causality'],['bias'],['absolute-risk']][dailyIndex()],correct);saveProgress(pr);L.track('answer');renderDaily()}))}
  const simulatorState={step:0,picks:{}};
  function renderSimulator(){
    const mount=$('#simMount');if(!mount)return;let {step,picks}=simulatorState;
    const categories=['validity','sampling','measurement','analysis'];
    const render=()=>{if(step>=A.simulator.length){renderReport();return}const s=A.simulator[step];mount.innerHTML=`<div class="sim-layout"><aside class="sim-steps">${A.simulator.map((x,i)=>`<div class="sim-step-indicator${i===step?' active':''}${i<step?' done':''}">${tr('step')} ${i+1}</div>`).join('')}</aside><article class="sim-card" tabindex="-1"><div class="eyebrow">${tr('step')} ${step+1} / ${A.simulator.length}</div><h2>${tx(s.title)}</h2><p class="sim-context">${tx(s.context)}</p><div class="sim-options">${s.options.map(o=>`<button class="sim-option${picks[s.id]===o.id?' selected':''}" data-id="${o.id}" type="button" aria-pressed="${picks[s.id]===o.id}"><strong>${tx(o.label)}</strong><span>${picks[s.id]===o.id?tx(o.note):''}</span></button>`).join('')}</div><div class="sim-actions">${step>0?`<button class="btn ghost" id="simBack" type="button">${tr('back')}</button>`:'<span></span>'}<button class="btn primary" id="simNext" type="button" ${!picks[s.id]?'disabled':''}>${step===A.simulator.length-1?tr('finish'):tr('next')}</button></div></article></div>`;$$('.sim-option',mount).forEach(b=>b.addEventListener('click',()=>{picks[s.id]=b.dataset.id;render()}));$('#simBack')?.addEventListener('click',()=>{step--;simulatorState.step=step;render();$('.sim-card')?.focus()});$('#simNext')?.addEventListener('click',()=>{if(!picks[s.id])return;const active=A.simulator[step],option=active.options.find(o=>o.id===picks[active.id]);L.assess('simulator:'+active.id,step===0?['study-design','causality']:['study-design'],option.score===Math.max(...active.options.map(o=>o.score)));step++;simulatorState.step=step;render();$('.sim-card')?.focus()})};
    const renderReport=()=>{const rows=A.simulator.map((s,i)=>{const o=s.options.find(x=>x.id===picks[s.id]),top=Math.max(...s.options.map(x=>x.score)),ratio=top?Math.max(0,(o?.score||0)/top):0;return{label:ex(categories[i]||'analysis'),level:ratio>=.8?'high':ratio>=.4?'medium':'low',note:tx(o?.note)}});mount.innerHTML=`<article class="sim-card" tabindex="-1"><div class="eyebrow">${tr('score')}</div><div class="sim-profile">${rows.map(r=>`<div class="profile-row"><div><strong>${r.label}</strong><span>${ex(r.level)}</span></div><div class="profile-meter" data-level="${r.level}"><span></span></div><p>${r.note}</p></div>`).join('')}</div><p class="privacy-note">${tr('simText')}</p><div class="lesson-actions"><button class="btn primary" id="simRestart" type="button">${tr('restart')}</button></div></article>`;$('.sim-card')?.focus();$('#simRestart')?.addEventListener('click',()=>{step=0;simulatorState.step=step;Object.keys(picks).forEach(k=>delete picks[k]);render()})};render()
  }
  function renderProgress(){
    const mount=$('#progressMount');if(!mount)return;
    mount.innerHTML=`<p class="privacy-note">${tr('privacy')}</p><button class="btn ghost danger-btn" id="clearProgress" type="button">${tr('clearProgress')}</button>`;
    $('#clearProgress').onclick=()=>{if(confirm(tr('clearConfirm')))L.clear()};
  }
  function renderCurrent(){const page=document.body.dataset.page;({learn:renderLearn,map:renderMap,daily:renderDaily,simulator:renderSimulator,progress:renderProgress}[page]||(()=>{}))()}
  window.addEventListener('popstate',renderLearn);
  bindShell();applyI18n();window.addEventListener('resize',()=>{if(document.body.dataset.page==='map')renderMap()});
})();
