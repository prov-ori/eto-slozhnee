import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

const prefix = '/eto-slozhnee/';
const root = process.cwd();
const config = JSON.parse(await readFile('vercel.json','utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map(({key,value}) => [key,value]));
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png'};
createServer(async (req, res) => {
  const url = new URL(req.url,'http://localhost');
  if (!url.pathname.startsWith(prefix)) return res.writeHead(404).end();
  const name = decodeURIComponent(url.pathname.slice(prefix.length) || 'index.html');
  const file = resolve(root, name);
  if (!file.startsWith(root+sep) || !types[extname(file)]) return res.writeHead(404).end();
  try {
    const content = await readFile(file);
    res.writeHead(200, {...headers, 'Content-Type':types[extname(file)]+'; charset=utf-8'}).end(content);
  } catch { res.writeHead(404).end(); }
}).listen(Number(process.env.ETO_TEST_PORT || 4173),'127.0.0.1');
