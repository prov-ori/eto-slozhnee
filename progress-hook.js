(() => {
  'use strict';
  const KEY='eto-learning-progress-v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=p=>{try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}};
  const ensure=p=>{p.cards ||= {};p.courses ||= {};p.daily ||= {};p.meta ||= {};return p};
  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('.choice');
    if(!btn) return;
    queueMicrotask(()=>{
      const card=btn.closest('.fact-card');
      if(!card || !btn.disabled) return;
      const p=ensure(read());
      const isCorrect=btn.classList.contains('correct')&&!btn.classList.contains('wrong');
      const prev=p.cards[card.id]||{attempts:0,correct:0};
      prev.attempts+=1;
      if(isCorrect) prev.correct+=1;
      prev.lastAnswered=Date.now();
      prev.lastCorrect=isCorrect;
      const intervalDays=isCorrect?Math.min(14,Math.max(2,(prev.correct||1)*2)):1;
      prev.nextReview=Date.now()+intervalDays*86400000;
      p.cards[card.id]=prev;
      write(p);
    });
  });
})();
