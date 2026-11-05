import fs from 'node:fs/promises';import {load}from 'cheerio';import Turndown from 'turndown';import{gfm}from 'turndown-plugin-gfm';import{simplifyLinkPreviews}from './link-previews.mjs';
const td=new Turndown({codeBlockStyle:'fenced',headingStyle:'atx'});td.use(gfm);
const rows=JSON.parse(await fs.readFile('migration/url-map.json'));let changed=0;const unresolved=[];
for(const row of rows){const raw=await fs.readFile(`backup/pages/${row.id.replace('tistory-','')}.html`,'utf8');const $=load(raw);const file=`src/content/blog/${row.id}.md`;let md=await fs.readFile(file,'utf8');let edited=false;
 $('.contents_style figure[data-ke-type="opengraph"],.tt_article_useless_p_margin figure[data-ke-type="opengraph"]').each((_,el)=>{const html=$.html(el);const old=td.turndown(html).trim();const next=td.turndown(simplifyLinkPreviews(html)).trim();if(md.includes(old)){md=md.replace(old,next);changed++;edited=true;}else if(!md.includes(next))unresolved.push(row.id);});
 if(edited)await fs.writeFile(file,md);
}
console.log({repaired:changed,unresolved});if(unresolved.length)process.exitCode=1;
