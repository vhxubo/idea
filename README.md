# Idea.

> 开发思想与项目集 —— 向最懒且最对的人学习。

A commonplace book for development ideas and side projects. Each project is a Markdown file in a content collection, listed with live search and tag filtering, with a per-project detail page linking out to the real repo.

Built with Astro, React islands, and Tailwind CSS v4. Static, zero-runtime JS where possible.

[![Idea projects](https://vhxubo.github.io/idea/badge/projects.svg)](https://vhxubo.github.io/idea)

[![Deploy](https://github.com/vhxubo/idea/actions/workflows/deploy.yml/badge.svg)](https://github.com/vhxubo/idea/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro&logoColor=fff)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=fff)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](https://github.com/vhxubo/idea/blob/main/LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-live-222?logo=githubpages&logoColor=fff)](https://vhxubo.github.io/idea)

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
- `src/pages/badge/projects.svg.ts` — static SVG endpoint. Counts the `projects` collection at build time and renders a shields-style badge (`idea | N projects`). Regenerated on every deploy, so it stays in sync automatically.

## Badges

The site exposes a self-serve badge you can drop into any README to show off what's collected here:

```markdown
[![Idea](https://vhxubo.github.io/idea/badge/projects.svg)](https://vhxubo.github.io/idea)
```

Renders as `idea | <count> projects`. Since it's a static build artifact, the number updates the moment you add a project and redeploy — no runtime, no API to keep alive. Point it at the live site URL; swap the host if you deploy elsewhere.

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
