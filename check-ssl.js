#!/usr/bin/env node

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const certPath = join(__dirname, "certs", "localhost.pem");
const keyPath = join(__dirname, "certs", "localhost-key.pem");

console.log("🔒 SSL Certificate Check\n");

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log("✅ SSL certificates found!");
  console.log("   - Certificate: certs/localhost.pem");
  console.log("   - Key: certs/localhost-key.pem");
  console.log("\n🚀 You can now run:");
  console.log("   npm run dev (uses HTTPS automatically)");
  console.log("\n🌐 Your app will be available at:");
  console.log("   https://localhost:5173");
} else {
  console.log("❌ SSL certificates not found!");
  console.log("\n📋 To set up SSL certificates:");
  console.log("   1. Install mkcert: brew install mkcert");
  console.log("   2. Install CA: mkcert -install");
  console.log(
    "   3. Create certificates: mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1"
  );
  console.log("\n💡 Alternatively, the app will use basic SSL automatically");
}

console.log("\n🔍 Why HTTPS?");
console.log("   Supabase authentication requires HTTPS for security.");
console.log("   This setup ensures your login/signup will work properly!");
