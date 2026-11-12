import fs from 'node:fs';
import vm from 'node:vm';

function loadContent(...files) {
  const context = vm.createContext({window:{}});
  for (const file of files) vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:file});
  return context.window;
}

const data = loadContent('data.js', 'extras.js', 'academy-data.js', 'knowledge-courses.js', 'knowledge-data.js',
  'workshop-data.js', 'book-guides.js', 'experience-data.js', 'material-details.js');
const {ETO_DATA:D, ETO_ACADEMY:A, ETO_KNOWLEDGE:K, ETO_WORKSHOP:W, ETO_EXPERIENCE_DATA:E, ETO_MATERIALS:M} = data;
const template = fs.readFileSync('fact.html','utf8').replaceAll('\r\n','\n');
const siteUrl = 'https://prov-ori.github.io/eto-slozhnee/';
const check = process.argv.includes('--check');
let dirty = false;

function emit(path, text) {
  if (check) {
    if (!fs.existsSync(path) || fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n') !== text) {
      console.error('Generated file is stale: ' + path);
      dirty = true;
    }
  } else fs.writeFileSync(path, text);
}

for (const card of D.cards) {
  if (!/^[a-z0-9-]+$/.test(card.id)) throw new Error('Invalid fact slug: ' + card.id);
  const c = card.ru;
  const href = E.fact(card.id);
  const url = siteUrl + href;
  const esc = M.escape;
  let html = template.replace(/(href|src)="(?!https?:|#)([^"]+)"/g, '$1="../$2"')
    .replace('<body data-page="fact">','<body data-page="fact" data-fact-id="'+card.id+'">')
    .replace(/<title>.*?<\/title>/, () => '<title>'+esc(c.q)+' — Это сложнее</title>')
    .replace(/(<meta (?:property|name)="(?:og:title|twitter:title)" content=")[^"]*/, (_, head) => head + esc(c.q))
    .replace(/(<meta (?:property|name)="(?:og:description|description|twitter:description)" content=")[^"]*/, (_, head) => head + esc(c.answer))
    .replace('</head>', '  <link rel="canonical" href="'+url+'">\n  <meta property="og:url" content="'+url+'">\n</head>');
  const fields = {factTag:c.tag, factEvidence:D.ui.ru['level'+card.level], factKicker:c.kicker, factTitle:c.q,
    factAnswer:c.answer, factCaveat:c.caveat, factDesign:c.design};
  for (const [id,value] of Object.entries(fields)) {
    html = html.replace(new RegExp('(id="'+id+'">)'), (_, match) => match + esc(value));
  }
  html = html.replace('id="factSource"', 'id="factSource" href="'+esc(card.source)+'"')
    .replace('id="factSource" href="'+esc(card.source)+'" target="_blank" rel="noopener noreferrer"></a>', 'id="factSource" href="'+esc(card.source)+'" target="_blank" rel="noopener noreferrer">'+esc(card.sourceName)+' ↗</a>')
    .replace('id="factDetails"></div>', () => 'id="factDetails">'+M.render('fact',card,'ru')+'</div>');
  emit(href, html);
}
const currentFacts = new Set(D.cards.map(card => E.fact(card.id)));
for (const file of fs.readdirSync('facts').filter(file=>file.endsWith('.html'))) {
  if (!currentFacts.has('facts/'+file)) {
    console.error('Remove obsolete generated page: facts/' + file);
    dirty = true;
  }
}

const localize = fn => Object.fromEntries(['ru','en','et'].map(lang => [lang, fn(lang)]));
const index = [
  ...D.cards.map(card => ({type:'fact',href:E.fact(card.id),title:localize(lang=>card[lang].q),text:localize(lang=>[card[lang].tag,card[lang].answer].join(' '))})),
  ...K.concepts.map(c=>({type:'concept',href:'concepts.html#'+c.id,title:c.title,text:c.text})),
  ...A.courses.flatMap(c=>c.lessons.map(l=>({type:'lesson',href:E.lesson(c.id,l.id),title:l.title,text:localize(lang=>c.title[lang]+' '+l.body[lang])}))),
  ...K.books.map(b=>({type:'book',href:'books.html#'+b.id,title:b.title,text:b.author})),
  ...Object.entries(E.practiceLinks).map(([key,href])=>({type:'practice',href,title:E.labels[key],text:''})),
  ...W.modules.map(m=>({type:'practice',href:'workshop.html?topic='+m.id,title:m.title,text:m.lead})),
  {type:'practice',href:'cases.html',title:E.labels.cases,text:''}
];
emit('search-index.json', JSON.stringify(index)+'\n');
if (dirty) process.exitCode = 1;
