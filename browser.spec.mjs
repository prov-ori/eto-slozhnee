import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const facts = fs.readdirSync('facts').filter(name => name.endsWith('.html')).map(name => 'facts/' + name);
const mounts = {
  'index.html':'#factsGrid article', 'learn.html':'#courseGrid article', 'explore.html':'[data-section-nav]',
  'practice.html':'.experience-grid a', 'progress.html':'.skill-card', 'daily.html':'.daily-option',
  'library.html':'#libraryGrid article', 'concepts.html':'#conceptMount article', 'books.html':'#bookMount article',
  'atlas.html':'#atlasMount article','connections.html':'#connectionMount article','map.html':'#knowledgeMap button',
  'glossary.html':'#glossaryGrid > *','games.html':'#biasScenario','labs.html':'#attentionBegin',
  'simulator.html':'.sim-option','cases.html':'.case-option','workshop.html':'#routeGrid article',
  'method.html':'main h1'
};
test.beforeEach(async ({page}) => {
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.abort());
  page.setDefaultTimeout(6500);
});

test('all pages load within their viewport, switch locale and share the five primary links', async ({page, isMobile}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:') && response.status() >= 400) errors.push(response.url());
  });
  for (const [file, mount] of [...Object.entries(mounts), ...facts.map(file => [file, '#factTitle'])]) {
    await page.goto(file);
    await expect(page.locator(mount).first(), file).toBeVisible();
    const nav = page.locator(isMobile ? '.bottom-nav' : '.desktop-nav');
    await expect(nav.locator('a')).toHaveCount(5);
    for (const lang of ['en','et','ru']) {
      await page.locator('#languageSelect').selectOption(lang);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(nav.locator('a').nth(2)).toHaveAccessibleName({en:'Explore',et:'Uuri',ru:'Исследовать'}[lang]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), file+' '+lang).toBeLessThanOrEqual(1);
      const overhang = await page.locator('.header-actions').evaluate(el => el.getBoundingClientRect().right - innerWidth);
      expect(overhang, file+' header '+lang).toBeLessThanOrEqual(1);
    }
    await expect(page.locator('footer [data-method-link]')).toHaveText('Метод');
  }
  if (isMobile) {
    await page.locator('#menuToggle').click();
    await expect(page.locator('#mobileMenu a')).toHaveCount(5);
    await page.locator('#mobileMenu').getByText('Практика').click();
    await expect(page).toHaveURL(/practice\.html$/);
  }
  expect(errors).toEqual([]);
});

test('diagnostic chooses a route and lesson deep links survive navigation and language changes', async ({page}) => {
  await page.goto('learn.html#diagnostic');
  const quiz = page.locator('[data-diagnostic]');
  await quiz.getByRole('button').click();
  for (const answer of [0,2,0,2,1]) {
    await quiz.locator(`input[value="${answer}"]`).check();
    await quiz.getByRole('button', {name:'Дальше'}).click();
  }
  await expect(quiz.locator('li')).toHaveCount(1);
  await quiz.getByRole('link', {name:'Абсолютный риск'}).click();
  await expect(page).toHaveURL(/course=risk-basics&lesson=relative-absolute/);
  await page.locator('.lesson-tab').nth(1).click();
  await expect(page).toHaveURL(/lesson=odds-ratio/);
  await page.reload();
  await expect(page.locator('.lesson-tab').nth(1)).toHaveAttribute('aria-current','step');
  await page.locator('#languageSelect').selectOption('et');
  await expect(page.locator('.lesson-tab').nth(1)).toHaveAttribute('aria-current','step');
  await page.goto('daily.html');
  await expect(page.locator('[data-today] a').first()).toHaveAttribute('href', /lesson=odds-ratio/);
  await page.locator('.daily-option').first().click();
  await expect(page.locator('.daily-explanation')).toBeVisible();
});

test('search covers five content types from a nested fact URL', async ({page}) => {
  await page.goto('facts/alcohol-withdrawal.html');
  await page.locator('#languageSelect').selectOption('en');
  await page.getByRole('button',{name:'Search', exact:true}).click();
  const dialog = page.getByRole('dialog');
  for (const [query,type] of [['alcohol-withdrawal','Fact'],['hallucination','Concept'],['odds-ratio','Lesson'],['Oxford','Book'],['risk lab','Practice']]) {
    await dialog.getByRole('searchbox').fill(query);
    await expect(dialog.locator('[data-search-results] a').filter({has:page.getByText(type,{exact:true})}).first()).toBeVisible();
  }
  await dialog.getByRole('searchbox').fill('alcohol-withdrawal');
  await dialog.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/eto-slozhnee\/facts\/alcohol-withdrawal\.html$/);
});

