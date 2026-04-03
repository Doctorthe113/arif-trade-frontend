import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const proxyTarget = (
		env.VITE_DEV_PROXY_TARGET || "http://91.98.154.10"
	).replace(/\/+$/, "");
	const proxyBasePath = (
		env.VITE_DEV_PROXY_BASE_PATH || "/arif_trade_international/restAPI"
	).replace(/\/+$/, "");

	return {
		plugins: [
			tanstackRouter(),
			tsconfigPaths({ projects: ["./tsconfig.json"] }),
			tailwindcss(),
			viteReact(),
		],
		build: {
			outDir: "dist",
		},
		server: {
			allowedHosts: ["reseller-ocean-marshall-configured.trycloudflare.com"],
			proxy: {
				"/api": {
					target: proxyTarget,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/api/, proxyBasePath),
				},
			},
		},
	};
});
