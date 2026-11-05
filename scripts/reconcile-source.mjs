import fs from 'node:fs/promises';
import {load} from 'cheerio';
import {pathToFileURL} from 'node:url';
const origin='https://hyungyun.tistory.com';
const article=$=>$('.contents_style,.tt_article_useless_p_margin').length>0;
const entryId=html=>html.match(/"entryId":"(\d+)"/)?.[1];
export function classify(response,row){
 const {status,html='',url}=response;
 if(new URL(url).origin!==origin)return 'unknown';
 const $=load(html);const expected=row.numericSource?.split('/').pop();
 if(status===200&&article($)&&(!expected||entryId(html)===expected))return 'public';
 // Require a real Tistory unavailable page, not a gateway/CDN 404.
 const error=$('.tit_error').text().replace(/\s+/g,' ');
 if([200,404,410].includes(status)&&/권한이 없거나 존재하지 않는|삭제되었|비공개|존재하지 않는/.test(error))return 'unavailable';
 // Password-protected article bodies are also no longer public.
 if(status===200&&$('form input[type="password"]').length&&/보호되어 있는 글|보호된 글/.test($('body').text()))return 'unavailable';
 return 'unknown';
}
export async function planReconciliation(rows,previous,probe,now=Date.now()){
 const results=new Array(rows.length);let cursor=0;
 async function worker(){while(cursor<rows.length){const index=cursor++;const row=rows[index];
  const urls=[...new Set([row.numericSource,row.source].filter(Boolean))];
  const states=[];for(const url of urls){try{states.push(classify(await probe(url),row));}catch{states.push('unknown');}if(states.at(-1)==='public')break;}
  results[index]={row,state:states.includes('public')?'public':states.length>=2&&states.every(x=>x==='unavailable')?'unavailable':'unknown'};
 }}
 await Promise.all(Array.from({length:Math.min(4,rows.length)},()=>worker()));
 const missing=results.filter(x=>x.state==='unavailable');
 const healthy=results.some(x=>x.state==='public');
 // A broad source outage must not erase a substantial part of the blog.
 const blocked=!healthy||missing.length>Math.max(3,Math.ceil(rows.length*.1));
 const next={},remove=[];
 for(const {row,state}of results){if(state!=='unavailable'||blocked)continue;
  const old=previous[row.id];const elapsed=old?now-Date.parse(old.last):Infinity;
  const count=old?(elapsed>=15*60*1000?old.count+1:old.count):1;
  next[row.id]={first:old?.first||new Date(now).toISOString(),last:!old||elapsed>=15*60*1000?new Date(now).toISOString():old.last,count};
  if(count>=2&&now-Date.parse(next[row.id].first)>=15*60*1000)remove.push(row);
 }
 return {state:next,remove,blocked,results:results.map(x=>({id:x.row.id,state:x.state}))};
}
async function json(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
async function save(file,value){const text=JSON.stringify(value,null,2);if(await fs.readFile(file,'utf8').catch(()=>null)!==text)await fs.writeFile(file,text);}
export async function reconcile(){
 const rows=await json('migration/url-map.json',[]),state=await json('migration/source-state.json',{});
 async function probe(url){const r=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(10000)});return {status:r.status,url:r.url,html:await r.text()};}
 const plan=await planReconciliation(rows,state,probe);
 await save('migration/source-state.json',plan.state);
 const gone=new Set(plan.remove.map(x=>x.id));
 let removed=await json('migration/removed-posts.json',[]);
 // A public article which was re-imported is restored automatically.
 const publicIds=new Set(plan.results.filter(x=>x.state==='public').map(x=>x.id));
 removed=removed.filter(x=>!publicIds.has(x.id));
 for(const row of plan.remove){
  if(!/^tistory-[a-zA-Z0-9-]+$/.test(row.id))throw Error('Unsafe post id');
  await fs.unlink(`src/content/blog/${row.id}.md`);
  removed=removed.filter(x=>x.id!==row.id);
  removed.push({id:row.id,source:row.source,numericSource:row.numericSource,newPath:row.newPath,reason:'source-no-longer-public',removedAt:new Date().toISOString()});
  delete plan.state[row.id];
 }
 if(gone.size){
  await save('migration/url-map.json',rows.filter(x=>!gone.has(x.id)));
  await save('migration/source-state.json',plan.state);
  // Only remove content-addressed assets that no remaining Markdown references.
  let text='';async function scan(dir){for(const file of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+file.name;if(file.isDirectory())await scan(p);else if(/\.(md|mdx|astro|ts|js|mjs|css|html)$/.test(file.name))text+=await fs.readFile(p,'utf8');}}
  await scan('src');
  const assets=await json('migration/assets.json',{});
  for(const [url,file]of Object.entries(assets))if(/^[a-f0-9]{64}\.[a-z0-9]+$/.test(file)&&!text.includes(file)){
   await fs.unlink('public/media/'+file).catch(e=>{if(e.code!=='ENOENT')throw e;});delete assets[url];
  }
  await save('migration/assets.json',assets);
  const report=await json('migration/report.json',{});report.imported=rows.length-gone.size;report.assets=new Set(Object.values(assets)).size;await save('migration/report.json',report);
 }
 await save('migration/removed-posts.json',removed);
 console.log(JSON.stringify({removed:plan.remove.map(x=>x.id),pending:Object.keys(plan.state),massChangeBlocked:plan.blocked,unknown:plan.results.filter(x=>x.state==='unknown').length}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await reconcile();
