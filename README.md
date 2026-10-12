# Idea.

> 开源项目登记簿 —— 仓库是唯一事实源。

收录 [vhxubo](https://github.com/vhxubo) 的开源项目。**本站不保存任何项目文案副本**：卡片上的简介实时取自 GitHub API，README 正文实时取自各仓库 `raw.githubusercontent.com` 的原文，在浏览器里即点即读。

## 上榜规则

**仓库带上 [`idea`](https://github.com/vhxubo/idea/topics) topic 即上榜，移除即除名**，全程在仓库侧操作，不用改站内代码：

```bash
gh repo edit vhxubo/my-repo --add-topic idea
```

- 清单内的仓库若不带 `idea` topic，同步后自动隐藏（登记号保留）；
- 清单外但带 `idea` topic 的仓库会自动追加上榜（按最近推送排序，登记号顺延）；
- GitHub API 不可用、无法校验时按清单全量展示（fail-open），页头会提示离线状态；
- `idea` 本身是上榜标记，不作为展示标签——卡片与筛选展示其余 topics。

[![Idea projects](https://vhxubo.github.io/idea/badge/projects.svg)](https://vhxubo.github.io/idea)

[![Deploy](https://github.com/vhxubo/idea/actions/workflows/deploy.yml/badge.svg)](https://github.com/vhxubo/idea/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro&logoColor=fff)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](https://github.com/vhxubo/idea/blob/main/LICENSE)

## 数据从哪来

| 内容 | 来源 | 时机 |
| --- | --- | --- |
| 项目简介 / 语言 / 星标 / 最近推送 | `api.github.com/users/vhxubo/repos`（1 次请求，sessionStorage 缓存 30 分钟） | 页面打开时 |
| README 正文 | `raw.githubusercontent.com/vhxubo/<repo>/<default_branch>/README.md`（网络失败时兜底 jsDelivr 同文件镜像，溯源栏如实显示实际来源） | 点开「阅读 README」时 |

两个源都支持 CORS，全部在浏览器端完成，站点本身保持纯静态；GitHub API 限流时页面优雅降级为清单内登记信息，README 仍可直接阅读。README 里的相对图片与链接会被改写回原仓库的绝对地址，所以渲染的永远是原文件的样子。

## Stack

- **Astro 5** — 静态生成，登记行服务端渲染，零框架运行时
- **marked** — 唯一的运行时依赖，用于在浏览器渲染 raw README
- **Tailwind CSS v4** — via `@tailwindcss/vite`
- **TypeScript** — strict mode

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm run preview  # preview the build
```

## How it works

- `src/data/projects.ts` — 登记簿清单：只记录收录了哪些仓库与回退简介，不含任何仓库内容。标签不在这里维护——沿用各仓库在 GitHub 上的 topics（应用标签），同步后自动渲染与筛选。
- `src/pages/index.astro` — 主页。清单 SSR 成登记行；侧栏提供搜索与标签筛选。
- `src/scripts/app.ts` — 客户端逻辑：同步 GitHub API 元数据、按需取回并渲染 raw README（溯源阅读器抽屉）、筛选与 `#p=repo` / `#tag=x` 深链。
- `src/styles/global.css` — 「青花瓷」设计令牌：白瓷底 / 青墨 / 钴蓝，暗色为霁蓝釉；含 README 排版样式。
- `src/pages/badge/projects.svg.ts` — 静态 SVG 徽章端点，构建时统计清单条目数。

## Badges

把收录数挂到任何 README 里：

```markdown
[![Idea](https://vhxubo.github.io/idea/badge/projects.svg)](https://vhxubo.github.io/idea)
```

渲染为 `idea | <count> projects`，构建产物，重新部署即更新。

## Adding a project

在 `src/data/projects.ts` 的清单里加一项：

```ts
{
  repo: "my-repo",       // vhxubo/my-repo，README 必须存在
  note: "一句话回退简介", // GitHub API 可用时优先显示仓库 description
},
```

无需登记 README 内容与标签——点开时自动从原仓库取回；卡片标签与筛选沿用仓库的 GitHub topics，想加标签就给仓库设 topic：

```bash
gh repo edit vhxubo/my-repo --add-topic cli --add-topic rust
```

## License

MIT
