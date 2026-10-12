/**
 * 项目登记簿 —— 仅登记「哪些仓库收录」与策展元数据。
 * 页面上展示的项目介绍与 README 正文一律实时取自
 * raw.githubusercontent.com/vhxubo/<repo>；标签沿用仓库在 GitHub 上的
 * topics（应用标签），由客户端从 GitHub API 同步后渲染，本文件不维护标签。
 *
 * 字段说明：
 * - repo       GitHub 仓库（vhxubo/<name>）
 * - note       卡片回退简介；GitHub API 可用时优先展示仓库的 description
 * - pinned     置顶（登记号排前）
 */
export interface Project {
  repo: string;
  note: string;
  pinned?: boolean;
}

export const GITHUB_USER = "vhxubo";

export const projects: Project[] = [
  { repo: "gift", note: "礼簿 · 移动端优先的礼金记录工具，多项目管理、本地存储、零后端依赖。", pinned: true },
  { repo: "git-bluff", note: "把零散的 Git 提交记录整理成可汇报的日报 / 周报 / 月报，Rust 实现。", pinned: true },
  { repo: "rike", note: "日课 · 移动端优先的学习计划应用：任务、日记与阶段统计。", pinned: true },
  { repo: "water-tracker", note: "水量记录 · 记录哪里存了什么水的纯前端小工具。" },
  { repo: "glm-quota", note: "GLM Coding Plan 额度查询，纯静态单页、无后端、零第三方请求。" },
  { repo: "opencode-har-analyzer", note: "解析 HAR 抓包，还原 OpenCode 每个 API key 的调用明细与用量图表。" },
  { repo: "arena-hero-mcp", note: "让 AI 读取 Arena Hero 探索地图、移动目标与指令上下文的 MCP server。" },
  { repo: "pure-skill", note: "从项目代码结构提纯业务逻辑，留存完整业务架构与数据架构的技能。" },
  { repo: "json-viewer", note: "在线 JSON 查看器，自动格式化剪贴板内容。" },
  { repo: "weread-free-library", note: "微信读书免费图书馆，数据排序及展示优化。" },
  { repo: "website-navigation", note: "基于 GitHub（Page、Action、Issues）的响应式网址导航。" },
  { repo: "vscode-website-navigation", note: "在 VSCode 里使用 websites 数据接口的插件。" },
  { repo: "rollup-plugin-prefix-localstorage", note: "给 localStorage key 统一加前缀的 Rollup 插件。" },
  { repo: "userscripts", note: "个人油猴脚本汇总。" },
  { repo: "scripts", note: "AutoHotkey 个人脚本合集。" },
  { repo: "blog", note: "开发过程中遇到的问题以及对应的解决方案。" },
  { repo: "websites", note: "把 Issues 整理成 JSON 文件，作为网址导航的数据接口。" },
  { repo: "issues-recommend-url", note: "基于 GraphQL API v4 制作的 Issues 收录整合项目。" },
];
