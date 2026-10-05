import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const files=fs.readdirSync(root);
const htmlFiles=files.filter(f=>f.endsWith('.html'));
const jsFiles=files.filter(f=>f.endsWith('.js')||f.endsWith('.mjs')).filter(f=>f!=='qa.mjs');
let failures=[];

for(const file of jsFiles){
  try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'})}
  catch(e){failures.push(`${file}: JavaScript syntax error\n${e.stderr?.toString()||e.message}`)}
}

for(const file of htmlFiles){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  const ids=[...text.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  const seen=new Set();for(const id of ids){if(seen.has(id))failures.push(`${file}: duplicate id #${id}`);seen.add(id)}
  for(const m of text.matchAll(/\b(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/g)){
    const ref=m[1];if(/^(?:https?:|mailto:|tel:|data:|\/)/.test(ref))continue;
    const clean=decodeURIComponent(ref);if(!fs.existsSync(path.join(root,clean)))failures.push(`${file}: missing local reference ${ref}`);
  }
  const mains=(text.match(/<main\b/gi)||[]).length;if(mains!==1)failures.push(`${file}: expected exactly one <main>, found ${mains}`);
  if(!/meta name=["']viewport["']/.test(text))failures.push(`${file}: missing viewport meta`);
}

if(failures.length){console.error(`QA failed with ${failures.length} issue(s):\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`QA passed: ${htmlFiles.length} HTML files and ${jsFiles.length} JS files checked.`);
