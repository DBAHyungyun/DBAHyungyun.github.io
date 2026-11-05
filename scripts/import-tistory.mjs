import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { load } from 'cheerio';
import Turndown from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
const origin='https://hyungyun.tistory.com';
const parser=new XMLParser({ignoreAttributes:false});
for(const p of ['backup/pages','public/media','src/content/blog','migration']) await fs.mkdir(p,{recursive:true});
async function fetchText(url){const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);return r.text()}
const sitemap=await fetchText(origin+'/sitemap.xml');await fs.writeFile('backup/sitemap.xml',sitemap);
const rss=await fetchText(origin+'/rss');await fs.writeFile('backup/rss.xml',rss);
const list=x=>Array.isArray(x)?x:x?[x]:[];
const feed=list(parser.parse(rss).rss.channel.item);
const urls=[...new Set([...list(parser.parse(sitemap).urlset.url).map(x=>x.loc),...feed.map(x=>x.link)])].filter(x=>/^https:\/\/hyungyun\.tistory\.com\/(\d+|entry\/[^?#]+)\/?$/.test(x));
const td=new Turndown({codeBlockStyle:'fenced',headingStyle:'atx'});td.use(gfm);
td.addRule('pre',{filter:'pre',replacement:(_,node)=>{const code=node.querySelector('code')||node;const lang=(code.className.match(/language-([\w+-]+)/)||[])[1]||'';const text=code.textContent;const fence='`'.repeat(Math.max(3,...[...text.matchAll(/`+/g)].map(x=>x[0].length+1)));return `\n\n${fence}${lang}\n${text.replace(/\n$/,'')}\n${fence}\n\n`;}});
const rows=[],failures=[];const assets=new Map();
for(const [i,url] of urls.entries()){
 try{
 const html=await fetchText(url);const $=load(html);const article=$('.contents_style').first().length?$('.contents_style').first():$('.tt_article_useless_p_margin').first();
 if(!article.length)throw Error('본문 selector 확인 필요');
 const id=url.match(/\/(\d+)\/?$/)?.[1]||crypto.createHash('sha256').update(url).digest('hex').slice(0,16);
 await fs.writeFile(`backup/pages/${id}.html`,html);
 const f=feed.find(x=>x.link===url);const title=$('meta[property="og:title"]').attr('content')||f?.title||$('title').text();
 const rawDate=$('meta[property="article:published_time"]').attr('content')||f?.pubDate||$('time[datetime]').attr('datetime');
 if(!rawDate||isNaN(Date.parse(rawDate)))throw Error('작성일 확인 필요');
 article.find('script,style,iframe').remove();
 for(const el of article.find('img,a').toArray()){
 const attr=el.tagName==='img'?'src':'href';let raw=$(el).attr(attr);if(!raw)continue;
 if(el.tagName==='img')raw=$(el).attr('data-origin-src')||raw;
 const remote=new URL(raw,url).href;
 if(!/^https?:/.test(remote))continue;
 if(el.tagName!=='img'&&!/kakaocdn.net\/dn\/|tistory.com\/attachment\//.test(remote))continue;
 try{
 if(!assets.has(remote)){const r=await fetch(remote);if(!r.ok)throw Error(String(r.status));const bytes=Buffer.from(await r.arrayBuffer());const ext=({'image/png':'.png','image/jpeg':'.jpg','image/gif':'.gif','image/webp':'.webp','image/svg+xml':'.svg','application/pdf':'.pdf'})[r.headers.get('content-type')?.split(';')[0]]||'.bin';const file=crypto.createHash('sha256').update(bytes).digest('hex')+ext;await fs.writeFile('public/media/'+file,bytes);assets.set(remote,file);}
 $(el).attr(attr,`__MEDIA__/${assets.get(remote)}`);$(el).removeAttr('srcset');
 }catch(e){failures.push({url,asset:remote,error:e.message});}
 }
 const category=JSON.parse(html.match(/"categoryName":("(?:\\.|[^"\\])*")/)?.[1]||'""')||f?.category||$('.category').first().text().trim()||'Database';
 const description=article.text().replace(/\s+/g,' ').trim().slice(0,130);
 const data={title,date:new Date(rawDate).toISOString(),category,source:url,description};
 const md=td.turndown(article.html());await fs.writeFile(`src/content/blog/tistory-${id}.md`,'---\n'+Object.entries(data).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')+'\n---\n\n'+md);
 const entryId=html.match(/"entryId":"(\d+)"/)?.[1];
 rows.push({...data,id:`tistory-${id}`,newPath:`/blog/tistory-${id}/`,numericSource:entryId?`${origin}/${entryId}`:null,images:article.find('img').length,codeBlocks:article.find('pre').length,status:'imported-review-required'});
 }catch(e){failures.push({url,error:e.message});}
 if((i+1)%10===0)console.log(`${i+1}/${urls.length}`);
 await new Promise(r=>setTimeout(r,200));
}
await fs.writeFile('migration/url-map.json',JSON.stringify(rows,null,2));
await fs.writeFile('migration/report.json',JSON.stringify({date:new Date().toISOString(),discovered:urls.length,imported:rows.length,assets:assets.size,failures,complete:rows.length===urls.length&&failures.length===0},null,2));
await fs.writeFile('migration/assets.json',JSON.stringify(Object.fromEntries(assets),null,2));
console.log({discovered:urls.length,imported:rows.length,assets:assets.size,failures:failures.length});
