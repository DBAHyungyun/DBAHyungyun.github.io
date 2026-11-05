import fs from 'node:fs/promises';import{load}from 'cheerio';
const rows=JSON.parse(await fs.readFile('migration/url-map.json'));
for(const row of rows){const html=await fs.readFile(`backup/pages/${row.id.replace('tistory-','')}.html`,'utf8');const category=JSON.parse(html.match(/"categoryName":("(?:\\.|[^"\\])*")/)?.[1]||'"Database"');row.category=category;const entryId=html.match(/"entryId":"(\d+)"/)?.[1];row.numericSource=entryId?`https://hyungyun.tistory.com/${entryId}`:null;const file=`src/content/blog/${row.id}.md`;let md=await fs.readFile(file,'utf8');md=md.replace(/^category: .*$/m,`category: ${JSON.stringify(category)}`);await fs.writeFile(file,md);}
await fs.writeFile('migration/url-map.json',JSON.stringify(rows,null,2));console.log([...new Set(rows.map(x=>x.category))]);
