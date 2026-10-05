(() => {
  const D = window.ETO_DATA;
  if (!D?.ui) return;
  const extra = {
    ru: {
      skip:'Перейти к содержанию', primaryNav:'Основная навигация', mobileNav:'Мобильное меню', bottomNav:'Нижняя навигация',
      cardStat:'карточек', languageStat:'языка', modeStat:'режима обучения', interactive:'Интерактив', previewText:'Относительная мера не является абсолютной вероятностью.', tryLab:'Открыть лабораторию →',
      pathRiskTitle:'Лаборатория риска', pathRiskText:'От относительного к абсолютному риску', pathBiasTitle:'Детектив искажений', pathBiasText:'Находи проблемы дизайна', pathHeadlineTitle:'Разбор заголовков', pathHeadlineText:'Проверяй медицинские заявления', pathGlossaryTitle:'Словарь', pathGlossaryText:'Освой язык доказательств',
      searchLabel:'Поиск по библиотеке', categoryLabel:'Категория', glossarySearchLabel:'Поиск по словарю',
      selectionBias:'Selection bias · отбор', recallBias:'Recall bias · память', confoundingBias:'Confounding · смешение', randomError:'Случайная ошибка',
      headlineScenario:'«Новое исследование: кофе снижает риск болезни на 40%»', baselineRiskInfo:'Исходный риск', populationInfo:'Кого изучали', effectInfo:'Размер эффекта + неопределённость', designInfo:'Дизайн исследования', timeframeInfo:'Период наблюдения', celebrityInfo:'Мнение известного человека',
      riskLimit:'При таком исходном риске больший RR дал бы математически невозможный риск >100%; диапазон ограничен.',
      backLibrary:'← В библиотеку', factEyebrow:'РАЗБОР ФАКТА', factNotFound:'Карточка не найдена.', factNotFoundText:'Возможно, ссылка устарела. Открой библиотеку и выбери материал там.', related:'Продолжить изучение', caveatLabel:'Ограничения',
      menuClose:'Закрыть меню', darkTheme:'Тёмная тема', lightTheme:'Светлая тема', correctAnswer:'Правильный ответ', yourAnswer:'Ваш ответ',
      noscript:'Для интерактивов нужен JavaScript. Источники и базовая структура сайта остаются доступны, но упражнения работать не будут.',
      gameProgress:'Задание', ofShort:'из'
    },
    en: {
      skip:'Skip to content', primaryNav:'Primary navigation', mobileNav:'Mobile menu', bottomNav:'Bottom navigation',
      cardStat:'cards', languageStat:'languages', modeStat:'learning modes', interactive:'Interactive', previewText:'A relative measure is not an absolute probability.', tryLab:'Open the lab →',
      pathRiskTitle:'Risk Lab', pathRiskText:'From relative to absolute risk', pathBiasTitle:'Bias Detective', pathBiasText:'Spot design problems', pathHeadlineTitle:'Headline Lab', pathHeadlineText:'Interrogate medical claims', pathGlossaryTitle:'Glossary', pathGlossaryText:'Learn the language of evidence',
      searchLabel:'Search the library', categoryLabel:'Category', glossarySearchLabel:'Search the glossary',
      selectionBias:'Selection bias', recallBias:'Recall bias', confoundingBias:'Confounding', randomError:'Random error',
      headlineScenario:'“New study: coffee cuts disease risk by 40%”', baselineRiskInfo:'Baseline risk', populationInfo:'Population studied', effectInfo:'Effect estimate + uncertainty', designInfo:'Study design', timeframeInfo:'Follow-up period', celebrityInfo:'Celebrity opinion',
      riskLimit:'At this baseline risk, a larger RR would imply an impossible risk above 100%; the range has been limited.',
      backLibrary:'← Back to library', factEyebrow:'FACT DEEP DIVE', factNotFound:'Card not found.', factNotFoundText:'The link may be outdated. Open the library and choose the material there.', related:'Keep learning', caveatLabel:'Limitations',
      menuClose:'Close menu', darkTheme:'Dark theme', lightTheme:'Light theme', correctAnswer:'Correct answer', yourAnswer:'Your answer',
      noscript:'Interactive features require JavaScript. Sources and the basic site structure remain available, but exercises will not work.',
      gameProgress:'Question', ofShort:'of'
    },
    et: {
      skip:'Liigu sisu juurde', primaryNav:'Põhinavigatsioon', mobileNav:'Mobiilimenüü', bottomNav:'Alumine navigatsioon',
      cardStat:'kaarti', languageStat:'keelt', modeStat:'õpperežiimi', interactive:'Interaktiiv', previewText:'Suhteline mõõdik ei ole absoluutne tõenäosus.', tryLab:'Ava labor →',
      pathRiskTitle:'Riskilabor', pathRiskText:'Suhtelisest riskist absoluutseks', pathBiasTitle:'Kallutatuse detektiiv', pathBiasText:'Leia uuringudisaini probleemid', pathHeadlineTitle:'Pealkirjalabor', pathHeadlineText:'Kontrolli meditsiiniväiteid', pathGlossaryTitle:'Sõnastik', pathGlossaryText:'Õpi tõendusmaterjali keelt',
      searchLabel:'Otsi teegist', categoryLabel:'Kategooria', glossarySearchLabel:'Otsi sõnastikust',
      selectionBias:'Selection bias · valikukallutatus', recallBias:'Recall bias · meenutamisviga', confoundingBias:'Confounding · segav tegur', randomError:'Juhuslik viga',
      headlineScenario:'„Uus uuring: kohv vähendab haiguse riski 40%“', baselineRiskInfo:'Algrisk', populationInfo:'Uuritud populatsioon', effectInfo:'Mõju hinnang + ebakindlus', designInfo:'Uuringudisain', timeframeInfo:'Jälgimisperiood', celebrityInfo:'Kuulsuse arvamus',
      riskLimit:'Selle algriski juures annaks suurem RR matemaatiliselt võimatu riski üle 100%; vahemik on piiratud.',
      backLibrary:'← Tagasi teeki', factEyebrow:'FAKTI SÜVAANALÜÜS', factNotFound:'Kaarti ei leitud.', factNotFoundText:'Link võib olla aegunud. Ava teek ja vali materjal sealt.', related:'Jätka õppimist', caveatLabel:'Piirangud',
      menuClose:'Sulge menüü', darkTheme:'Tume teema', lightTheme:'Hele teema', correctAnswer:'Õige vastus', yourAnswer:'Sinu vastus',
      noscript:'Interaktiivsed funktsioonid vajavad JavaScripti. Allikad ja saidi põhistruktuur jäävad kättesaadavaks, kuid harjutused ei tööta.',
      gameProgress:'Küsimus', ofShort:'/'
    }
  };
  for (const lang of ['ru','en','et']) Object.assign(D.ui[lang], extra[lang]);
  if (!document.querySelector('script[data-site-nav]')) {
    const s=document.createElement('script');s.src='site-nav.js';s.defer=true;s.dataset.siteNav='1';document.head.appendChild(s);
  }
  if (!document.querySelector('script[data-static-share]')) {
    const s=document.createElement('script');s.src='share-patch.js';s.defer=true;s.dataset.staticShare='1';document.head.appendChild(s);
  }
})();