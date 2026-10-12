import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// site 与 base 在 CI 里会变，留默认即可
export default defineConfig({
  site: "https://vhxubo.github.io",
  base: "/idea",
  vite: { plugins: [tailwindcss()] },
});
