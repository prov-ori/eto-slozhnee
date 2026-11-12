import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const languages = ['ru','en','et'];
const context = vm.createContext({window:{}});
const files = ['data.js','extras.js','experience-data.js','diagnostic-data.js','academy-data.js','knowledge-courses.js',
  'knowledge-data.js','workshop-data.js','workshop-activities.js','bayes-exercises.js','book-guides.js'];
for (const file of files) vm.runInContext(fs.readFileSync(file,'utf8'), context, {filename:file});

const {ETO_DATA:D, ETO_ACADEMY:A, ETO_KNOWLEDGE:K, ETO_WORKSHOP:W, ETO_EXPERIENCE_DATA:E} = context.window;
const issues = [];
function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function check(value, path) {
  if (value === null || typeof value !== 'object') return;
  const keys = Object.keys(value);
  if (keys.some(key => languages.includes(key))) {
    for (const lang of languages) {
      if (value[lang] === undefined || (typeof value[lang] === 'string' && !nonempty(value[lang]))) issues.push(path+'.'+lang);
    }
    if (value.ru && typeof value.ru === 'object') {
      for (const key of new Set(languages.flatMap(lang => Object.keys(value[lang] || {})))) {
        for (const lang of languages) {
          if (!Object.hasOwn(value[lang] || {}, key)) issues.push(path+'.'+lang+'.'+key);
        }
      }
    }
  }
  for (const key of keys) check(value[key], path+'.'+key);
}
for (const [key,value] of Object.entries(context.window)) check(value,key);

const workshopCode = fs.readFileSync('workshop.js','utf8');
const workshopKeys = new Set([...workshopCode.slice(workshopCode.indexOf('const words'),workshopCode.indexOf('let lang')).matchAll(/\b(\w+):t\(/g)].map(match=>match[1]));
const labsCode = fs.readFileSync('knowledge-labs.js','utf8');
const labsKeys = [...labsCode.matchAll(/(?:ru|en|et):\{([^}]+)\}/g)].slice(0,3).map(match=>new Set([...match[1].matchAll(/(\w+):'/g)].map(m=>m[1])));
const directories = ['.', 'facts'];
for (const dir of directories) for (const name of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))) {
  const source = fs.readFileSync(dir+'/'+name,'utf8');
  for (const [,type,key] of source.matchAll(/data-(i18n|a18n|k18n|l18n|w18n|experience)(?:-placeholder|-aria)?="([^"]+)"/g)) {
    const dictionary = {i18n:D.ui, a18n:A.ui, k18n:K.ui}[type];
    if (dictionary && !languages.every(lang=>nonempty(dictionary[lang][key]))) issues.push(name+': '+type+'.'+key);
    if (type==='experience' && !languages.every(lang=>nonempty(E.labels[key]?.[lang]))) issues.push(name+': '+type+'.'+key);
    if (type==='w18n' && !workshopKeys.has(key)) issues.push(name+': '+type+'.'+key);
    if (type==='l18n' && !labsKeys.every(keys=>keys.has(key))) issues.push(name+': '+type+'.'+key);
  }
}
assert.ok(!issues.length, 'Missing translations:\n'+[...new Set(issues)].join('\n'));
assert.ok(W.modules.length);
console.log('RU/EN/ET translation coverage checked.');
