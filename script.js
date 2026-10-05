const revealButtons = document.querySelectorAll('.reveal-button');
revealButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.target);
    if (!target) return;
    const willOpen = target.hasAttribute('hidden');
    target.toggleAttribute('hidden');
    button.textContent = willOpen ? 'Скрыть ответ' : 'Показать ответ';
    button.setAttribute('aria-expanded', String(willOpen));
  });
});

const factCards = [...document.querySelectorAll('.fact-card')];
const answered = new Set();
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const resetAll = document.getElementById('resetAll');

function updateProgress() {
  const total = factCards.length;
  const count = answered.size;
  if (progressText) progressText.textContent = `Отвечено ${count} из ${total}`;
  if (progressBar) progressBar.style.width = total ? `${(count / total) * 100}%` : '0%';
}

function resetCard(card) {
  card.querySelectorAll('.choice').forEach((choice) => {
    choice.disabled = false;
    choice.classList.remove('correct', 'wrong');
    choice.removeAttribute('aria-pressed');
  });
  const feedback = card.querySelector('.feedback');
  if (feedback) feedback.hidden = true;
  const retry = card.querySelector('.retry-button');
  if (retry) retry.hidden = true;
  answered.delete(card.id);
  updateProgress();
}

factCards.forEach((card) => {
  const choices = card.querySelectorAll('.choice');
  const feedback = card.querySelector('.feedback');
  const retry = card.querySelector('.retry-button');

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      choices.forEach((item) => {
        item.disabled = true;
        item.classList.remove('correct', 'wrong');
        item.setAttribute('aria-pressed', String(item === choice));
        if (item.dataset.answer === 'right') item.classList.add('correct');
      });

      if (choice.dataset.answer === 'wrong') choice.classList.add('wrong');
      if (feedback) feedback.hidden = false;
      if (retry) retry.hidden = false;
      answered.add(card.id);
      updateProgress();
    });
  });

  retry?.addEventListener('click', () => resetCard(card));
});

resetAll?.addEventListener('click', () => {
  factCards.forEach(resetCard);
  document.getElementById('facts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const filters = document.querySelectorAll('.filter');
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    filters.forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-pressed', 'false');
    });
    filter.classList.add('active');
    filter.setAttribute('aria-pressed', 'true');

    const category = filter.dataset.filter;
    factCards.forEach((card) => {
      const matches = category === 'all' || card.dataset.category.split(' ').includes(category);
      card.style.display = matches ? 'flex' : 'none';
    });
  });
});

const themeToggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('eto-slozhnee-theme');
if (storedTheme === 'dark') document.body.classList.add('dark');
if (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark');

themeToggle?.setAttribute('aria-pressed', String(document.body.classList.contains('dark')));
themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('eto-slozhnee-theme', isDark ? 'dark' : 'light');
  themeToggle.setAttribute('aria-pressed', String(isDark));
});

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav?.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
});
mainNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const toast = document.getElementById('toast');
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

document.querySelectorAll('.share-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const card = button.closest('.fact-card');
    if (!card) return;
    const title = card.querySelector('h3')?.textContent?.trim() || 'Это сложнее';
    const url = `${location.origin}${location.pathname}#${card.id}`;
    const payload = { title: 'Это сложнее', text: title, url };

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Ссылка скопирована');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Не удалось поделиться');
    }
  });
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

updateProgress();

if (location.hash) {
  const target = document.querySelector(location.hash);
  if (target?.classList.contains('fact-card')) {
    setTimeout(() => target.scrollIntoView({ block: 'center' }), 100);
  }
}
