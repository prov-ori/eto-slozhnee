import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function browserScripts(...files){const c={window:{}};vm.createContext(c);for(const file of files)vm.runInContext(source(file),c,{filename:file});return c.window}
const source=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
function core(initial={}){
 const data=new Map(Object.entries(initial));
 const context={window:{dispatchEvent(){}},navigator:{language:'en'},CustomEvent:class{},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
 vm.createContext(context);vm.runInContext(source('learning-core.js'),context);
 return {api:context.window.ETO_LEARNING,data};
}
test('correct but difficult recall remains a correct answer',()=>{
 const {api}=core();const result=api.qualitySchedule('card',3);
 assert.equal(result.correct,1);assert.equal(result.lastCorrect,true);assert.equal(result.interval,1);
 const next=api.qualitySchedule('card',4);assert.equal(next.interval,3);
 api.qualitySchedule('card',1);assert.equal(api.read().cards.card.repetitions,0);
 assert.match(source('review.js'),/data-q="3"/);
});
test('malformed local progress cannot break reads, reviews or lesson updates',()=>{
 for(const raw of ['null','[]','{','{"cards":{"bad":null},"courses":{"bad":null},"daily":true}','{"cards":[],"courses":3,"meta":true}']){
 const {api}=core({'eto-learning-progress-v2':raw});
 assert.doesNotThrow(()=>{api.due();api.recordCard('valid',true);api.markLesson('course','lesson');});
 assert.equal(api.read().cards.valid.correct,1);
 }
});
test('legacy progress migrates without losing answered cards',()=>{
 const {api}=core({'eto-learning-progress-v1':JSON.stringify({cards:{saved:{attempts:2,correct:1,nextReview:1}}})});
 assert.equal(api.read().cards.saved.attempts,2);assert.equal(api.due().length,1);
});
test('labs uses external scripts compatible with production CSP',()=>{
 assert.doesNotMatch(source('labs.html'),/<script\s*>/);
 assert.match(source('labs.html'),/src="labs-shell.js"/);
 assert.match(source('styles.css'),/\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});
test('progress counts the same course catalogue as the learning page',()=>{
 function catalogue(page){const c={window:{}};vm.createContext(c);for(const [,file] of source(page).matchAll(/<script src="([^"]+)"/g))if(['academy-data.js','knowledge-courses.js'].includes(file))vm.runInContext(source(file),c);return Array.from(c.window.ETO_ACADEMY.courses,x=>x.id)}
 assert.deepEqual(catalogue('progress.html'),catalogue('learn.html'));
});
test('static sharing resolves clean URLs and produces a real detail-page link',async()=>{
 for(const pathname of ['/facts/alcohol-withdrawal','/facts/alcohol-withdrawal.html','/project/facts/alcohol-withdrawal']){
 let click,shared;const context={URLSearchParams,location:{pathname,origin:'https://example.org',search:'',hash:''},navigator:{share:async x=>{shared=x}},document:{addEventListener:(name,fn)=>{click=fn},querySelector:()=>null,title:'Fact'}};
 vm.createContext(context);vm.runInContext(source('share-patch.js'),context);
 const button={closest:()=>null};await click({target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(shared.url,`https://example.org${pathname.startsWith('/project/')?'/project':''}/fact.html?id=alcohol-withdrawal`);
 }
});

test('workshop routes cover every book and link to existing concepts in all languages',()=>{
 const {ETO_KNOWLEDGE:k,ETO_WORKSHOP:w}=browserScripts('knowledge-data.js','workshop-data.js','book-guides.js');
 const ids=new Set();
 for(const m of w.modules){
  assert.ok(!ids.has(m.id));ids.add(m.id);
  for(const lang of ['ru','en','et']){
   for(const key of ['title','lead','idea','example','limit','task','why'])assert.ok(m[key][lang]?.trim(),`${m.id}.${key}.${lang}`);
   for(const o of m.options)assert.ok(o[lang]?.trim());
  }
  assert.ok(Number.isInteger(m.right)&&m.right>=0&&m.right<m.options.length);
  for(const id of m.books)assert.ok(k.books.some(b=>b.id===id),`Unknown book ${id}`);
  for(const id of m.concepts)assert.ok(k.concepts.some(c=>c.id===id),`Unknown concept ${id}`);
  assert.ok(m.sources.length);for(const s of m.sources)assert.equal(new URL(s.url).protocol,'https:');
 }
 assert.equal(w.modules.length,10);assert.equal(k.books.length,45);
 for(const b of k.books){assert.ok(w.modules.some(m=>m.books.includes(b.id)),`Unmapped book ${b.id}`);assert.ok(b.formatLabel.ru&&b.readingLens.et)}
 assert.equal(k.books.find(b=>b.id==='book-12').author,'');
});
test('frequency model respects the denominator and conserves the cohort',()=>{
 const {ETO_MODELS:m}=browserScripts('workshop-models.js');
 const f=m.frequencies(1,90,95);assert.equal(f.tp,9);assert.ok(Math.abs(f.fp-49.5)<1e-10);assert.ok(Math.abs(f.ppv-9/58.5)<1e-10);
 for(const p of [0,1,50,100])for(const se of [0,90,100])for(const sp of [0,95,100]){
  const f=m.frequencies(p,se,sp);assert.ok(Math.abs(f.tp+f.fp+f.fn+f.tn-1000)<1e-8);assert.ok(f.ppv===null||f.ppv>=0&&f.ppv<=1);
 }
 assert.equal(m.frequencies(0,90,100).ppv,null);
 assert.ok(m.frequencies(20,90,95).ppv>m.frequencies(1,90,95).ppv);
});
test('receptor model separates occupancy and response including boundaries',()=>{
 const {ETO_MODELS:m}=browserScripts('workshop-models.js');
 assert.equal(m.receptor(5,5,1).occupancy,.5);
 assert.equal(m.receptor(5,5,.5).response,.25);
 assert.equal(m.receptor(5,5,0).occupancy,.5);
 assert.equal(m.receptor(5,5,0).response,0);
 assert.equal(m.receptor(0,5,1).occupancy,0);
 assert.ok(m.receptor(10,5,1).occupancy>m.receptor(5,5,1).occupancy);
});
test('all activity scenarios have translated explanations and valid answer keys',()=>{
 const {ETO_ACTIVITIES:a}=browserScripts('workshop-activities.js');
 for(const items of Object.values(a)){
  assert.equal(items.length,4);
  assert.equal(new Set(items.map(x=>x.id)).size,items.length);
  for(const item of items){assert.ok(Number.isInteger(item.right)&&item.right>=0&&item.right<item.options.length);for(const lang of ['ru','en','et']){assert.ok(item.q[lang]&&item.why[lang]);for(const o of item.options)assert.ok(o[lang])}}
 }
});
