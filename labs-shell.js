(() => {
  'use strict';
  const get=key=>{try{return localStorage.getItem(key)}catch{return null}};
  const set=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
  const select=document.querySelector('#languageSelect');
  const theme=document.querySelector('#themeToggle');
  const toggle=document.querySelector('#menuToggle');
  const menu=document.querySelector('#mobileMenu');
  const browser=(navigator.language||'ru').slice(0,2);
  select.value=['ru','en','et'].includes(get('eto-lang'))?get('eto-lang'):['ru','en','et'].includes(browser)?browser:'ru';
  const labels={ru:['Меню','Тёмная тема','Перейти к содержанию','Язык'],en:['Menu','Dark theme','Skip to content','Language'],et:['Menüü','Tume teema','Liigu sisu juurde','Keel']};
  const paint=()=>{
    const t=labels[select.value];
    toggle.textContent=t[0];theme.setAttribute('aria-label',t[1]);
    document.querySelector('.skip-link').textContent=t[2];select.setAttribute('aria-label',t[3]);
    theme.setAttribute('aria-pressed',String(document.body.classList.contains('dark')));
  };
  document.body.classList.toggle('dark',get('eto-theme')==='dark'||(!get('eto-theme')&&matchMedia('(prefers-color-scheme: dark)').matches));
  theme.addEventListener('click',()=>{document.body.classList.toggle('dark');set('eto-theme',document.body.classList.contains('dark')?'dark':'light');paint()});
  select.addEventListener('change',()=>{set('eto-lang',select.value);paint()});
  const close=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false')};
  toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();toggle.focus()}});
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target))close()});
  document.querySelector('#year').textContent=new Date().getFullYear();
  paint();
})();
