(() => {
  'use strict';
  const KEY='eto-learning-progress-v2';
  const LEGACY='eto-learning-progress-v1';
  const WORKSHOP='eto-workshop-v1';
  const DAY=86400000;
  const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch{return false}},remove(k){try{localStorage.removeItem(k)}catch{}}};
  const blank=()=>({version:2,cards:{},courses:{},daily:{},meta:{createdAt:Date.now()}});
  const own=(obj,key)=>Object.hasOwn(obj,key);
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function normalize(p){
    p=object(p)?p:blank();p.version=2;
    for(const key of ['cards','courses','daily','meta','skillEvidence','bookmarks','recent','workshop'])if(!object(p[key]))p[key]={};
    for(const key of ['answers','notes'])if(!object(p.workshop[key]))p.workshop[key]={};
    for(const [id,card] of Object.entries(p.cards)){
      if(!object(card)){delete p.cards[id];continue}
      for(const key of ['attempts','correct','repetitions','interval'])card[key]=Math.max(0,Math.floor(Number(card[key])||0));
      card.correct=Math.min(card.correct,card.attempts);
    }
    for(const [id,course] of Object.entries(p.courses)){
      if(!object(course)){delete p.courses[id];continue}
      course.done=Array.isArray(course.done)?course.done.filter(x=>typeof x==='string'):[];
      if(!object(course.mastery))course.mastery={};
    }
    return p;
  }
  function migrate(){
    const current=store.get(KEY);if(current)return;
    const raw=store.get(LEGACY);if(!raw)return;
    try{const old=normalize(parse(raw));old.meta.migratedAt=Date.now();store.set(KEY,JSON.stringify(old))}catch{}
  }
  migrate();
  function parse(raw) {
    return JSON.parse(raw, (key, value) => ['__proto__', 'constructor', 'prototype'].includes(key) ? undefined : value);
  }
  function read() {
    let raw;
    try { raw = parse(store.get(KEY) || 'null'); } catch {}
    const hasWorkshop = object(raw?.workshop);
    const p = normalize(raw);
    if (!hasWorkshop) {
      try { p.workshop = parse(store.get(WORKSHOP) || 'null'); } catch {}
    }
    return normalize(p);
  }
  function write(p){const ok=store.set(KEY,JSON.stringify(normalize(p)));if(ok)window.dispatchEvent(new CustomEvent('eto:progress',{detail:normalize(p)}));return ok}
  function qualitySchedule(cardId,quality){
    quality=Math.max(0,Math.min(5,Number(quality)||0));
    const p=read(),prev=(own(p.cards,cardId)&&p.cards[cardId])||{attempts:0,correct:0,repetitions:0,interval:0,ease:2.5};
    prev.attempts=(prev.attempts||0)+1;
    const correct=quality>=3;if(correct)prev.correct=(prev.correct||0)+1;
    let ease=Number(prev.ease)||2.5;
    ease=ease+(0.1-(5-quality)*(0.08+(5-quality)*0.02));
    ease=Math.max(1.3,Math.min(3,ease));
    if(!correct){prev.repetitions=0;prev.interval=1;}else{
      prev.repetitions=(prev.repetitions||0)+1;
      if(prev.repetitions===1)prev.interval=1;
      else if(prev.repetitions===2)prev.interval=3;
      else prev.interval=Math.max(4,Math.round((prev.interval||3)*ease));
    }
    prev.ease=ease;prev.lastAnswered=Date.now();prev.lastCorrect=correct;prev.lastQuality=quality;prev.nextReview=Date.now()+prev.interval*DAY;
    p.cards[cardId]=prev;addEvidence(p, 'fact:'+cardId, window.ETO_EXPERIENCE_DATA?.factSkills[cardId], correct);write(p);track('answer');return prev;
  }
  function recordCard(cardId,isCorrect){return qualitySchedule(cardId,isCorrect?4:1)}
  function markLesson(courseId,lessonId,passed=true){const p=read(),course=(own(p.courses,courseId)&&p.courses[courseId])||{done:[],mastery:{},current:0};const done=new Set(course.done||[]);if(passed)done.add(lessonId);else done.delete(lessonId);course.done=[...done];course.mastery ||= {};course.mastery[lessonId]={passed:Boolean(passed),updatedAt:Date.now()};course.updatedAt=Date.now();p.courses[courseId]=course;write(p);return course}
  function clear(){store.remove(KEY);store.remove(LEGACY);store.remove(WORKSHOP);store.remove('eto-local-events-v1');window.dispatchEvent(new CustomEvent('eto:progress',{detail:blank()}))}
  function due(now=Date.now()){return Object.entries(read().cards).filter(([,v])=>Number(v.nextReview||Infinity)<=now).sort((a,b)=>a[1].nextReview-b[1].nextReview)}
  function addEvidence(p, exercise, skills, correct) {
    for (const skill of skills || []) {
      if (!own(window.ETO_EXPERIENCE_DATA.skills, skill)) continue;
      if (!object(p.skillEvidence[skill])) p.skillEvidence[skill] = {};
      const evidence = p.skillEvidence[skill];
      if (!own(evidence, exercise)) evidence[exercise] = Boolean(correct);
    }
  }
  function assess(exercise, skills, correct) {
    const p = read();
    addEvidence(p, exercise, skills, correct);
    write(p);
    track('answer');
  }
  function skillSummary(p, skill) {
    const items = Object.values(p.skillEvidence[skill] || {}).filter(v => typeof v === 'boolean');
    const correct = items.filter(Boolean).length;
    const total = items.length;
    const status = total === 0 ? 'noEvidence' : total < 3 ? 'moreEvidence' : correct / total >= .75 ? 'demonstrated' : 'keepPracticing';
    return { correct, total, status };
  }
  function track(name) {
    if (!['answer', 'diagnostic_completed', 'search_opened', 'bookmark_changed', 'progress_imported'].includes(name)) return;
    const key = 'eto-local-events-v1';
    try {
      const old = parse(store.get(key) || '[]');
      const entries = Array.isArray(old) ? old.slice(-99) : [];
      entries.push({ name, day: new Date().toISOString().slice(0, 10) });
      store.set(key, JSON.stringify(entries));
    } catch {}
  }
  function exportProgress() {
    return JSON.stringify({ format: 'eto-progress', version: 1, progress: read() }, null, 2);
  }
  function importProgress(text) {
    const backup = parse(text);
    if (backup?.format !== 'eto-progress' || backup.version !== 1 || backup.progress?.version !== 2 ||
        !['cards', 'courses', 'daily', 'meta', 'workshop', 'skillEvidence', 'bookmarks', 'recent'].every(key => object(backup.progress[key]))) {
      throw new Error('Invalid backup format');
    }
    if (!write(backup.progress)) throw new Error('Storage unavailable');
    track('progress_imported');
  }
  window.ETO_LEARNING={KEY,DAY,read,write,clear,due,recordCard,qualitySchedule,markLesson,
    getLang:()=>window.ETO_I18N.get(),storage:store,assess,addEvidence,skillSummary,track,exportProgress,importProgress};
})();
