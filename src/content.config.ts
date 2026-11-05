import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
export const collections={blog:defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/blog'}),schema:z.object({title:z.string(),date:z.string(),category:z.string(),source:z.string(),description:z.string()})})};
