import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "wxt";
import { extName } from "./package.json";
// See https://wxt.dev/api/config.html

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  srcDir: "src",
  autoIcons: {
    baseIconPath: "assets/icon.png",
  },
  vite: (configEnv: { mode: string }) => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
  manifest: ({ browser, manifestVersion, mode, command }) => {
    return {
      name: extName,
      permissions: ["tabs", "storage", "activeTab", "scripting"],
      host_permissions: ["<all_urls>"],
      web_accessible_resources: [
        {
          resources: ["assets/*"],
          matches: ["<all_urls>"],
        },
      ],
      externally_connectable: {
        matches: ["https://hiring.amazon.ca/*", "*://auth.hiring.amazon.com/*"],
      },
      author: {
        email: "qazi.web@gmail.com",
      },
    };
  },
});
