/**
 * Idea 登记簿 · 客户端逻辑
 *
 * 数据契约：本站不保存任何项目内容副本。
 * 1. 仓库元数据（简介/语言/星标/推送时间/默认分支）实时取自 api.github.com；
 * 2. README 正文实时取自 raw.githubusercontent.com/vhxubo/<repo>/<default_branch>/README.md，
 *    哪个分支由第一步的 API 结果决定，API 不可用时依次尝试 main / master。
 */

import { marked } from "marked";
import { REQUIRED_TOPIC } from "../data/projects";

const USER = "vhxubo";
const API_URL = `https://api.github.com/users/${USER}/repos?per_page=100`;
const API_TTL = 30 * 60 * 1000;

marked.setOptions({ gfm: true, breaks: false });

// GitHub Linguist 语言色，用于登记行的语言圆点
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#663399",
  Shell: "#89e051",
  AutoHotkey: "#6594b9",
  "Vim Script": "#199f4b",
  Go: "#00ADD8",
  Java: "#b07219",
};

interface RepoMeta {
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  default_branch: string;
  homepage: string | null;
  topics: string[];
}

const metaByRepo = new Map<string, RepoMeta>();
const readmeCache = new Map<string, { html: string; branch: string; url: string }>();

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const $$ = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];

/* ---------------------------------------------------------------- 同步仓库元数据 */

function readAPICache(): RepoMeta[] | null {
  try {
    const raw = sessionStorage.getItem("idea:repos");
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    return Date.now() - t < API_TTL ? data : null;
  } catch {
    return null;
  }
}

function writeAPICache(data: RepoMeta[]) {
  try {
    sessionStorage.setItem("idea:repos", JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* 隐身模式等场景下不可写，忽略 */
  }
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (ms < day) return "今天";
  if (ms < 30 * day) return `${Math.floor(ms / day)} 天前`;
  if (ms < 365 * day) return `${Math.floor(ms / 30 / day)} 个月前`;
  return `${Math.floor(ms / 365 / day)} 年前`;
}

function applyMeta(repo: string, meta: RepoMeta) {
  const row = $(`.entry[data-repo="${repo}"]`);
  if (!row) return;

  if (meta.description) {
    const note = row.querySelector<HTMLElement>('[data-slot="note"]');
    if (note) note.textContent = meta.description;
  }
  // 标签沿用仓库在 GitHub 上的 topics；上榜标记本身不作为展示标签
  row.dataset.topics = (meta.topics ?? []).join(" ");
  const displayTopics = (meta.topics ?? []).filter((t) => t !== REQUIRED_TOPIC);
  if (displayTopics.length) {
    const tags = row.querySelector<HTMLElement>('[data-slot="tags"]');
    if (tags) {
      tags.hidden = false;
      tags.textContent = displayTopics.join(" · ");
    }
  }
  if (meta.language) {
    const lang = row.querySelector<HTMLElement>('[data-slot="lang"]');
    if (lang) {
      lang.hidden = false;
      lang.className = "lang";
      lang.textContent = meta.language;
      lang.style.setProperty("--lang-color", LANG_COLORS[meta.language] ?? "var(--muted)");
    }
  }
  if (meta.stargazers_count > 0) {
    const stars = row.querySelector<HTMLElement>('[data-slot="stars"]');
    if (stars) {
      stars.hidden = false;
      stars.textContent = `★ ${meta.stargazers_count}`;
    }
  }
  const updated = row.querySelector<HTMLElement>('[data-slot="updated"]');
  if (updated) {
    updated.hidden = false;
    updated.textContent = relativeTime(meta.pushed_at);
  }
}

async function syncMeta() {
  const syncLine = $("#sync-line");
  const syncText = $("#sync-text");

  let repos: RepoMeta[];
  try {
    const cached = readAPICache();
    if (cached) {
      repos = cached;
    } else {
      const res = await fetch(API_URL, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      repos = await res.json();
      writeAPICache(repos);
    }
  } catch {
    // fail-open：无法校验上榜条件时按清单全量展示
    syncLine.dataset.state = "offline";
    syncText.textContent = "GitHub API 暂不可用 · 按登记清单全量展示，README 仍直接读取自 raw 原文";
    return;
  }

  const mine = new Map(repos.map((r) => [r.name, r] as const));
  for (const row of $$(".entry[data-repo]")) {
    const meta = mine.get(row.dataset.repo!);
    if (!meta) continue; // 仓库已删除/改名，fail-open 保留登记行
    metaByRepo.set(row.dataset.repo!, meta as RepoMeta);
    applyMeta(row.dataset.repo!, meta);
  }

  // 上榜校验：清单内仓库必须携带上榜 topic，否则除名（登记号保留，行隐藏）
  for (const row of $$(".entry[data-repo]")) {
    const meta = metaByRepo.get(row.dataset.repo!);
    if (!meta?.topics?.includes(REQUIRED_TOPIC)) {
      row.dataset.gated = "out";
      row.hidden = true;
    }
  }

  // 清单外但带上榜 topic 的仓库自动追加（按最近推送排序，登记号顺延）
  const known = new Set($$(".entry[data-repo]").map((r) => r.dataset.repo!));
  const extras = repos
    .filter((r) => r.topics?.includes(REQUIRED_TOPIC) && !known.has(r.name))
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at));
  extras.forEach((meta, i) => {
    const no = $$(".entry[data-repo]").length + 1 + i;
    appendEntry(meta, no);
    metaByRepo.set(meta.name, meta);
    applyMeta(meta.name, meta);
  });

  // 侧栏统计只统计上榜项目
  const listed = $$(".entry[data-repo]").filter((r) => r.dataset.gated !== "out");
  const metas = listed
    .map((r) => metaByRepo.get(r.dataset.repo!))
    .filter((m): m is RepoMeta => Boolean(m));
  const stars = metas.reduce((n, m) => n + m.stargazers_count, 0);
  const langs = new Set(metas.map((m) => m.language).filter(Boolean));
  const latest = metas.map((m) => m.pushed_at).sort().at(-1);
  $('[data-stat="entries"]').textContent = String(listed.length);
  $('[data-stat="stars"]').textContent = `${stars}`;
  $('[data-stat="langs"]').textContent = `${langs.size}`;
  if (latest) $('[data-stat="pushed"]').textContent = relativeTime(latest);

  syncLine.dataset.state = "live";
  syncText.textContent = `已同步 ${metaByRepo.size} 个仓库 · 上榜 ${listed.length} 个 · 内容实时取自 raw.githubusercontent.com`;

  buildTagChips();
  applyFilter();
}

