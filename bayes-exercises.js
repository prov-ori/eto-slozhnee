(() => {
  'use strict';
  const {locales:l} = window.ETO_EXPERIENCE_DATA;
  const items = [
    {
      id:'signal-denominator', right:1,
      q:l('Детектор дал 12 верных и 18 ложных сигналов. Какова доля верных сигналов?', 'A detector gives 12 true and 18 false alerts. What fraction of alerts are true?', 'Detektor annab 12 õiget ja 18 valehäiret. Kui suur osa häiretest on õiged?'),
      options:[l('12/18','12/18','12/18'),l('12/30','12/30','12/30'),l('18/30','18/30','18/30')],
      why:l('В знаменателе все 30 сигналов, включая ложные.', 'The denominator is all 30 alerts, including false alerts.', 'Nimetajas on kõik 30 häiret, sealhulgas valehäired.')
    },
    {
      id:'lower-prevalence', right:0,
      q:l('Детектор тот же, но дефекты стали реже. Что обычно происходит с долей дефектов среди сигналов?', 'The detector is unchanged, but defects become rarer. What usually happens to the fraction of alerts that indicate a defect?', 'Detektor jääb samaks, kuid defekte on vähem. Mis tavaliselt juhtub defektide osakaaluga häirete seas?'),
      options:[l('Уменьшается','It falls','Väheneb'),l('Увеличивается','It rises','Suureneb'),l('Остаётся прежней','It stays the same','Jääb samaks')],
      why:l('При ненулевой доле ложных сигналов меньшая базовая частота снижает долю верных сигналов.', 'With a nonzero false-alert rate, a lower base rate reduces the proportion of true alerts.', 'Kui valehäirete määr on nullist suurem, vähendab madalam baassagedus õigete häirete osakaalu.')
    },
    {
      id:'missed-defects', right:2,
      q:l('Из 40 дефектных деталей детектор нашёл 30. Что описывает 30/40?', 'A detector catches 30 of 40 defective parts. What does 30/40 describe?', 'Detektor leiab 40 defektsest detailist 30. Mida kirjeldab 30/40?'),
      options:[l('Долю дефектов среди сигналов','The proportion of defects among alerts','Defektide osakaalu häirete seas'),l('Долю ложных сигналов','The false alert rate','Valehäirete määra'),l('Чувствительность','Sensitivity','Tundlikkust')],
      why:l('Знаменатель — все детали с дефектом. Для доли верных сигналов нужен другой знаменатель.', 'The denominator is all defective parts. The proportion of true alerts uses a different denominator.', 'Nimetajas on kõik defektsed detailid. Õigete häirete osakaalul on teine nimetaja.')
    }
  ];
  window.ETO_BAYES_EXERCISES = items;
})();
