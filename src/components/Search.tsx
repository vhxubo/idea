import { useEffect, useMemo, useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
}
interface Props { projects: Project[]; tags: string[]; base: string; }

export default function Search({ projects, tags, base }: Props) {
  // ponytail: 拼接 base 前缀, 保证 /idea/ 子路径下内部链接正确
  const detail = (id: string) => `${base}projects/${id.replace(/\.md$/, "")}/`;
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // ponytail: 从 URL hash 恢复 tag 状态, 不引入额外路由库
  useEffect(() => {
    const m = location.hash.match(/tag=([^&]+)/);
    if (m) setActiveTag(decodeURIComponent(m[1]));
    const onHash = () => {
      const mm = location.hash.match(/tag=([^&]+)/);
      setActiveTag(mm ? decodeURIComponent(mm[1]) : null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const selectTag = (t: string | null) => {
    setActiveTag(t);
    if (t) history.replaceState(null, "", `#tag=${encodeURIComponent(t)}`);
    else history.replaceState(null, "", location.pathname);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (!needle) return true;
      return p.name.toLowerCase().includes(needle)
        || p.description.toLowerCase().includes(needle)
        || p.tags.some((t) => t.toLowerCase().includes(needle));
    });
  }, [projects, q, activeTag]);

  return (
    <div className="flex flex-col gap-10">
      {/* controls bar */}
      <div className="flex flex-col gap-6">
        <input
          type="search"
          placeholder="搜索…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-transparent border-0 border-b border-ink/15 px-0 py-2 font-sans text-ink outline-none placeholder:text-ash/60 focus:border-sienna text-sm
                     dark:text-parchment dark:border-parchment/20 dark:placeholder:text-parchment/40 dark:focus:border-sienna sm:max-w-xs"
        />
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash/60 dark:text-parchment/40">
              按标签筛选
            </p>
            {activeTag && (
              <button
                onClick={() => selectTag(null)}
                className="font-mono text-[11px] text-sienna hover:underline underline-offset-2 transition"
              >
                清除筛选 #{activeTag} ✕
              </button>
            )}
          </div>
          <div role="tablist" className="flex flex-wrap gap-1">
            <button
              role="tab"
              aria-selected={!activeTag}
              onClick={() => selectTag(null)}
              className={`font-mono text-[11px] px-3 py-1.5 rounded-md border transition-all ${
                !activeTag
                  ? "border-sienna bg-sienna/10 text-sienna dark:text-sienna"
                  : "border-transparent text-ash hover:text-ink hover:border-ink/15 dark:text-parchment/50 dark:hover:text-parchment dark:hover:border-parchment/15"
              }`}
            >全部</button>
            {tags.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={activeTag === t}
                onClick={() => selectTag(activeTag === t ? null : t)}
                className={`font-mono text-[11px] px-3 py-1.5 rounded-md border transition-all ${
                  activeTag === t
                    ? "border-sienna bg-sienna/10 text-sienna dark:text-sienna"
                    : "border-transparent text-ash hover:text-ink hover:border-ink/15 dark:text-parchment/50 dark:hover:text-parchment dark:hover:border-parchment/15"
                }`}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* project list — editorial rows, hairline separators */}
      <div className="divide-y divide-ink/8 dark:divide-parchment/8">
        {filtered.map((p) => (
          <article
            key={p.id}
            className="group flex flex-col gap-2 py-6"
          >
            {/* title — clickable to detail */}
            <a
              href={detail(p.id)}
              className="relative font-serif text-2xl text-ink transition-colors hover:text-sienna w-fit
                         dark:text-parchment dark:hover:text-sienna"
            >
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-sienna transition-all duration-300 group-hover:w-full" />
              {p.name}
            </a>

            <p className="font-sans text-sm leading-relaxed text-ash line-clamp-2 dark:text-parchment/60">
              {p.description}
            </p>

            {/* tag chips — clickable, filter to that tag */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {p.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => selectTag(t)}
                  className="font-mono text-[11px] tracking-tight px-2 py-0.5 rounded-full bg-ink/6 text-ash/80
                             hover:bg-sienna/15 hover:text-sienna
                             dark:bg-parchment/10 dark:text-parchment/60 dark:hover:text-sienna
                             transition-colors cursor-pointer"
                >{t}</button>
              ))}
            </div>

            {/* action links — detail (secondary) + external (primary) */}
            <div className="flex items-center gap-5 pt-1.5">
              <a
                href={detail(p.id)}
                className="font-mono text-[11px] text-ash hover:text-ink dark:text-parchment/50 dark:hover:text-parchment transition-colors"
              >查看详情 →</a>
              <a
                href={p.url}
                className="font-mono text-[11px] font-medium text-sienna hover:underline underline-offset-2 transition-all"
                target="_blank" rel="noopener noreferrer"
              >打开外部项目 ↗</a>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="py-20 text-center font-serif text-lg italic text-ash/60 dark:text-parchment/40">
            没有匹配的项目
          </p>
        )}
      </div>
    </div>
  );
}