(() => {
  'use strict';

  const DATA = window.ETO_DATA || { ui: {}, cards: [], glossary: [] };
  const SUPPORTED_LANGS = ['ru', 'et', 'en'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };

  const savedLang = safeStorage.get('eto-lang');
  const browserLang = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  let lang = SUPPORTED_LANGS.includes(savedLang) ? savedLang : (SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'ru');
  let activeFilter = 'all';
  const answers = new Map();

  const ui = () => DATA.ui[lang] || DATA.ui.ru || {};
  const tr = (key, fallback = '') => ui()[key] ?? fallback;
  const cardText = card => card?.[lang] || card?.ru || {};
  const evidence = level => tr(`level${level}`);

  function safeHashId() {
    if (!location.hash || location.hash.length < 2) return '';
    try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
  }

  function setText(selector, value) {
    const el = $(selector);
    if (el && value != null) el.textContent = value;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => {
      const value = tr(el.dataset.i18n);
      if (value !== '') el.textContent = value;
    });
    $$('[data-i18n-placeholder]').forEach(el => {
      const value = tr(el.dataset.i18nPlaceholder);
      if (value !== '') el.placeholder = value;
    });
    $$('[data-i18n-aria]').forEach(el => {
      const value = tr(el.dataset.i18nAria);
      if (value !== '') el.setAttribute('aria-label', value);
    });

    const select = $('#languageSelect');
    if (select) {
      select.value = lang;
      select.setAttribute('aria-label', tr('language', 'Language'));
    }

    const page = document.body.dataset.page || 'home';
    const pageLabels = { home: 'brand', library: 'navLibrary', games: 'navGames', glossary: 'navGlossary', method: 'navMethod', fact: 'factEyebrow' };
    const pageLabel = tr(pageLabels[page] || 'brand', tr('brand'));
    document.title = page === 'home' ? tr('brand') : `${pageLabel} — ${tr('brand')}`;

    updateThemeButton();
    updateProgress();
    updateBiasLabels();
  }

  function cardHTML(card, { compact = false } = {}) {
    const c = cardText(card);
    const answerState = answers.get(card.id);
    const hasAnswer = Number.isInteger(answerState);
    const right = c.right;
    return `<article class="fact-card${compact ? ' compact' : ''}" id="${card.id}" data-category="${card.category}">
      <div class="card-topline"><span class="tag">${c.tag}</span><span class="evidence-badge" data-level="${card.level}">${evidence(card.level)}</span></div>
      <p class="kicker">${c.kicker}</p><h3>${c.q}</h3>
      ${c.options.map((option, index) => `<button class="choice${hasAnswer && index === right ? ' correct' : ''}${hasAnswer && index === answerState && index !== right ? ' wrong' : ''}" data-index="${index}" type="button" ${hasAnswer ? 'disabled' : ''} aria-pressed="${hasAnswer && index === answerState ? 'true' : 'false'}">${option}</button>`).join('')}
      <div class="feedback" ${hasAnswer ? '' : 'hidden'}><p><strong>${c.answer}</strong></p><p class="caveat">${c.caveat}</p>
      <details class="source-details"><summary>${tr('sourceQuality')}</summary><p><b>${c.design}</b></p><a href="${card.source}" target="_blank" rel="noopener noreferrer">${card.sourceName} ↗</a></details></div>
      <div class="card-footer"><span>${tr('checked')}</span><button class="share-button" type="button">${tr('share')}</button><button class="retry-button" type="button" ${hasAnswer ? '' : 'hidden'}>${tr('retry')}</button></div>
    </article>`;
  }

  function currentCardsForPage() {
    return document.body.dataset.page === 'home' ? DATA.cards.slice(0, 8) : DATA.cards;
  }

  function renderCards() {
    const grid = $('#factsGrid');
    if (!grid) return;
    const cards = currentCardsForPage();
    grid.innerHTML = cards.map(card => cardHTML(card)).join('');
    setText('#cardCount', DATA.cards.length);
    bindCards(grid);
    filterCards(activeFilter, false);

    const id = safeHashId();
    const target = id ? document.getElementById(id) : null;
    if (target?.classList.contains('fact-card')) setTimeout(() => target.scrollIntoView({ block: 'center' }), 80);
  }

  function bindCards(root) {
    $$('.fact-card', root).forEach(cardEl => {
      const card = DATA.cards.find(item => item.id === cardEl.id);
      if (!card) return;
      const choices = $$('.choice', cardEl);
      const feedback = $('.feedback', cardEl);
      const retry = $('.retry-button', cardEl);

      choices.forEach(button => button.addEventListener('click', () => {
        const selected = Number(button.dataset.index);
        const right = cardText(card).right;
        answers.set(card.id, selected);
        choices.forEach((choice, index) => {
          choice.disabled = true;
          choice.classList.toggle('correct', index === right);
          choice.classList.toggle('wrong', index === selected && index !== right);
          choice.setAttribute('aria-pressed', String(index === selected));
        });
        if (feedback) feedback.hidden = false;
        if (retry) retry.hidden = false;
        updateProgress();
      }));

      retry?.addEventListener('click', () => resetCard(cardEl));
      $('.share-button', cardEl)?.addEventListener('click', () => shareCard(card));
    });
  }

  function resetCard(cardEl) {
    $$('.choice', cardEl).forEach(button => {
      button.disabled = false;
      button.classList.remove('correct', 'wrong');
      button.setAttribute('aria-pressed', 'false');
    });
    const feedback = $('.feedback', cardEl);
    if (feedback) feedback.hidden = true;
    const retry = $('.retry-button', cardEl);
    if (retry) retry.hidden = true;
    answers.delete(cardEl.id);
    updateProgress();
  }

  function updateProgress() {
    const cards = $$('.fact-card').filter(card => card.style.display !== 'none');
    if (!cards.length) return;
    const answeredCount = cards.filter(card => answers.has(card.id)).length;
    const progressText = $('#progressText');
    if (progressText) progressText.textContent = `${tr('answered')} ${answeredCount} ${tr('of')} ${cards.length}`;
    const bar = $('#progressBar');
    if (bar) {
      const pct = cards.length ? (answeredCount / cards.length) * 100 : 0;
      bar.style.width = `${pct}%`;
      bar.parentElement?.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
  }

  function filterCards(category, scroll = false) {
    activeFilter = category;
    $$('.filter').forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('.fact-card').forEach(card => {
      const match = category === 'all' || card.dataset.category.split(' ').includes(category);
      card.hidden = !match;
      card.style.display = match ? 'flex' : 'none';
    });
    updateProgress();
    if (scroll) $('#facts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $$('.filter').forEach(button => button.addEventListener('click', () => filterCards(button.dataset.filter)));
  $('#resetAll')?.addEventListener('click', () => {
    answers.clear();
    $$('.fact-card').forEach(card => resetCard(card));
    updateProgress();
  });

  const toast = $('#toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  async function shareCard(card) {
    const c = cardText(card);
    const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
    const url = `${base}fact.html?id=${encodeURIComponent(card.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: tr('brand'), text: c.q, url });
      else { await copyText(url); showToast(tr('copied')); }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast(tr('shareFail'));
    }
  }

  function renderLibrary() {
    const grid = $('#libraryGrid');
    if (!grid) return;
    const q = ($('#librarySearch')?.value || '').trim().toLocaleLowerCase(lang);
    const category = $('#libraryCategory')?.value || 'all';
    const list = DATA.cards.filter(card => {
      const c = cardText(card);
      const haystack = [c.q, c.kicker, c.tag, c.answer, c.caveat, c.design, card.sourceName].join(' ').toLocaleLowerCase(lang);
      return (!q || haystack.includes(q)) && (category === 'all' || card.category.split(' ').includes(category));
    });

    grid.innerHTML = list.length ? list.map(card => {
      const c = cardText(card);
      return `<article class="library-item"><div class="card-topline"><span class="tag">${c.tag}</span><span class="evidence-badge" data-level="${card.level}">${evidence(card.level)}</span></div><h3>${c.q}</h3><p>${c.answer}</p><a href="fact.html?id=${encodeURIComponent(card.id)}">${tr('openCard')} →</a></article>`;
    }).join('') : `<div class="empty-state">${tr('noResults')}</div>`;
  }

  $('#librarySearch')?.addEventListener('input', renderLibrary);
  $('#libraryCategory')?.addEventListener('change', renderLibrary);

  function renderGlossary() {
    const grid = $('#glossaryGrid');
    if (!grid) return;
    const q = ($('#glossarySearch')?.value || '').trim().toLocaleLowerCase(lang);
    const list = DATA.glossary.filter(item => `${item.term[lang] || item.term.ru} ${item.def[lang] || item.def.ru}`.toLocaleLowerCase(lang).includes(q));
    grid.innerHTML = list.length ? list.map(item => `<article class="glossary-card"><h2>${item.term[lang] || item.term.ru}</h2><p>${item.def[lang] || item.def.ru}</p></article>`).join('') : `<div class="empty-state">${tr('noResults')}</div>`;
  }
  $('#glossarySearch')?.addEventListener('input', renderGlossary);

  function initRiskLab() {
    const baseline = $('#baselineRisk');
    const rr = $('#relativeRisk');
    if (!baseline || !rr) return;
    const run = () => {
      const b = Number(baseline.value);
      const maxRR = Math.max(0.5, Math.min(5, 100 / b));
      rr.max = String(Math.floor(maxRR * 10) / 10);
      if (Number(rr.value) > Number(rr.max)) rr.value = rr.max;
      const r = Number(rr.value);
      const newRisk = b * r;
      const delta = newRisk - b;
      setText('#baselineRiskValue', `${b.toFixed(1)}%`);
      setText('#relativeRiskValue', `${r.toFixed(1)}×`);
      setText('#newRisk', `${newRisk.toFixed(1)}%`);
      setText('#absoluteChange', `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pp`);
      setText('#per1000', `${Math.round(newRisk * 10)} / 1000`);
      const bar = $('#riskBar'); if (bar) bar.style.width = `${Math.min(100, newRisk)}%`;
      const note = $('#riskLimitNote');
      if (note) note.hidden = maxRR >= 5;
    };
    baseline.addEventListener('input', run);
    rr.addEventListener('input', run);
    run();
  }

  function initOddsLab() {
    const baseline = $('#oddsBase');
    const or = $('#oddsRatio');
    if (!baseline || !or) return;
    const run = () => {
      const p = Number(baseline.value) / 100;
      const ratio = Number(or.value);
      const odds = p / (1 - p);
      const newOdds = odds * ratio;
      const probability = newOdds / (1 + newOdds);
      setText('#oddsBaseValue', `${(p * 100).toFixed(1)}%`);
      setText('#oddsRatioValue', ratio.toFixed(1));
      setText('#oddsProbability', `${(probability * 100).toFixed(1)}%`);
      const bar = $('#oddsBar'); if (bar) bar.style.width = `${probability * 100}%`;
    };
    baseline.addEventListener('input', run);
    or.addEventListener('input', run);
    run();
  }

  const biasScenarios = [
    { q: { ru:'Исследование связи соцсетей и депрессии набирает участников только через рекламу в Instagram.', en:'A study of social media and depression recruits participants only through Instagram ads.', et:'Sotsiaalmeedia ja depressiooni uuring värbab osalejaid ainult Instagrami reklaamide kaudu.' }, a:'selection', e:{ ru:'Выборка может систематически отличаться от целевой популяции.', en:'The recruited sample may differ systematically from the target population.', et:'Värvatud valim võib sihtpopulatsioonist süstemaatiliselt erineda.' } },
    { q: { ru:'Людей спрашивают через 15 лет, сколько алкоголя они пили каждую неделю в университете.', en:'People are asked 15 years later how much alcohol they drank each week at university.', et:'Inimestelt küsitakse 15 aastat hiljem, kui palju alkoholi nad ülikooli ajal igal nädalal jõid.' }, a:'recall', e:{ ru:'Долгая ретроспектива повышает риск ошибки памяти.', en:'Long retrospective recall increases memory error.', et:'Pikk tagasivaateline meenutamine suurendab mäluvigade riski.' } },
    { q: { ru:'У курящих чаще бывает болезнь, но анализ не учитывает возраст, хотя курящие участники заметно старше.', en:'Smokers have more disease, but the analysis ignores age even though smokers are much older.', et:'Suitsetajatel on haigust rohkem, kuid analüüs ei arvesta vanust, kuigi suitsetajad on palju vanemad.' }, a:'confounding', e:{ ru:'Возраст связан и с группой, и с исходом и может искажать связь.', en:'Age is related to both exposure group and outcome and may distort the association.', et:'Vanus on seotud nii kokkupuute kui tulemusega ja võib seost moonutada.' } },
    { q: { ru:'Две одинаковые группы подбрасывают честную монету по 20 раз и получают немного разные доли орлов.', en:'Two identical groups flip a fair coin 20 times and get slightly different proportions of heads.', et:'Kaks identset rühma viskavad ausat münti 20 korda ja saavad veidi erineva kullide osakaalu.' }, a:'random', e:{ ru:'Небольшая разница может возникнуть из-за случайной вариабельности.', en:'A small difference can arise from random sampling variation.', et:'Väike erinevus võib tekkida juhuslikust varieeruvusest.' } }
  ];
  let biasIndex = 0;
  let biasScore = 0;
  let biasAnswered = false;

  function updateBiasLabels() {
    const map = { selection:'selectionBias', recall:'recallBias', confounding:'confoundingBias', random:'randomError' };
    $$('.game-option[data-bias]').forEach(button => { button.textContent = tr(map[button.dataset.bias]); });
  }

  function renderBias() {
    const box = $('#biasScenario');
    if (!box) return;
    biasIndex %= biasScenarios.length;
    const scenario = biasScenarios[biasIndex];
    box.textContent = scenario.q[lang] || scenario.q.ru;
    biasAnswered = false;
    $$('.game-option[data-bias]').forEach(button => {
      button.disabled = false;
      button.classList.remove('correct', 'wrong');
    });
    setText('#biasFeedback', '');
    setText('#biasScore', `${tr('score')}: ${biasScore} · ${tr('gameProgress')} ${biasIndex + 1} ${tr('ofShort')} ${biasScenarios.length}`);
    updateBiasLabels();
  }

  $$('.game-option[data-bias]').forEach(button => button.addEventListener('click', () => {
    if (biasAnswered) return;
    biasAnswered = true;
    const scenario = biasScenarios[biasIndex];
    const ok = button.dataset.bias === scenario.a;
    if (ok) biasScore += 1;
    $$('.game-option[data-bias]').forEach(option => {
      option.disabled = true;
      option.classList.toggle('correct', option.dataset.bias === scenario.a);
      option.classList.toggle('wrong', option === button && !ok);
    });
    setText('#biasFeedback', `${ok ? tr('correct') : tr('incorrect')}: ${scenario.e[lang] || scenario.e.ru}`);
    setText('#biasScore', `${tr('score')}: ${biasScore} · ${tr('gameProgress')} ${biasIndex + 1} ${tr('ofShort')} ${biasScenarios.length}`);
  }));

  $('#biasNext')?.addEventListener('click', () => {
    biasIndex = (biasIndex + 1) % biasScenarios.length;
    if (biasIndex === 0) biasScore = 0;
    renderBias();
  });

  $('#headlineCheck')?.addEventListener('click', () => {
    const needed = ['baseline', 'population', 'effect', 'design', 'timeframe'];
    const distractors = ['celebrity'];
    const neededHit = needed.filter(id => $(`#h-${id}`)?.checked).length;
    const distractorHit = distractors.filter(id => $(`#h-${id}`)?.checked).length;
    const perfect = neededHit === needed.length && distractorHit === 0;
    setText('#headlineFeedback', `${neededHit}/${needed.length} — ${perfect ? tr('correct') : tr('incorrect')}`);
  });

  function renderFactPage() {
    if (document.body.dataset.page !== 'fact') return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || safeHashId();
    const card = DATA.cards.find(item => item.id === id);
    const mount = $('#factMount');
    if (!mount) return;

    if (!card) {
      mount.innerHTML = `<section class="empty-state fact-empty"><h1>${tr('factNotFound')}</h1><p>${tr('factNotFoundText')}</p><a class="btn primary" href="library.html">${tr('navLibrary')}</a></section>`;
      return;
    }

    const c = cardText(card);
    document.title = `${c.q} — ${tr('brand')}`;
    const title = $('#factTitle'); if (title) title.textContent = c.q;
    const tag = $('#factTag'); if (tag) tag.textContent = c.tag;
    const kicker = $('#factKicker'); if (kicker) kicker.textContent = c.kicker;
    const evidenceEl = $('#factEvidence'); if (evidenceEl) { evidenceEl.textContent = evidence(card.level); evidenceEl.dataset.level = String(card.level); }
    const answer = $('#factAnswer'); if (answer) answer.textContent = c.answer;
    const caveat = $('#factCaveat'); if (caveat) caveat.textContent = c.caveat;
    const design = $('#factDesign'); if (design) design.textContent = c.design;
    const source = $('#factSource'); if (source) { source.href = card.source; source.textContent = `${card.sourceName} ↗`; }
    const share = $('#factShare'); if (share) share.onclick = () => shareCard(card);

    const related = DATA.cards.filter(item => item.id !== card.id && item.category.split(' ').some(cat => card.category.split(' ').includes(cat))).slice(0, 3);
    const relatedGrid = $('#relatedGrid');
    if (relatedGrid) relatedGrid.innerHTML = related.map(item => `<a class="library-item related-item" href="fact.html?id=${encodeURIComponent(item.id)}"><span class="tag">${cardText(item).tag}</span><h3>${cardText(item).q}</h3></a>`).join('');
  }

  const themeButton = $('#themeToggle');
  const storedTheme = safeStorage.get('eto-theme');
  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark');

  function updateThemeButton() {
    if (!themeButton) return;
    const dark = document.body.classList.contains('dark');
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? tr('lightTheme', tr('theme')) : tr('darkTheme', tr('theme')));
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#171715' : '#f4f0e8';
  }

  themeButton?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const dark = document.body.classList.contains('dark');
    safeStorage.set('eto-theme', dark ? 'dark' : 'light');
    updateThemeButton();
  });

  const menuButton = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  function closeMenu() {
    if (!mobileMenu || !menuButton) return;
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton?.addEventListener('click', () => {
    if (!mobileMenu) return;
    const willOpen = mobileMenu.hidden;
    mobileMenu.hidden = !willOpen;
    menuButton.setAttribute('aria-expanded', String(willOpen));
  });
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (!mobileMenu || mobileMenu.hidden || !menuButton) return;
    if (!mobileMenu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });

  $('#languageSelect')?.addEventListener('change', event => {
    const next = event.target.value;
    if (!SUPPORTED_LANGS.includes(next)) return;
    lang = next;
    safeStorage.set('eto-lang', lang);
    applyI18n();
    renderCards();
    renderLibrary();
    renderGlossary();
    renderBias();
    renderFactPage();
  });

  applyI18n();
  renderCards();
  renderLibrary();
  renderGlossary();
  initRiskLab();
  initOddsLab();
  renderBias();
  renderFactPage();
  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();
})();
