import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// 自用对外徽章：统计 idea 收录的项目数，渲染成 shields 风格 SVG。
// ponytail: 静态生成，无运行时；新增项目后重新部署即自动更新。
export const prerender = true;

export const GET: APIRoute = async () => {
  const projects = await getCollection("projects");
  const label = "idea";
  const value = `${projects.length} projects`;
  const svg = renderBadge(label, value);

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
};

// shields.io badge 风格：左 label 灰底，右 value 彩底。
function renderBadge(label: string, value: string) {
  const padding = 10;
  const fontSize = 11;
  // 经验值：字母 + 数字按 6.5px、空格按 3.5px 估算宽度。
  const widthOf = (s: string) =>
    [...s].reduce((w, ch) => w + (ch === " " ? 3.5 : 6.5), 0);
  const labelW = Math.ceil(widthOf(label)) + padding * 2;
  const valueW = Math.ceil(widthOf(value)) + padding * 2;
  const w = labelW + valueW;
  const h = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${label}: ${value}">
  <linearGradient id="bg" x2="0" y2="1">
    <stop offset="0" stop-color="#565656"/>
    <stop offset="1" stop-color="#444"/>
  </linearGradient>
  <clipPath id="round"><rect width="${w}" height="${h}" rx="3"/></clipPath>
  <g clip-path="url(#round)">
    <rect width="${labelW}" height="${h}" fill="url(#bg)"/>
    <rect x="${labelW}" width="${valueW}" height="${h}" fill="#FF5D01"/>
  </g>
  <g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}">
    <text x="${labelW / 2}" y="13.5" text-anchor="middle">${escape(label)}</text>
    <text x="${labelW + valueW / 2}" y="13.5" text-anchor="middle">${escape(value)}</text>
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
