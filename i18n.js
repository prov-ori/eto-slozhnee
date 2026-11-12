(() => {
  'use strict';
  const languages = ['ru', 'en', 'et'];
  const key = 'eto-lang';
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  let language = languages.includes(saved) ? saved : languages.includes(browser) ? browser : 'ru';

  function set(next) {
    if (!languages.includes(next) || next === language) return;
    language = next;
    try { localStorage.setItem(key, language); } catch {}
    window.dispatchEvent(new Event('eto:language'));
  }

  function pick(value, fallback = '') {
    return value?.[language] ?? value?.ru ?? fallback;
  }

  function translate(dictionary, name, fallback = '') {
    return pick({ ru: dictionary.ru?.[name], en: dictionary.en?.[name], et: dictionary.et?.[name] }, fallback);
  }

  function bind(root = document) {
    document.documentElement.lang = language;
    const select = root.querySelector('#languageSelect');
    if (!select) return;
    select.value = language;
    select.addEventListener('change', () => set(select.value));
    window.addEventListener('eto:language', () => {
      document.documentElement.lang = language;
      select.value = language;
    });
  }

  window.ETO_I18N = { languages, get: () => language, set, pick, translate, bind };
})();
