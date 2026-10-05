(() => {
  'use strict';
  function start(){
    const D=window.ETO_DATA;if(!D?.cards||!window.ETO_LEARNING)return;
    const L=window.ETO_LEARNING;
    const labels={
      ru:{title:'Проверь себя',text:'Ответь ещё раз без подсказки. Оцени, насколько легко вспомнился ответ.',correct:'Верно',wrong:'Не совсем',next:'Следующее повторение',hard:'Трудно',good:'Помню',easy:'Очень легко'},
      en:{title:'Test yourself',text:'Answer again without the hint, then rate how easy it was to recall.',correct:'Correct',wrong:'Not quite',next:'Next review',hard:'Hard',good:'Good',easy:'Very easy'},
      et:{title:'Kontrolli ennast',text:'Vasta uuesti ilma vihjeta ja hinda, kui lihtne oli vastust meenutada.',correct:'Õige',wrong:'Mitte päris',next:'Järgmine kordus',hard:'Raske',good:'Mäletan',easy:'Väga lihtne'}
    };
    const id=new URLSearchParams(location.search).get('id')||(()=>{try{return decodeURIComponent(location.hash.slice(1))}catch{return ''}})();const card=D.cards.find(c=>c.id===id);if(!card)return;
    const related=document.querySelector('.related-section');if(!related)return;
    const section=document.createElement('section');section.className='review-quiz';related.before(section);
    function render(){const lang=L.getLang(),c=card[lang]||card.ru,t=labels[lang]||labels.ru;section.innerHTML=`<div class="eyebrow">${t.title}</div><p>${t.text}</p><div class="review-quiz-options">${c.options.map((o,i)=>`<button class="choice" data-i="${i}" type="button">${o}</button>`).join('')}</div><div class="review-quiz-feedback" aria-live="polite" hidden></div>`;const opts=[...section.querySelectorAll('.choice')],feedback=section.querySelector('.review-quiz-feedback');opts.forEach(btn=>btn.addEventListener('click',()=>{const selected=Number(btn.dataset.i),ok=selected===c.right;opts.forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===c.right);b.classList.toggle('wrong',i===selected&&i!==c.right)});feedback.hidden=false;if(!ok){const rec=L.qualitySchedule(id,1);feedback.innerHTML=`<strong>${t.wrong}</strong><p>${t.next}: ${Math.max(1,Math.round((rec.nextReview-Date.now())/L.DAY))} d.</p>`;return}feedback.innerHTML=`<strong>${t.correct}</strong><div class="review-rating"><button type="button" data-q="3">${t.hard}</button><button type="button" data-q="4">${t.good}</button><button type="button" data-q="5">${t.easy}</button></div>`;feedback.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{const rec=L.qualitySchedule(id,Number(b.dataset.q));const days=Math.max(1,Math.round((rec.nextReview-Date.now())/L.DAY));feedback.innerHTML=`<strong>${t.correct}</strong><p>${t.next}: ${days} d.</p>`}))}))}
    render();document.querySelector('#languageSelect')?.addEventListener('change',()=>setTimeout(render,0));
  }
  if(window.ETO_LEARNING)start();else{const s=document.createElement('script');s.src='learning-core.js';s.onload=start;s.onerror=()=>{};document.head.appendChild(s)}
})();