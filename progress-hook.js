(() => {
  'use strict';
  function ensureCore(){if(window.ETO_LEARNING)return;const s=document.createElement('script');s.src='learning-core.js';s.async=true;document.head.appendChild(s)}
  ensureCore();
  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('.choice');
    if(!btn || btn.closest('.review-quiz')) return;
    queueMicrotask(()=>{
      const card=btn.closest('.fact-card');
      if(!card || !btn.disabled) return;
      const isCorrect=btn.classList.contains('correct')&&!btn.classList.contains('wrong');
      if(window.ETO_LEARNING) window.ETO_LEARNING.recordCard(card.id,isCorrect);
    });
  });
})();