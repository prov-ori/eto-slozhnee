(() => {
  'use strict';
  const I = window.ETO_I18N;
  const E = window.ETO_EXPERIENCE_DATA;
  const L = window.ETO_LEARNING;
  const { escape } = window.ETO_MATERIALS;
  const $ = selector => document.querySelector(selector);
  const prefix = document.body.dataset.factId ? '../' : '';
  const t = key => escape(I.pick(E.labels[key]));
  const validLink = href => typeof href === 'string' && /^(?:facts\/[a-z0-9-]+\.html|(?:learn|concepts|books|workshop|games|labs|simulator|cases)\.html)(?:[?#][\w%=&-]+)?$/.test(href);
  const anchor = (href, text) => `<a href="${prefix}${escape(href)}">${escape(text)}</a>`;
  const list = links => links.length
    ? `<ul class="experience-list">${links.map(({href, title}) => `<li>${anchor(href, I.pick(title, title))}</li>`).join('')}</ul>`
    : `<p>${t('emptyList')}</p>`;

  function materialControls(mount, href, title, recordVisit = true) {
    if (!mount || !validLink(href)) return;
    const p = L.read();
    if (recordVisit && (!Object.hasOwn(p.recent, href) || Object.keys(p.recent).at(-1) !== href)) {
      delete p.recent[href];
      p.recent[href] = title;
      p.recent = Object.fromEntries(Object.entries(p.recent).slice(-30));
      L.write(p);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn ghost';
    const render = () => {
      const saved = Object.hasOwn(L.read().bookmarks, href);
      button.textContent = I.pick(E.labels[saved ? 'unbookmark' : 'bookmark']);
      button.setAttribute('aria-pressed', String(saved));
    };
    button.addEventListener('click', () => {
      const progress = L.read();
      if (Object.hasOwn(progress.bookmarks, href)) delete progress.bookmarks[href];
      else progress.bookmarks[href] = title;
      if (L.write(progress)) L.track('bookmark_changed');
      render();
    });
    mount.replaceChildren(button);
    render();
  }

  let indexRequest;
  function searchIndex() {
    indexRequest ||= fetch(new URL(prefix + 'search-index.json', location.href))
      .then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      })
      .catch(error => { indexRequest = null; throw error; });
    return indexRequest;
  }

  function setupSearch() {
    const actions = $('.header-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.className = 'search-trigger';
    button.type = 'button';
    button.textContent = '⌕';
    const dialog = document.createElement('dialog');
    dialog.className = 'site-search';
    dialog.setAttribute('aria-labelledby', 'siteSearchTitle');
    dialog.innerHTML = '<header><h2 id="siteSearchTitle"></h2><button type="button" class="btn ghost" data-close-search></button></header><input type="search" class="search-box" aria-labelledby="siteSearchTitle"><p role="status"></p><div data-search-results></div>';
    const input = dialog.querySelector('input');
    const status = dialog.querySelector('[role="status"]');
    const results = dialog.querySelector('[data-search-results]');
    const close = dialog.querySelector('[data-close-search]');
    const normalize = value => value.normalize('NFC').toLocaleLowerCase(I.get()).replaceAll('ё', 'е');
    let sequence = 0;
    async function renderResults() {
      const request = ++sequence;
      const tokens = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
      status.textContent = '';
      results.replaceChildren();
      if (!tokens.length) return;
      try {
        const index = await searchIndex();
        if (request !== sequence) return;
        const matches = index.map(item => {
          const title = I.pick(item.title, item.title);
          const body = normalize(`${title} ${I.pick(item.text, item.text)} ${item.href}`);
          const score = tokens.every(token => body.includes(token)) ? 1 + tokens.filter(token => normalize(title).includes(token)).length : 0;
          return { ...item, title, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 30);
        results.innerHTML = matches.map(item => `<a href="${prefix}${escape(item.href)}">${escape(item.title)}<small>${t(item.type)}</small></a>`).join('');
        status.textContent = matches.length ? String(matches.length) : I.pick(E.labels.emptySearch);
      } catch {
        if (request === sequence) status.textContent = I.pick(E.labels.searchError);
      }
    }
    function localize() {
      dialog.querySelector('h2').textContent = I.pick(E.labels.search);
      button.setAttribute('aria-label', I.pick(E.labels.search));
      button.title = I.pick(E.labels.search);
      close.textContent = I.pick(E.labels.close);
      input.placeholder = I.pick(E.labels.searchHint);
      if (dialog.open) renderResults();
    }
    actions.prepend(button);
    document.body.append(dialog);
    localize();
    window.addEventListener('eto:language', localize);
    button.addEventListener('click', () => { dialog.showModal(); input.focus(); L.track('search_opened'); });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => button.focus());
    dialog.addEventListener('click', event => { if (event.target.closest('a')) dialog.close(); });
    input.addEventListener('input', renderResults);
  }

  function routeFor(p) {
    const answers = p.diagnostic?.answers;
    if (!Array.isArray(answers) || answers.length !== window.ETO_DIAGNOSTIC?.length) return [];
    const missed = window.ETO_DIAGNOSTIC.flatMap((q, i) => answers[i] === q.right ? [] : q.skills);
    const topics = missed.length ? missed : ['study-design', 'bayesian', 'clinical'];
    const unique = new Map();
    for (const id of topics) {
      const skill = E.skills[id];
      if (!unique.has(skill.href)) unique.set(skill.href, skill);
    }
    return [...unique.values()].map(skill => ({href: skill.href, title: skill.name}));
  }

  let quizOpen = false;
  let responses = [];
  function renderDiagnostic() {
    const mount = $('[data-diagnostic]');
    if (!mount) return;
    const route = routeFor(L.read());
    const quiz = window.ETO_DIAGNOSTIC;
    if (!quizOpen) {
      mount.innerHTML = `<h2>${t(route.length ? 'route' : 'diagnostic')}</h2>${route.length ? list(route) : `<p>${t('diagnosticIntro')}</p>`}<button class="btn primary" type="button">${t(route.length ? 'retake' : 'diagnostic')}</button>`;
      mount.querySelector('button').onclick = () => { quizOpen = true; responses = []; renderDiagnostic(); mount.querySelector('h2').focus(); };
      return;
    }
    const question = quiz[responses.length];
    mount.innerHTML = `<h2 tabindex="-1">${t('diagnostic')} · ${responses.length + 1}/${quiz.length}</h2><form><fieldset><legend>${escape(I.pick(question.question))}</legend>
      ${question.options.map((option, index) => `<label><input name="answer" type="radio" value="${index}" required>${escape(I.pick(option))}</label>`).join('')}
      </fieldset><div class="experience-actions"><button class="btn primary" type="submit">${t('next')}</button><button class="btn ghost" type="button">${t('close')}</button></div></form>`;
    mount.querySelector('button[type="button"]').onclick = () => { quizOpen = false; renderDiagnostic(); mount.querySelector('button').focus(); };
    mount.querySelector('form').onsubmit = event => {
      event.preventDefault();
      responses.push(Number(new FormData(event.target).get('answer')));
      if (responses.length === quiz.length) {
        const p = L.read();
        p.diagnostic = {answers: responses};
        if (L.write(p)) L.track('diagnostic_completed');
        quizOpen = false;
      }
      renderDiagnostic();
      (mount.querySelector('[tabindex]') || mount.querySelector('button')).focus();
    };
  }

  function continueLink(p) {
    const courses = window.ETO_ACADEMY?.courses || [];
    const course = courses.find(c => c.id === p.meta.lastCourse)
      || [...courses].filter(c => p.courses[c.id]).sort((a, b) => (p.courses[b.id].updatedAt || 0) - (p.courses[a.id].updatedAt || 0))[0];
    if (course) {
      const saved = p.courses[course.id];
      const done = new Set(saved?.done);
      const current = saved?.current || 0;
      const next = course.lessons.slice(current).find(l => !done.has(l.id)) || course.lessons.find(l => !done.has(l.id));
      if (next) return {href: E.lesson(course.id, next.id), title: next.title};
    }
    return routeFor(p)[0] || {href: 'learn.html', title: E.labels.learn};
  }

  function reviewLinks() {
    const cards = window.ETO_DATA?.cards || [];
    return L.due().flatMap(([id]) => {
      const card = cards.find(c => c.id === id);
      return card ? [{href: E.fact(id) + '#review', title: Object.fromEntries(I.languages.map(lang => [lang, card[lang].q]))}] : [];
    });
  }

  function renderToday() {
    const mount = $('[data-today]');
    if (!mount) return;
    const next = continueLink(L.read());
    const due = reviewLinks();
    mount.innerHTML = `<section class="experience-panel"><h2>${t('continue')}</h2>${anchor(next.href, I.pick(next.title))}</section>
      <section class="experience-panel"><h2>${t('review')}</h2>${due.length ? list(due.slice(0, 3)) : `<p>${t('noReview')}</p>`}${due.length > 3 ? anchor('progress.html#reviewQueue', I.pick(E.labels.allReview)) : ''}</section>`;
  }

  function renderSkills() {
    const mount = $('[data-skills]');
    if (!mount) return;
    const p = L.read();
    mount.innerHTML = `<h2>${t('skills')}</h2><p>${t('observations')}</p><div class="experience-grid">${Object.entries(E.skills).map(([id, skill]) => {
      const {correct, total, status} = L.skillSummary(p, id);
      return `<article class="experience-panel skill-card"><h3>${escape(I.pick(skill.name))}</h3><p>${t(status)}${total ? ` · ${correct}/${total}` : ''}</p>
        ${total ? `<meter aria-label="${escape(I.pick(skill.name))}" max="${total}" value="${correct}"></meter>` : ''}
        ${anchor(skill.href, I.pick(E.labels.practice))}</article>`;
    }).join('')}</div>`;
    const review = $('#reviewQueue');
    const due = reviewLinks();
    review.innerHTML = `<h2>${t('review')}</h2>${due.length ? list(due) : `<p>${t('noReview')}</p>`}`;
  }

  function renderSaved() {
    const mount = $('[data-saved]');
    if (!mount) return;
    const p = L.read();
    mount.innerHTML = ['bookmarks', 'recent'].map(key =>
      `<section class="experience-panel"><h2>${t(key)}</h2>${list(Object.entries(p[key]).reverse().filter(([href]) => validLink(href)).map(([href, title]) => ({href, title})))}</section>`
    ).join('');
  }

  function renderBackup() {
    const mount = $('[data-backup]');
    if (!mount) return;
    mount.innerHTML = `<h2>${t('backup')}</h2><div class="experience-actions"><button class="btn ghost" type="button">${t('export')}</button>
      <label class="btn ghost">${t('import')}<input type="file" accept=".json,application/json"></label></div><p role="status"></p>`;
    mount.querySelector('button').onclick = () => {
      const blob = new Blob([L.exportProgress()], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'eto-progress.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    mount.querySelector('input').onchange = async event => {
      const [file] = event.target.files;
      event.target.value = '';
      if (!file || !confirm(I.pick(E.labels.importConfirm))) return;
      const status = mount.querySelector('[role="status"]');
      try {
        if (file.size > 5_000_000) throw new Error('Backup too large');
        L.importProgress(await file.text());
        status.textContent = I.pick(E.labels.imported);
      } catch { status.textContent = I.pick(E.labels.importError); }
    };
  }

  const renderProgress = () => { renderSkills(); renderSaved(); };
  function render() {
    renderToday();
    renderDiagnostic();
    renderProgress();
    renderBackup();
  }
  window.ETO_EXPERIENCE = { materialControls };
  document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    render();
    window.addEventListener('eto:language', render);
    window.addEventListener('eto:progress', renderProgress);
  }, {once:true});
})();
