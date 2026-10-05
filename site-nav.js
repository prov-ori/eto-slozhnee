(() => {
  'use strict';
  const labels={
    ru:{home:'Главная',learn:'Учиться',explore:'Библиотека',games:'Играть',progress:'Прогресс',daily:'Сегодня'},
    en:{home:'Home',learn:'Learn',explore:'Library',games:'Play',progress:'Progress',daily:'Today'},
    et:{home:'Avaleht',learn:'Õpi',explore:'Teek',games:'Mängi',progress:'Edenemine',daily:'Täna'}
  };
  const getLang=()=>{try{const s=localStorage.getItem('eto-lang');if(['ru','en','et'].includes(s))return s}catch{}const b=(navigator.language||'ru').slice(0,2);return ['ru','en','et'].includes(b)?b:'ru'};
  const page=()=>document.body.dataset.page||'home';
  const activeKey=()=>{const p=page();if(['learn'].includes(p))return'learn';if(['games','simulator','daily'].includes(p))return'games';if(['progress'].includes(p))return'progress';if(['library','glossary','method','fact','map'].includes(p))return'explore';return'home'};
  function item(href,key,text,active){return `<a href="${href}"${active===key?' class="active" aria-current="page"':''}>${text}</a>`}
  function bottomItem(href,key,icon,text,active){return `<a href="${href}"${active===key?' class="active" aria-current="page"':''}><span aria-hidden="true">${icon}</span><b>${text}</b></a>`}
  function render(){const l=labels[getLang()]||labels.ru,a=activeKey();const d=document.querySelector('.desktop-nav');if(d){d.innerHTML=[item('index.html','home',l.home,a),item('learn.html','learn',l.learn,a),item('library.html','explore',l.explore,a),item('games.html','games',l.games,a),item('progress.html','progress',l.progress,a)].join('');d.setAttribute('aria-label',getLang()==='ru'?'Основная навигация':getLang()==='et'?'Põhinavigatsioon':'Primary navigation')}
    const m=document.querySelector('#mobileMenu');if(m){m.innerHTML=[item('index.html','home',l.home,a),item('learn.html','learn',l.learn,a),item('daily.html','games',l.daily,a),item('library.html','explore',l.explore,a),item('games.html','games',l.games,a),item('progress.html','progress',l.progress,a)].join('')}
    const b=document.querySelector('.bottom-nav');if(b){b.innerHTML=[bottomItem('index.html','home','⌂',l.home,a),bottomItem('learn.html','learn','▶',l.learn,a),bottomItem('games.html','games','✦',l.games,a),bottomItem('progress.html','progress','✓',l.progress,a)].join('')}
  }
  render();document.querySelector('#languageSelect')?.addEventListener('change',()=>setTimeout(render,0));
})();