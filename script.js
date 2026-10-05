const revealButtons = document.querySelectorAll('.reveal-button');
revealButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.target);
    if (!target) return;
    const willOpen = target.hasAttribute('hidden');
    target.toggleAttribute('hidden');
    button.textContent = willOpen ? 'Скрыть ответ' : 'Показать ответ';
  });
});

const factCards = document.querySelectorAll('.fact-card');
factCards.forEach((card) => {
  const choices = card.querySelectorAll('.choice');
  const feedback = card.querySelector('.feedback');

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      choices.forEach((item) => {
        item.disabled = true;
        item.classList.remove('correct', 'wrong');
        if (item.dataset.answer === 'right') item.classList.add('correct');
      });

      if (choice.dataset.answer === 'wrong') choice.classList.add('wrong');
      if (feedback) feedback.hidden = false;
    });
  });
});

const filters = document.querySelectorAll('.filter');
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    filters.forEach((item) => item.classList.remove('active'));
    filter.classList.add('active');

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

themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('eto-slozhnee-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
