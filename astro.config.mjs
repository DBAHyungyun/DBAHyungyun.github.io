import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
const rows=fs.existsSync('migration/url-map.json')?JSON.parse(fs.readFileSync('migration/url-map.json','utf8')):[];
function mediaPaths(){return tree=>{function walk(n){const base=(process.env.BASE_PATH||'/').replace(/\/$/,'');if(n.url?.startsWith('__MEDIA__/'))n.url=base+'/media/'+n.url.slice(10);else if(n.type==='link'&&n.url){try{const u=new URL(n.url,'https://hyungyun.tistory.com');const row=rows.find(r=>[r.source,r.numericSource].filter(Boolean).some(s=>decodeURI(s)===decodeURI(u.origin+u.pathname).replace(/\/$/,'')));if(row)n.url=base+row.newPath+u.hash;}catch{}}for(const c of n.children||[])walk(c);}walk(tree);};}
if(process.env.PUBLIC_PUBLISH==='true'&&(!process.env.SITE_URL||process.env.SITE_URL.includes('example.invalid')))throw Error('실제 SITE_URL 설정 필요');
export default defineConfig({ site: process.env.SITE_URL || 'https://example.invalid', base: process.env.BASE_PATH || '/', trailingSlash:'always', integrations:[sitemap()], markdown:{remarkPlugins:[mediaPaths],shikiConfig:{theme:'github-light'}} });
