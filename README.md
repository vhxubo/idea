# Idea.

> 开发思想与项目集 —— 向最懒且最对的人学习。

A commonplace book for development ideas and side projects. Each project is a Markdown file in a content collection, listed with live search and tag filtering, with a per-project detail page linking out to the real repo.

Built with Astro, React islands, and Tailwind CSS v4. Static, zero-runtime JS where possible.

## Stack

- **Astro 5** — content collections, static generation
- **React 19** — single interactive island (`Search.tsx`) for filtering
- **Tailwind CSS v4** — via `@tailwindcss/vite`, plus `@tailwindcss/typography` for prose
- **TypeScript** — strict mode

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm run preview  # preview the build
```

## How it works

- `src/content.config.ts` defines the `projects` collection and its schema.
- `src/content/projects/*.md` — one file per project. Each has frontmatter (`name`, `description`, `url`, `tags`) and a Markdown body rendered on the detail page.
- `src/pages/index.astro` — the index. Queries the collection and hands the data to the React search island.
- `src/pages/projects/[slug].astro` — `getStaticPaths` generates one detail page per project; renders the Markdown body with the prose styles.
- `src/components/Search.tsx` — client-side search by name/description/tags, tag filtering synced to the URL hash.
- `src/layouts/Layout.astro` — document shell, fonts, and a three-state theme toggle (`light → dark → auto`) with FOUC prevention.

## Adding a project

Drop a new `.md` file into `src/content/projects/`:

```markdown
---
name: My Project
description: One-line summary shown on the index and detail pages.
url: https://github.com/me/my-project
tags: [工具, React]
---

Markdown body — rendered on the project's detail page.
```

That's it. The collection is picked up automatically; no registration needed.

## License

MIT
