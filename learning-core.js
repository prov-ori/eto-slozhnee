(() => {
  'use strict';
  const KEY='eto-learning-progress-v2';
  const LEGACY='eto-learning-progress-v1';
  const DAY=86400000;
  const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch{return false}},remove(k){try{localStorage.removeItem(k)}catch{}}};
  const blank=()=>({version:2,cards:{},courses:{},daily:{},meta:{createdAt:Date.now()}});
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function normalize(p){
    p=object(p)?p:blank();p.version=2;
    for(const key of ['cards','courses','daily','meta'])if(!object(p[key]))p[key]={};
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
    try{const old=normalize(JSON.parse(raw));old.meta.migratedAt=Date.now();store.set(KEY,JSON.stringify(old))}catch{}
  }
  migrate();
  function read(){try{return normalize(JSON.parse(store.get(KEY)||'null'))}catch{return blank()}}
  function write(p){const ok=store.set(KEY,JSON.stringify(normalize(p)));if(ok)window.dispatchEvent(new CustomEvent('eto:progress',{detail:normalize(p)}));return ok}
  function qualitySchedule(cardId,quality){
    quality=Math.max(0,Math.min(5,Number(quality)||0));
    const p=read(),prev=p.cards[cardId]||{attempts:0,correct:0,repetitions:0,interval:0,ease:2.5};
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
    p.cards[cardId]=prev;write(p);return prev;
  }
  function recordCard(cardId,isCorrect){return qualitySchedule(cardId,isCorrect?4:1)}
  function markLesson(courseId,lessonId,passed=true){const p=read(),course=p.courses[courseId]||{done:[],mastery:{},current:0};const done=new Set(course.done||[]);if(passed)done.add(lessonId);else done.delete(lessonId);course.done=[...done];course.mastery ||= {};course.mastery[lessonId]={passed:Boolean(passed),updatedAt:Date.now()};course.updatedAt=Date.now();p.courses[courseId]=course;write(p);return course}
  function clear(){store.remove(KEY);store.remove(LEGACY);window.dispatchEvent(new CustomEvent('eto:progress',{detail:blank()}))}
  function due(now=Date.now()){return Object.entries(read().cards).filter(([,v])=>Number(v.nextReview||Infinity)<=now).sort((a,b)=>a[1].nextReview-b[1].nextReview)}
  function getLang(){const saved=store.get('eto-lang');if(['ru','et','en'].includes(saved))return saved;const b=(navigator.language||'ru').slice(0,2).toLowerCase();return ['ru','et','en'].includes(b)?b:'ru'}
  window.ETO_LEARNING={KEY,DAY,read,write,clear,due,recordCard,qualitySchedule,markLesson,getLang,storage:store};
})();
