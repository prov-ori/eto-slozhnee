import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
