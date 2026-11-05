import assert from 'node:assert/strict';
import {classify,planReconciliation}from './reconcile-source.mjs';
const origin='https://hyungyun.tistory.com';
const rows=Array.from({length:20},(_,i)=>({id:`tistory-${i+1}`,source:`${origin}/entry/post-${i+1}`,numericSource:`${origin}/${i+1}`}));
const now=Date.parse('2026-11-05T07:00:00Z');
const error='<title>TISTORY</title><strong class="tit_error">권한이 없거나 존재하지 않는 페이지입니다.</strong>';
const publicHTML=id=>`<div class="contents_style">본문</div><script>var data={"entryId":"${id}"}</script>`;
function probeWith(states={}){return async url=>{const id=Number(url.match(/(?:post-|\/)(\d+)$/)[1]);const state=states[id]||'public';if(state==='timeout')throw Error('timeout');return {url:state==='redirect'?origin+'/':url,status:state==='missing'?404:state==='429'?429:state==='500'?500:200,html:state==='missing'?error:state==='private'?'<form><input type="password"></form>보호되어 있는 글입니다.':state==='unknown'?'generic page':publicHTML(id)};};}
const first=await planReconciliation(rows,{},probeWith({1:'missing',2:'private'}),now);
assert.equal(first.remove.length,0);assert.equal(first.state['tistory-1'].count,1);
const rapid=await planReconciliation(rows,first.state,probeWith({1:'missing',2:'private'}),now+60000);assert.equal(rapid.remove.length,0);
const second=await planReconciliation(rows,first.state,probeWith({1:'missing',2:'private'}),now+16*60000);assert.deepEqual(second.remove.map(x=>x.id),['tistory-1','tistory-2']);
for(const failure of ['timeout','429','500','unknown','redirect']){const result=await planReconciliation(rows,first.state,probeWith({1:failure,2:'public'}),now+3600000);assert.equal(result.remove.length,0,failure);assert.equal(result.state['tistory-1'],undefined);}
const restored=await planReconciliation(rows,first.state,probeWith(),now+3600000);assert.deepEqual(restored.state,{});
const outage=await planReconciliation(rows,first.state,probeWith(Object.fromEntries(rows.map((_,i)=>[i+1,'missing']))),now+3600000);assert.equal(outage.blocked,true);assert.equal(outage.remove.length,0);
const aliases=await planReconciliation(rows,first.state,async url=>url.includes('/entry/')?{url,status:200,html:publicHTML(url.match(/post-(\d+)/)[1])}:{url,status:404,html:error},now+3600000);assert.equal(aliases.remove.length,0);
assert.equal(classify({url:origin+'/1',status:404,html:'CDN error'},rows[0]),'unknown');
assert.equal(classify({url:'https://other.example/1',status:404,html:error},rows[0]),'unknown');
assert.equal(classify({url:origin+'/1',status:403,html:error},rows[0]),'unknown');
assert.equal(classify({url:origin+'/1',status:200,html:publicHTML(999)},rows[0]),'unknown');
console.log('PASS: two independent checks, timing, private/protected, recovery, alias, timeout/429/500, mass outage, generic 404');
