(() => {
  'use strict';

  const labels = {
    ru: {home:'Главная',learn:'Учиться',explore:'Исследовать',games:'Играть',progress:'Прогресс',daily:'Сегодня',map:'Карта знаний',simulator:'Симулятор',library:'Библиотека',glossary:'Словарь',method:'Метод'},
    en: {home:'Home',learn:'Learn',explore:'Explore',games:'Play',progress:'Progress',daily:'Today',map:'Knowledge map',simulator:'Simulator',library:'Library',glossary:'Glossary',method:'Method'},
    et: {home:'Avaleht',learn:'Õpi',explore:'Uuri',games:'Mängi',progress:'Edenemine',daily:'Täna',map:'Teadmiste kaart',simulator:'Simulaator',library:'Teek',glossary:'Sõnastik',method:'Meetod'}
  };

  const getLang = () => {
    try {
      const saved = localStorage.getItem('eto-lang');
      if (['ru','en','et'].includes(saved)) return saved;
    } catch {}
    const browser = (navigator.language || 'ru').slice(0,2).toLowerCase();
    return ['ru','en','et'].includes(browser) ? browser : 'ru';
  };

  const page = () => document.body.dataset.page || 'home';
  const prefix = location.pathname.includes('/facts/') ? '../' : '';
  const href = file => `${prefix}${file}`;

  const activeKey = () => {
    const p = page();
    if (p === 'learn') return 'learn';
    if (['games','simulator','daily'].includes(p)) return 'games';
    if (p === 'progress') return 'progress';
    if (['library','glossary','method','fact','map'].includes(p)) return 'explore';
    return 'home';
  };

  const item = (file,key,text,active) => `<a href="${href(file)}"${active===key?' class="active" aria-current="page"':''}>${text}</a>`;
  const bottomItem = (file,key,icon,text,active) => `<a href="${href(file)}"${active===key?' class="active" aria-current="page"':''}><span aria-hidden="true">${icon}</span><b>${text}</b></a>`;

  function closeMobileMenu() {
    const menu = document.querySelector('#mobileMenu');
    const toggle = document.querySelector('#menuToggle');
    if (!menu) return;
    menu.hidden = true;
    toggle?.setAttribute('aria-expanded','false');
  }

  function render() {
    const language = getLang();
    const l = labels[language] || labels.ru;
    const active = activeKey();

    const desktop = document.querySelector('.desktop-nav');
    if (desktop) {
      desktop.innerHTML = [
        item('index.html','home',l.home,active),
        item('learn.html','learn',l.learn,active),
        item('library.html','explore',l.explore,active),
        item('games.html','games',l.games,active),
        item('progress.html','progress',l.progress,active)
      ].join('');
      desktop.setAttribute('aria-label', language==='ru' ? 'Основная навигация' : language==='et' ? 'Põhinavigatsioon' : 'Primary navigation');
    }

    const mobile = document.querySelector('#mobileMenu');
    if (mobile) {
      mobile.innerHTML = [
        item('index.html','home',l.home,active),
        item('learn.html','learn',l.learn,active),
        item('daily.html','games',l.daily,active),
        item('map.html','explore',l.map,active),
        item('simulator.html','games',l.simulator,active),
        item('library.html','explore',l.library,active),
        item('games.html','games',l.games,active),
        item('glossary.html','explore',l.glossary,active),
        item('method.html','explore',l.method,active),
        item('progress.html','progress',l.progress,active)
      ].join('');
      mobile.setAttribute('aria-label', language==='ru' ? 'Мобильное меню' : language==='et' ? 'Mobiilimenüü' : 'Mobile menu');
    }

    const bottom = document.querySelector('.bottom-nav');
    if (bottom) {
      bottom.innerHTML = [
        bottomItem('index.html','home','⌂',l.home,active),
        bottomItem('learn.html','learn','▶',l.learn,active),
        bottomItem('games.html','games','✦',l.games,active),
        bottomItem('progress.html','progress','✓',l.progress,active)
      ].join('');
    }

    const select = document.querySelector('#languageSelect');
    if (select) select.value = language;
  }

  render();

  document.querySelector('#languageSelect')?.addEventListener('change', () => setTimeout(render,0));
  document.querySelector('#mobileMenu')?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMobileMenu();
  });
})();
