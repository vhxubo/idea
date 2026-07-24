import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// 自用对外徽章：统计 idea 收录的项目数，渲染成 shields 风格 SVG。
// ponytail: 静态生成，无运行时；新增项目后重新部署即自动更新。
export const prerender = true;

export const GET: APIRoute = async () => {
  const projects = await getCollection("projects");
  // 多段 shields 风格：idea | 项目1 | 项目2 …，把收录的项目名都铺出来。
  const segments = [{ text: "idea", fill: GRAY }];
  for (const p of projects) segments.push({ text: p.data.name, fill: ORANGE });

  const svg = renderBadge(segments);
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
};

const ORANGE = "#FF5D01";
const GRAY = "url(#bg)";

// shields.io 多段徽章：每段独立彩底，整体圆角裁剪。
function renderBadge(segments: { text: string; fill: string }[]) {
  const padding = 10;
  const fontSize = 11;
  // 经验值：ASCII 字母/数字 6.5px、空格 3.5px、CJK 及全角按 11px 估算。
  const widthOf = (s: string) =>
    [...s].reduce(
      (w, ch) => w + (ch === " " ? 3.5 : ch.charCodeAt(0) > 127 ? 11 : 6.5),
      0,
    );
  let x = 0;
  const segs = segments.map((s) => {
    const w = Math.ceil(widthOf(s.text)) + padding * 2;
    const seg = { ...s, x, w, cx: x + w / 2 };
    x += w;
    return seg;
  });
  const w = x;
  const h = 20;
  const aria = segments.map((s) => s.text).join(" | ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${escape(aria)}">
  <linearGradient id="bg" x2="0" y2="1">
    <stop offset="0" stop-color="#565656"/>
    <stop offset="1" stop-color="#444"/>
  </linearGradient>
  <clipPath id="round"><rect width="${w}" height="${h}" rx="3"/></clipPath>
  <g clip-path="url(#round)">
${segs.map((s) => `    <rect x="${s.x}" width="${s.w}" height="${h}" fill="${s.fill}"/>`).join("\n")}
  </g>
  <g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}">
${segs.map((s) => `    <text x="${s.cx}" y="13.5" text-anchor="middle">${escape(s.text)}</text>`).join("\n")}
  </g>
</svg>`;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
