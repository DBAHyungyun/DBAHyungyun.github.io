import rss from '@astrojs/rss';import {getCollection} from 'astro:content';import {path} from '../lib/paths';
export async function GET(context){return rss({title:'김형윤 · 기술 기록',description:'Database Engineering Notes',site:context.site,items:(await getCollection('blog')).map(p=>({title:p.data.title,pubDate:new Date(p.data.date),description:p.data.description,link:path(`blog/${p.id}/`)}))});}
