(() => {
  'use strict';
  const I = window.ETO_I18N;
  const E = window.ETO_EXPERIENCE_DATA;
  const prefix = document.body.dataset.factId ? '../' : '';
  const page = document.body.dataset.page;
  const sections = {
    home: ['index.html', ['home', 'daily']],
    learn: ['learn.html', ['learn', 'academy', 'workshop']],
    explore: ['explore.html', ['explore', 'library', 'concepts', 'glossary', 'atlas', 'books', 'connections', 'map', 'fact']],
    practice: ['practice.html', ['practice', 'games', 'labs', 'cases', 'simulator']],
    progress: ['progress.html', ['progress']]
  };
  const explore = { library: 'library.html', concepts: 'concepts.html', glossary: 'glossary.html', atlas: 'atlas.html', connections: 'connections.html', books: 'books.html', map: 'map.html' };
  const practice = { games: 'games.html', labs: 'labs.html', cases: 'cases.html', simulator: 'simulator.html' };
  const learn = { learn: 'learn.html', workshop: 'workshop.html' };
  const icons = {home:'⌂', learn:'▶', explore:'◎', practice:'✦', progress:'✓'};
  const t = key => I.pick(E.labels[key]);
  const link = (key, href, active, icon) => `<a href="${prefix}${href}"${active ? ' class="active" aria-current="page"' : ''}>${icon ? `<span aria-hidden="true">${icon}</span><b>${t(key)}</b>` : t(key)}</a>`;
  const mobile = document.querySelector('#mobileMenu');
  const menuButton = document.querySelector('#menuToggle');

  function render() {
    for (const selector of ['.desktop-nav', '#mobileMenu', '.bottom-nav']) {
      const nav = document.querySelector(selector);
      if (!nav) continue;
      nav.innerHTML = Object.entries(sections).map(([key, [href, pages]]) =>
        link(key, href, pages.includes(page), selector === '.bottom-nav' ? icons[key] : '')).join('');
      nav.setAttribute('aria-label', I.pick({ru:'Основная навигация', en:'Primary navigation', et:'Põhinavigatsioon'}));
    }
    const sub = document.querySelector('[data-section-nav]');
    if (sub) {
      const entries = {explore, practice, learn}[sub.dataset.sectionNav];
      sub.innerHTML = Object.entries(entries).map(([key, href]) => link(key, href, page === key)).join('');
      sub.setAttribute('aria-label', t(sub.dataset.sectionNav));
    }
    const footer = document.querySelector('[data-method-link]');
    if (footer) footer.textContent = t('method');
    document.querySelectorAll('[data-experience]').forEach(el => {
      el.textContent = t(el.dataset.experience);
    });
    if (['practice', 'explore'].includes(page)) document.title = `${t(page)} — Это сложнее`;
  }

  I.bind();
  render();
  window.addEventListener('eto:language', render);
  mobile?.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    mobile.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
  });
})();
