import {load} from 'cheerio';
export function simplifyLinkPreviews(html){
 const $=load(html,null,false);
 $('figure[data-ke-type="opengraph"]').each((_,el)=>{
  const figure=$(el);const href=figure.attr('data-og-url')||figure.find('a').first().attr('href');
  try{const url=new URL(href);if(!['http:','https:'].includes(url.protocol))return;
   // Tistory stores truncated preview text. Keep the destination, not that excerpt.
   const label=url.hostname==='docs.aws.amazon.com'&&url.pathname.includes('CHAP_Target.MySQL')?'AWS DMS 공식 문서 · MySQL 호환 Target':`참고 자료 · ${url.hostname}`;
   const p=$('<p></p>');p.append($('<a></a>').attr('href',href).text(label));figure.replaceWith(p);
  }catch{}
 });return $.html();
}
