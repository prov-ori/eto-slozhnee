(() => {
  'use strict';
  const E = window.ETO_EXPERIENCE_DATA;
  const editions = {
    fact: '2026-10-05', concept: '2026-10-05', lesson: '2026-10-05',
    book: '2026-10-05', workshop: '2026-10-05'
  };
  const clinicalConcepts = new Set(['hallucination', 'delusion', 'differential-reasoning', 'mechanism-clinical']);
  const clinicalCourses = new Set(['clinical-reasoning', 'psychopathology-foundations', 'psychopharm-principles']);
  const substanceModules = new Set(['consequences', 'receptors']);

  function safetyFor(type, item) {
    if (type === 'fact') {
      if (item.id === 'alcohol-withdrawal') return 'withdrawalSafety';
      if (item.id === 'cannabis-psychosis') return 'clinicalSafety';
      if (item.category.split(' ').includes('substances')) return 'substanceSafety';
    }
    if (type === 'concept' && clinicalConcepts.has(item.id)) return 'clinicalSafety';
    if (type === 'lesson' && clinicalCourses.has(item.course)) return 'clinicalSafety';
    if (type === 'lesson' && item.course === 'substances') return 'substanceSafety';
    if (type === 'workshop' && ['thoughts', 'interview'].includes(item.id)) return 'clinicalSafety';
    if (type === 'workshop' && substanceModules.has(item.id)) return 'substanceSafety';
    return '';
  }

  const safetySources = {
    withdrawalSafety: ['ASAM', 'https://www.asam.org/quality-care/clinical-guidelines/alcohol-withdrawal-management-guideline'],
    clinicalSafety: ['NIMH · Understanding Psychosis', 'https://www.nimh.nih.gov/health/publications/understanding-psychosis']
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  function render(type, item, lang) {
    const t = key => escape(E.labels[key][lang]);
    const localized = item[lang];
    const source = type === 'fact' ? localized.design : type === 'book' ? item.formatLabel[lang] : E.labels.editorial[lang];
    const confidence = type === 'fact'
      ? `<strong>${escape(window.ETO_DATA.ui[lang][`level${item.level}`])}</strong> · ${escape(localized.caveat)}`
      : t(type === 'book' ? 'bookConfidence' : 'ungraded');
    const updated = item.updated ?? editions[type];
    const date = new Intl.DateTimeFormat(lang, {dateStyle:'medium', timeZone:'UTC'}).format(new Date(updated));
    const safety = safetyFor(type, item);
    const ref = safetySources[safety];
    return `<dl class="evidence-details">
      <dt>${t('updated')}</dt><dd><time datetime="${escape(updated)}">${escape(date)}</time></dd>
      <dt>${t('sourceType')}</dt><dd>${escape(source)}</dd>
      <dt>${t('confidence')}</dt><dd>${confidence}</dd>
    </dl>${safety ? `<aside class="safety-box"><strong>${t('safety')}</strong><p>${t(safety)}</p>${ref ? `<a href="${ref[1]}">${ref[0]}</a>` : ''}</aside>` : ''}`;
  }
  window.ETO_MATERIALS = { render, escape, safetyFor };
})();
