(() => {
  'use strict';
  const { locales: l } = window.ETO_EXPERIENCE_DATA;
  window.ETO_DIAGNOSTIC = [
    {
      id: 'risk', skills: ['absolute-risk', 'relative-risk'], right: 1,
      question: l('Частота выросла с 2 до 4 случаев на 1000. Как изменился риск?', 'Incidence rose from 2 to 4 cases per 1,000. How did risk change?', 'Esinemissagedus tõusis 2 juhult 4 juhule 1000 kohta. Kuidas risk muutus?'),
      options: [l('На 2 процентных пункта', 'Up 2 percentage points', 'Kasvas 2 protsendipunkti'), l('Вдвое, на 2 случая на 1000', 'Doubled, up 2 cases per 1,000', 'Kahekordistus, lisandus 2 juhtu 1000 kohta'), l('На 4 случая на 1000', 'Up 4 cases per 1,000', 'Lisandus 4 juhtu 1000 kohta')]
    },
    {
      id: 'confounding', skills: ['causality', 'bias'], right: 2,
      question: l('Любители кофе чаще сообщают о бессоннице. Что стоит проверить перед причинным выводом?', 'Coffee drinkers report insomnia more often. What should you check before drawing a causal conclusion?', 'Kohvijoojad teatavad sagedamini unetusest. Mida kontrollida enne põhjuslikku järeldust?'),
      options: [l('Только число участников', 'Only the sample size', 'Ainult valimi suurust'), l('Только среднее число чашек', 'Only the average number of cups', 'Ainult tasside keskmist arvu'), l('Связана ли ночная работа и с кофе, и со сном', 'Whether night shifts are linked to both coffee intake and sleep', 'Kas öötöö on seotud nii kohvi tarvitamise kui ka unega')]
    },
    {
      id: 'trial', skills: ['uncertainty', 'study-design'], right: 0,
      question: l('В рандомизированном исследовании интервал для разницы рисков включает ноль. Что можно заключить?', 'In a randomised trial the interval for the risk difference includes zero. What can you conclude?', 'Juhuslikustatud uuringus hõlmab riskierinevuse vahemik nulli. Mida saab järeldada?'),
      options: [l('Данные совместимы с нулевой разницей и с ненулевыми значениями внутри интервала', 'The data are compatible with zero difference and with nonzero values within the interval', 'Andmed sobivad nii nullerinevuse kui ka vahemikus olevate nullist erinevate väärtustega'), l('Доказано отсутствие эффекта', 'The trial proves there is no effect', 'Uuring tõestab mõju puudumist'), l('Рандомизация устраняет неопределённость', 'Randomisation removes uncertainty', 'Juhuslikustamine kõrvaldab ebakindluse')]
    },
    {
      id: 'base-rate', skills: ['bayesian'], right: 2,
      question: l('Среди 1000 человек 10 имеют состояние. Тест выявил 9 из них и дал 50 ложноположительных результатов. Какая доля положительных результатов истинная?', 'Of 1,000 people, 10 have a condition. A test detects 9 of them and gives 50 false positives. What fraction of positive results are true positives?', '1000 inimesest on seisund 10 inimesel. Test tuvastab neist 9 ja annab 50 valepositiivset tulemust. Kui suur osa positiivsetest tulemustest on õiged?'),
      options: [l('9 из 10', '9 out of 10', '9 kümnest'), l('9 из 1000', '9 out of 1,000', '9 tuhandest'), l('9 из 59', '9 out of 59', '9 59-st')]
    },
    {
      id: 'interview', skills: ['clinical'], right: 1,
      question: l('Человек говорит: «Память стала хуже». Какой первый вопрос даст больше информации?', 'Someone says, “My memory has got worse.” Which first question gives more useful information?', 'Keegi ütleb: „Mu mälu on halvenenud.” Milline avaküsimus annab rohkem teavet?'),
      options: [l('Это потому, что ты плохо спишь?', 'Is it because you sleep poorly?', 'Kas see on sellepärast, et magad halvasti?'), l('Что именно изменилось и когда ты это заметил?', 'What changed, and when did you notice it?', 'Mis täpselt muutus ja millal sa seda märkasid?'), l('Ты уверен, что это деменция?', 'Are you sure this is dementia?', 'Kas oled kindel, et see on dementsus?')]
    }
  ];
})();
