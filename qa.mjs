import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const ignored=new Set(['.git','node_modules']);
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  if(ignored.has(entry.name))return[];
  const full=path.join(dir,entry.name);
  return entry.isDirectory()?walk(full):[full];
});
const allFiles=walk(root);
const htmlFiles=allFiles.filter(f=>f.endsWith('.html'));
const jsFiles=allFiles.filter(f=>(f.endsWith('.js')||f.endsWith('.mjs'))&&!f.endsWith(`${path.sep}qa.mjs`));
let failures=[];

for(const file of jsFiles){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(e){failures.push(`${path.relative(root,file)}: JavaScript syntax error\n${e.stderr?.toString()||e.message}`)}
}

for(const file of htmlFiles){
  const rel=path.relative(root,file);
  const dir=path.dirname(file);
  const text=fs.readFileSync(file,'utf8');
  const ids=[...text.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  const seen=new Set();for(const id of ids){if(seen.has(id))failures.push(`${rel}: duplicate id #${id}`);seen.add(id)}
  for(const m of text.matchAll(/\b(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/g)){
    const ref=m[1];if(/^(?:https?:|mailto:|tel:|data:|\/)/.test(ref))continue;
    const clean=decodeURIComponent(ref);
    if(!fs.existsSync(path.resolve(dir,clean)))failures.push(`${rel}: missing local reference ${ref}`);
  }
  const mains=(text.match(/<main\b/gi)||[]).length;if(mains!==1)failures.push(`${rel}: expected exactly one <main>, found ${mains}`);
  if(!/meta name=["']viewport["']/.test(text))failures.push(`${rel}: missing viewport meta`);

  if(!rel.startsWith(`facts${path.sep}`)){
    if(!/id=["']languageSelect["']/.test(text))failures.push(`${rel}: missing language selector`);
    if(!/class=["'][^"']*bottom-nav/.test(text))failures.push(`${rel}: missing mobile bottom navigation`);
  }

  const page=(text.match(/<body[^>]*data-page=["']([^"']+)["']/i)||[])[1];
  const required={
    learn:['courseGrid','courseView'],
    map:['knowledgeMap','mapDetail'],
    daily:['dailyMount'],
    simulator:['simMount'],
    progress:['progressMount'],
    games:['baselineRisk','relativeRisk','oddsBase','oddsRatio','biasScenario','headlineCheck'],
    library:['librarySearch','libraryGrid'],
    glossary:['glossarySearch','glossaryGrid']
  };
  for(const id of required[page]||[])if(!ids.includes(id))failures.push(`${rel}: ${page} page missing required #${id}`);
  if(['learn','map','daily','simulator','progress'].includes(page)&&!/<script src=["']academy\.js["']/.test(text))failures.push(`${rel}: academy page missing academy.js`);
  if(['games','library','glossary','method','fact','home'].includes(page)&&!/<script src=["'](?:\.\.\/)?script\.js["']/.test(text)&&page!=='method')failures.push(`${rel}: classic interactive page missing script.js`);

  if(rel.startsWith(`facts${path.sep}`)){
    for(const property of ['og:title','og:description','og:image','og:url']){
      if(!new RegExp(`<meta\\s+property=["']${property}["']`,'i').test(text))failures.push(`${rel}: missing ${property}`);
    }
    if(!/meta name=["']twitter:card["']/.test(text))failures.push(`${rel}: missing twitter:card`);
    if(!/link rel=["']canonical["']/.test(text))failures.push(`${rel}: missing canonical URL`);
  }
}

function loadBrowserData(file){
  const context={window:{}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return context.window;
}

try{
  const dataWindow=loadBrowserData('data.js');
  const D=dataWindow.ETO_DATA;
  if(!D||!Array.isArray(D.cards)||!D.cards.length)failures.push('data.js: ETO_DATA.cards is empty or missing');
  else{
    const ids=new Set();
    for(const card of D.cards){
      if(!card.id||ids.has(card.id))failures.push(`data.js: invalid or duplicate card id ${card.id||'(missing)'}`);ids.add(card.id);
      for(const lang of ['ru','en','et']){
        const t=card[lang];
        if(!t?.q||!Array.isArray(t.options)||t.options.length<2)failures.push(`data.js: card ${card.id} missing ${lang} question/options`);
        if(!Number.isInteger(t?.right)||t.right<0||t.right>=t.options.length)failures.push(`data.js: card ${card.id} has invalid ${lang} correct answer index`);
      }
    }
  }
}catch(e){failures.push(`data.js: could not validate data: ${e.message}`)}

try{
  const academyWindow=loadBrowserData('academy-data.js');
  const A=academyWindow.ETO_ACADEMY;
  if(!A)failures.push('academy-data.js: ETO_ACADEMY missing');
  else{
    if(!Array.isArray(A.courses)||!A.courses.length)failures.push('academy-data.js: no courses');
    for(const course of A.courses||[]){
      if(!course.id||!Array.isArray(course.lessons)||!course.lessons.length)failures.push(`academy-data.js: course ${course.id||'(missing)'} has no lessons`);
      for(const lesson of course.lessons||[]){
        if(!lesson.id)failures.push(`academy-data.js: course ${course.id} contains lesson without id`);
        for(const lang of ['ru','en','et'])if(!lesson.title?.[lang]||!lesson.body?.[lang])failures.push(`academy-data.js: lesson ${lesson.id} missing ${lang} title/body`);
      }
    }
    if(!Array.isArray(A.daily)||!A.daily.length)failures.push('academy-data.js: daily exercise list is empty');
    for(const [i,q] of (A.daily||[]).entries()){
      for(const lang of ['ru','en','et']){
        const opts=q.opts?.[lang];
        if(!q.q?.[lang]||!Array.isArray(opts)||opts.length<2)failures.push(`academy-data.js: daily ${i} missing ${lang} content/options`);
        if(!Number.isInteger(q.right)||q.right<0||q.right>=opts.length)failures.push(`academy-data.js: daily ${i} invalid right index for ${lang}`);
      }
    }
    if(!Array.isArray(A.simulator)||!A.simulator.length)failures.push('academy-data.js: simulator steps are empty');
    for(const step of A.simulator||[]){
      if(!step.id||!Array.isArray(step.options)||!step.options.length)failures.push(`academy-data.js: simulator step ${step.id||'(missing)'} has no options`);
      for(const option of step.options||[])if(typeof option.score!=='number')failures.push(`academy-data.js: simulator option ${option.id||'(missing)'} in ${step.id} lacks numeric score`);
    }
    for(const node of A.nodes||[]){
      if(node.href&&!/^(?:https?:|\/)/.test(node.href)&&!fs.existsSync(path.resolve(root,node.href.split(/[?#]/)[0])))failures.push(`academy-data.js: map node ${node.id} points to missing ${node.href}`);
    }
  }
}catch(e){failures.push(`academy-data.js: could not validate data: ${e.message}`)}

if(failures.length){console.error(`QA failed with ${failures.length} issue(s):\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`QA passed: ${htmlFiles.length} HTML files, ${jsFiles.length} JS files, navigation shells and learning data checked.`);
