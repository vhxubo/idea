import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { projects };