/** 清单外自动上榜的登记行：结构与 SSR 一致，登记号顺延 */
function appendEntry(meta: RepoMeta, no: number) {
  const el = document.createElement("article");
  el.className = "entry";
  el.dataset.repo = meta.name;
  el.dataset.topics = (meta.topics ?? []).join(" ");
  el.style.setProperty("--i", String(no));
  el.innerHTML = `
    <span class="entry-no">Nº ${String(no).padStart(2, "0")}</span>
    <h2 class="entry-title"><button class="entry-open" type="button">${meta.name}</button></h2>
    <span class="entry-read"><button class="entry-open" type="button">阅读 README →</button></span>
    <p class="entry-note" data-slot="note"></p>
    <div class="entry-meta">
      <span class="entry-tags" data-slot="tags" hidden></span>
      <span data-slot="lang" hidden></span>
      <span data-slot="stars" hidden></span>
      <span data-slot="updated" hidden></span>
      <a class="ml-auto" href="https://github.com/${USER}/${meta.name}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
    </div>`;
  el.querySelector<HTMLElement>('[data-slot="note"]')!.textContent =
    meta.description || "仓库未填写简介。";
  $("#entries").insertBefore(el, $("#empty"));
  el.querySelectorAll(".entry-open").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openReader(meta.name);
    }),
  );
  el.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) return;
    openReader(meta.name);
  });
}

/** 标签筛选 chips 汇总自上榜仓库的 GitHub topics（上榜标记本身不作为标签）；一个都没有时整块隐藏 */
function buildTagChips() {
  const wrap = $("#tagchips");
  const rows = $$(".entry[data-repo]").filter((r) => r.dataset.gated !== "out");
  const topics = [
    ...new Set(
      rows.flatMap((r) =>
        (r.dataset.topics || "")
          .split(" ")
          .filter((t) => t && t !== REQUIRED_TOPIC),
      ),
    ),
  ];
  $("#tagfilter").hidden = topics.length === 0;
  if (!topics.length) {
    activeTag = "";
    return;
  }
  wrap.innerHTML = "";
  for (const t of ["", ...topics]) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tagchip";
    chip.dataset.tag = t;
    chip.textContent = t || "全部";
    chip.setAttribute("aria-pressed", String(t === activeTag));
    chip.addEventListener("click", () => {
      activeTag = t === activeTag ? "" : t;
      applyFilter();
    });
    wrap.append(chip);
  }
}

/* ---------------------------------------------------------------- 溯源阅读器 */

function rawBase(repo: string, branch: string) {
  return `https://raw.githubusercontent.com/${USER}/${repo}/${branch}`;
}