test('old links, sharing, bookmarks, due review and backup work end to end', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {configurable:true, value:data => { window.shared = data; return Promise.resolve(); }});
  });
  await page.goto('fact.html?id=alcohol-withdrawal');
  await expect(page).toHaveURL(/\/facts\/alcohol-withdrawal\.html$/);
  await expect(page.locator('.safety-box')).toBeVisible();
  await expect(page.locator('time')).toHaveAttribute('datetime', /\d{4}-\d\d-\d\d/);
  await page.locator('#factShare').click();
  expect(await page.evaluate(() => window.shared.url)).toMatch(/\/eto-slozhnee\/facts\/alcohol-withdrawal\.html$/);
  await page.locator('#factBookmark button').click();
  await page.evaluate(() => {
    const L = window.ETO_LEARNING;
    const p = L.read();
    p.cards['alcohol-withdrawal'] = {attempts:1, correct:1, nextReview:1};
    p.workshop.notes.receptors = 'My example';
    L.write(p);
  });
  await page.goto('daily.html');
  await page.locator('[data-today] a[href$="#review"]').click();
  await expect(page.locator('#review')).toBeVisible();
  await page.locator('#review .choice').first().click();
  if (await page.locator('[data-q="4"]').count()) await page.locator('[data-q="4"]').click();
  await page.goto('progress.html');
  await expect(page.locator('.skill-card')).toHaveCount(8);
  await expect(page.locator('[data-saved] a[href="facts/alcohol-withdrawal.html"]')).toHaveCount(2);
  const data = await page.evaluate(() => window.ETO_LEARNING.exportProgress());
  const download = page.waitForEvent('download');
  await page.getByRole('button',{name:'Скачать прогресс'}).click();
  expect((await download).suggestedFilename()).toBe('eto-progress.json');
  await page.evaluate(() => window.ETO_LEARNING.clear());
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-backup] input').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(data)});
  await expect(page.locator('[data-backup] [role="status"]')).toHaveText('Данные восстановлены.');
  await expect(page.locator('[data-saved] a[href="facts/alcohol-withdrawal.html"]')).toHaveCount(2);
  await page.goto('workshop.html?topic=receptors');
  await expect(page.locator('#readingNote')).toHaveValue('My example');
  await page.goto('academy.html');
  await expect(page).toHaveURL(/learn\.html$/);
});

test('practice interactions work in every interactive section', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('games.html');
  await page.locator('#baselineRisk').fill('8');
  await expect(page.locator('#newRisk')).not.toBeEmpty();
  await page.locator('#oddsRatio').fill('3');
  await expect(page.locator('#oddsProbability')).not.toBeEmpty();
  await page.locator('[data-bias]').first().click();
  await expect(page.locator('#biasFeedback')).not.toBeEmpty();
  await page.locator('#biasNext').click();
  await page.locator('#h-baseline').check();
  await page.locator('#headlineCheck').click();
  await expect(page.locator('#headlineFeedback')).not.toBeEmpty();
  await page.goto('labs.html');
  await page.locator('#memoryStart').click();
  await page.locator('#attentionBegin').click();
  for(let i=0;i<9;i++) await page.locator('#attentionTask button[data-color]').first().click();
  await expect(page.locator('#attentionRestart')).toBeVisible();
  await page.locator('#frameRR').fill('3');
  await expect(page.locator('#frameOutput')).not.toBeEmpty();
  await page.locator('#wHealth').fill('20');
  await expect(page.locator('#mcdaOutput .mcda-row')).toHaveCount(3);
  await page.goto('cases.html');
  await page.locator('.case-option').first().click();
  await expect(page.locator('.case-feedback')).not.toBeEmpty();
  await page.locator('#caseNext').click();
  await page.goto('simulator.html');
  for(let i=0;i<4;i++){
    await page.locator('.sim-option').first().click();
    await page.locator('#simNext').click();
  }
  await expect(page.locator('.profile-row')).toHaveCount(4);
  await page.goto('workshop.html?topic=interview');
  await page.locator('[data-answer]').first().click();
  await expect(page.locator('.route-feedback')).not.toBeEmpty();
  await page.locator('#prevalence').fill('12');
  await expect(page.locator('#frequencyOutput .model-result strong')).not.toBeEmpty();
  await page.locator('#concentration').fill('8');
  await expect(page.locator('#receptorOutput .receptor-meter')).toHaveCount(2);
  for(const name of ['bayesian','consequences','interview']){
    const lab=page.locator('#'+name+'Lab');
    await lab.locator('[data-option]').first().click();
    await expect(lab.locator('[role="status"]')).not.toBeEmpty();
    await lab.locator('[data-next]').click();
  }
  expect(errors).toEqual([]);
});

test('all indexed lessons open directly and record their checkpoint', async ({page}) => {
  const index = JSON.parse(fs.readFileSync('search-index.json','utf8'));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const {href,title} of index.filter(item=>item.type==='lesson')) {
    await page.goto(href);
    await expect(page.locator('.lesson-panel h2')).toHaveText(title.ru);
    const id = new URL(href,'https://test.invalid').searchParams.get('lesson');
    await page.locator('.checkpoint-choice[data-id="'+id+'"]').click();
    await expect(page.locator('.checkpoint-feedback')).toContainText('Проверка пройдена');
  }
  expect(errors).toEqual([]);
});

test('Explore filters and opens deep-linked references on mobile and desktop', async ({page}) => {
  await page.goto('library.html');
  await page.locator('#librarySearch').fill('алкогол');
  await expect(page.locator('#libraryGrid a[href="facts/alcohol-withdrawal.html"]')).toBeVisible();
  await page.goto('glossary.html');
  await page.locator('#glossarySearch').fill('риск');
  await expect(page.locator('#glossaryGrid > *').first()).toBeVisible();
  await page.goto('concepts.html#hallucination');
  await expect(page.locator('#hallucination .safety-box')).toBeVisible();
  await page.locator('#hallucination [data-concept-bookmark] button').click();
  await page.goto('books.html#book-1');
  await page.locator('#book-1 [data-book-bookmark] button').click();
  await page.goto('map.html');
  await page.locator('[data-id="absolute-risk"]').click();
  await expect(page.locator('#mapDetail a[href="facts/relative-absolute.html"]')).toBeVisible();
  await page.goto('explore.html');
  await expect(page.locator('[data-saved] a[href="books.html#book-1"]')).toHaveCount(2);
  await expect(page.locator('[data-saved] a[href="concepts.html#hallucination"]')).toHaveCount(2);
});
