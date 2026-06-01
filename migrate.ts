import "./init-env.ts";
import { execSync } from "node:child_process";

console.log("🥋 [MIGRATE SENSEI] Starting Postgres migration sync...");
try {
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
  console.log("🥋 [MIGRATE SENSEI] Migration completed successfully!");
} catch (err: any) {
  console.error("❌ [MIGRATE SENSEI] Migration failed:", err.message || err);
  process.exit(1);
}