function setReaderState(html: string) {
  $("#reader-state").innerHTML = html;
  $("#reader-state").hidden = false;
  const body = $("#md-body");
  body.hidden = true;
  body.innerHTML = "";
}

async function fetchReadme(repo: string): Promise<{ text: string; branch: string; url: string }> {
  const branchHint = metaByRepo.get(repo)?.default_branch;
  const candidates = branchHint ? [branchHint, "main", "master"] : ["main", "master"];
  let lastError: unknown = new Error("未找到 README");
  for (const branch of [...new Set(candidates)]) {
    // 主源 raw.githubusercontent.com；网络失败时兜底 jsDelivr —— 同一仓库同一文件的 CDN 镜像
    const sources = [
      `${rawBase(repo, branch)}/README.md`,
      `https://cdn.jsdelivr.net/gh/${USER}/${repo}@${branch}/README.md`,
    ];
    for (const url of sources) {
      try {
        // raw 偶发慢/挂起，15s 超时兜底
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (res.ok) return { text: await res.text(), branch, url };
        if (res.status === 404) break; // 该分支没有 README.md，换下一个分支
        lastError = new Error(`HTTP ${res.status}`);
      } catch (e) {
        lastError = e;
      }
    }
  }
  throw lastError;
}

/** 渲染后处理：相对路径改写为原仓库绝对地址，外链新窗口打开 */
function decorateMarkdown(repo: string, branch: string) {
  const body = $("#md-body");
  const dirBase = `${rawBase(repo, branch)}/`;
  const blobBase = `https://github.com/${USER}/${repo}/blob/${branch}/`;

  for (const img of body.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (src && !/^([a-z]+:)?\/\//i.test(src) && !src.startsWith("/")) {
      try {
        img.src = new URL(src, dirBase).href;
      } catch {
        /* 非法路径保持原样 */
      }
    }
    img.loading = "lazy";
  }

  for (const a of body.querySelectorAll("a")) {
    const href = a.getAttribute("href");
    if (!href) continue;
    if (href.startsWith("#")) continue; // 文内锚点，交给标题 slug
    if (!/^([a-z]+:)?\/\//i.test(href) && !href.startsWith("/")) {
      try {
        a.href = new URL(href, blobBase).href; // 相对链接指向仓库文件
      } catch {
        /* 非法路径保持原样 */
      }
    }
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  // 为标题生成锚点 id，文内 #anchor 才能跳转
  const seen = new Map<string, number>();
  for (const h of body.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    const base = h.textContent!.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "heading";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    h.id = n ? `${base}-${n}` : base;
  }
}

let lastFocus: HTMLElement | null = null;

async function openReader(repo: string) {
  const meta = metaByRepo.get(repo);
  $("#reader-title").textContent = repo;
  $("#reader-gh").href = `https://github.com/${USER}/${repo}`;
  const home = $("#reader-home");
  if (meta?.homepage) {
    home.hidden = false;
    home.href = meta.homepage;
    home.textContent = `访问线上地址 ↗`;
  } else {
    home.hidden = true;
  }

  const provenance = $("#reader-raw");
  provenance.textContent = `raw.githubusercontent.com/${USER}/${repo}/…/README.md`;
  $("#reader-dot").style.background = "var(--accent)";

  lastFocus = document.activeElement as HTMLElement;
  $("#backdrop").dataset.open = "true";
  $("#reader").dataset.open = "true";
  document.documentElement.style.overflow = "hidden";
  $("#reader-body").scrollTop = 0;
  $("#reader-close").focus();

  setHash({ p: repo });

  const cached = readmeCache.get(repo);
  if (cached) {
    renderReadme(repo, cached);
    return;
  }
  loadReadme(repo);
}

function renderReadme(repo: string, { html, branch, url }: { html: string; branch: string; url: string }) {
  const body = $("#md-body");
  body.innerHTML = html;
  decorateMarkdown(repo, branch);
  $("#reader-state").hidden = true;
  body.hidden = false;
  const provenance = $("#reader-raw");
  provenance.href = url;
  provenance.textContent = url;
  $("#reader-dot").style.background = "var(--live)";
}

function closeReader() {
  if ($("#reader").dataset.open !== "true") return;
  $("#backdrop").dataset.open = "false";
  $("#reader").dataset.open = "false";
  document.documentElement.style.overflow = "";
  setHash({ p: null });
  lastFocus?.focus();
}

async function loadReadme(repo: string) {
  setReaderState(
    `<span class="spinner"></span>正在取回原文<br/><span class="path">raw.githubusercontent.com/${USER}/${repo}/…/README.md</span>`,
  );
  try {
    const { text, branch, url } = await fetchReadme(repo);
    const html = marked.parse(text) as string;
    const entry = { html, branch, url };
    readmeCache.set(repo, entry);
    if ($("#reader").dataset.open === "true" && $("#reader-title").textContent === repo) {
      renderReadme(repo, entry);
    }
  } catch (err) {
    if ($("#reader").dataset.open !== "true") return;
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    const reason = timedOut
      ? "取回超时（15 秒），raw.githubusercontent.com 暂时无响应"
      : `取回失败：${err instanceof Error ? err.message : "网络错误"}`;
    setReaderState(
      `${reason}<br/><span class="path">raw.githubusercontent.com/${USER}/${repo}/…/README.md</span><br/>` +
        `<button id="reader-retry" class="mt-3 border border-hairline px-3 py-1 font-mono text-[11px] text-fg transition hover:border-accent hover:text-accent" type="button">重试</button>` +
        `　<a class="path" href="https://github.com/${USER}/${repo}" target="_blank" rel="noopener noreferrer">前往 GitHub 查看 ↗</a>`,
    );
    $("#reader-retry")?.addEventListener("click", () => loadReadme(repo));
    $("#reader-dot").style.background = "var(--stamp)";
  }
}

/* ---------------------------------------------------------------- 搜索与标签筛选 */

let activeTag = "";
function applyFilter() {
  const q = ($("#search").value as string).trim().toLowerCase();
  // 被除名（不带上榜 topic）的登记行保持隐藏，不参与筛选
  const rows = $$(".entry[data-repo]").filter((r) => r.dataset.gated !== "out");
  let shown = 0;
  for (const row of rows) {
    const topics = (row.dataset.topics || "").split(" ").filter(Boolean);
    const matchTag = !activeTag || topics.includes(activeTag);
    const haystack = `${row.dataset.repo} ${row.querySelector<HTMLElement>('[data-slot="note"]')!.textContent} ${topics.join(" ")}`.toLowerCase();
    const matchQ = !q || haystack.includes(q);
    row.hidden = !(matchTag && matchQ);
    if (!row.hidden) shown++;
  }
  $("#empty").hidden = shown > 0;
  $("#count").textContent =
    activeTag || q
      ? `${shown} / ${rows.length} 个项目${activeTag ? ` · #${activeTag}` : ""}${q ? ` · “${q}”` : ""}`
      : `共 ${rows.length} 个项目`;
  for (const chip of $$("#tagchips .tagchip")) {
    chip.setAttribute("aria-pressed", String(chip.dataset.tag === activeTag));
  }
  setHash({ tag: activeTag || null });
}

/** hash 承载 tag（筛选）与 p（阅读器）两个深链键，互不覆盖 */
function setHash(patch: { tag?: string | null; p?: string | null }) {
  const cur = new URLSearchParams(location.hash.replace(/^#/, ""));
  const next = new URLSearchParams();
  const tag = patch.tag !== undefined ? patch.tag : cur.get("tag");
  const p = patch.p !== undefined ? patch.p : cur.get("p");
  if (tag) next.set("tag", tag);
  if (p) next.set("p", p);
  const qs = next.toString();
  history.replaceState(null, "", qs ? `#${qs}` : location.pathname + location.search);
}

/* ---------------------------------------------------------------- 装配 */

$$(".entry-open").forEach((btn) =>
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openReader(btn.closest<HTMLElement>(".entry")!.dataset.repo!);
  }),
);
// 整行可点；行内链接不触发
$$(".entry[data-repo]").forEach((row) =>
  row.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) return;
    openReader(row.dataset.repo!);
  }),
);

$("#backdrop").addEventListener("click", closeReader);
$("#reader-close").addEventListener("click", closeReader);
document.addEventListener("keydown", (e) => e.key === "Escape" && closeReader());

$("#search").addEventListener("input", applyFilter);
$$("#tagchips .tagchip").forEach((chip) =>
  chip.addEventListener("click", () => {
    activeTag = chip.dataset.tag === activeTag ? "" : chip.dataset.tag!;
    applyFilter();
  }),
);

// 深链先于 applyFilter 读取：#p=repo 打开阅读器，#tag=x 预置筛选
const hashParam = (k: string) => new URLSearchParams(location.hash.replace(/^#/, "")).get(k);

const initialTag = hashParam("tag");
if (initialTag) activeTag = decodeURIComponent(initialTag);
applyFilter();
syncMeta();
const initialRepo = hashParam("p");
if (initialRepo) openReader(decodeURIComponent(initialRepo));
