(() => {
  'use strict';
  const D=window.ETO_DATA;if(!D?.cards)return;
  const KEY='eto-learning-progress-v1';
  const SUP=['ru','et','en'];
  const saved=(()=>{try{return localStorage.getItem('eto-lang')}catch{return null}})();
  const lang=SUP.includes(saved)?saved:'ru';
  const labels={
    ru:{title:'Проверь себя',text:'Ответь ещё раз без подсказки. Результат обновит очередь повторения.',correct:'Верно',wrong:'Не совсем',next:'Следующее повторение',days:'дн.'},
    en:{title:'Test yourself',text:'Answer again without the hint. The result will update your review schedule.',correct:'Correct',wrong:'Not quite',next:'Next review',days:'days'},
    et:{title:'Kontrolli ennast',text:'Vasta uuesti ilma vihjeta. Tulemus uuendab kordamise ajakava.',correct:'Õige',wrong:'Mitte päris',next:'Järgmine kordus',days:'päeva'}
  }[lang];
  const id=new URLSearchParams(location.search).get('id');const card=D.cards.find(c=>c.id===id);if(!card)return;const c=card[lang]||card.ru;
  const related=document.querySelector('.related-section');if(!related)return;
  const section=document.createElement('section');section.className='review-quiz';section.innerHTML=`<div class="eyebrow">${labels.title}</div><p>${labels.text}</p><div class="review-quiz-options">${c.options.map((o,i)=>`<button class="choice" data-i="${i}" type="button">${o}</button>`).join('')}</div><div class="review-quiz-feedback" hidden></div>`;related.before(section);
  const opts=[...section.querySelectorAll('.choice')],feedback=section.querySelector('.review-quiz-feedback');
  opts.forEach(btn=>btn.addEventListener('click',()=>{const selected=Number(btn.dataset.i),ok=selected===c.right;opts.forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===c.right);b.classList.toggle('wrong',i===selected&&i!==c.right)});const progress=read();progress.cards ||= {};const prev=progress.cards[id]||{attempts:0,correct:0};prev.attempts+=1;if(ok)prev.correct+=1;prev.lastCorrect=ok;prev.lastAnswered=Date.now();const days=ok?Math.min(30,Math.max(3,(prev.correct||1)*3)):1;prev.nextReview=Date.now()+days*86400000;progress.cards[id]=prev;write(progress);feedback.hidden=false;feedback.innerHTML=`<strong>${ok?labels.correct:labels.wrong}</strong><p>${labels.next}: ${days} ${labels.days}.</p>`;}));
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}function write(p){try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}}
})();
