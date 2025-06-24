import devtoolsJson from "vite-plugin-devtools-json";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import fs from "fs";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Try to use mkcert certificates, fallback to basic SSL
let useBasicSsl = false;
let httpsConfig: any;

try {
  httpsConfig = {
    key: fs.readFileSync("certs/localhost-key.pem"),
    cert: fs.readFileSync("certs/localhost.pem"),
  };
} catch (error) {
  console.log("⚠️  mkcert certificates not found, using basic SSL plugin");
  useBasicSsl = true;
  httpsConfig = true;
}

export default defineConfig({
  plugins: [
    sveltekit(),
    devtoolsJson(),
    // Add basic SSL plugin as fallback if mkcert certs don't exist
    useBasicSsl ? basicSsl() : undefined,
  ].filter(Boolean),
  server: {
    https: useBasicSsl ? true : httpsConfig,
    host: true,
    port: 5173,
  },
});
