import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ override: true });

function cleanup(url: string) {
  if (!url) return "";
  let cleaned = url.trim();
  if (cleaned.includes("neon.tech") && cleaned.includes("-pooler")) {
      cleaned = cleaned.replace("-pooler", "");
      cleaned = cleaned.replace(":6543", ":5432");
  }
  return cleaned;
}

const dbUrl = cleanup(process.env.DATABASE_URL || "");

if (!dbUrl) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

console.log("Pushing schema to (corrected):", dbUrl.replace(/:[^@]+@/, ':****@'));

try {
  // Pass the corrected URL explicitly to Prisma CLI via environment
  execSync('npx prisma db push', {
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
      DIRECT_URL: dbUrl
    },
    stdio: 'inherit'
  });
  console.log("✅ Schema pushed successfully.");
} catch (e) {
  console.error("❌ Failed to push schema.");
  process.exit(1);
}
