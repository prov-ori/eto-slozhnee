(() => {
  'use strict';
  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('.choice');
    if(!btn || btn.closest('.review-quiz')) return;
    queueMicrotask(()=>{
      const card=btn.closest('.fact-card');
      if(!card || !btn.disabled || !window.ETO_LEARNING) return;
      const isCorrect=btn.classList.contains('correct')&&!btn.classList.contains('wrong');
      window.ETO_LEARNING.recordCard(card.id,isCorrect);
    });
  });
})();