import fs from 'node:fs';
import path from 'node:path';
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
  if(rel.startsWith(`facts${path.sep}`)){
    for(const property of ['og:title','og:description','og:image','og:url']){
      if(!new RegExp(`<meta\\s+property=["']${property}["']`,'i').test(text))failures.push(`${rel}: missing ${property}`);
    }
    if(!/meta name=["']twitter:card["']/.test(text))failures.push(`${rel}: missing twitter:card`);
    if(!/link rel=["']canonical["']/.test(text))failures.push(`${rel}: missing canonical URL`);
  }
}

if(failures.length){console.error(`QA failed with ${failures.length} issue(s):\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`QA passed: ${htmlFiles.length} HTML files and ${jsFiles.length} JS files checked recursively.`);
