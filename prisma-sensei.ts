import { spawnSync } from "child_process";
import * as dotenv from "dotenv";

// 🥋 OSS SENSEI: The Ultimate Env Fixer
dotenv.config({ override: true });

const clean = (val: string | undefined) => {
    if (!val) return "";
    let c = val.trim();
    // Remove "export "
    c = c.replace(/^export\s+/i, "");
    // Remove "DATABASE_URL="
    c = c.replace(/^(DATABASE_URL|DIRECT_URL|URL)\s*[:=]\s*/i, "");
    // Remove quotes
    c = c.replace(/^['"`]|['"`]$/g, "");
    
    // Fix protocol typos
    if ((c.startsWith("postgresql:") || c.startsWith("postgres:")) && !c.includes("://")) {
        c = c.replace(/^(postgresql|postgres):/i, "$1://");
    }
    
    // Ensure protocol
    if (!c.includes("://") && c.includes("@")) {
        c = `postgresql://${c}`;
    }
    
    return c;
};

if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = clean(process.env.DATABASE_URL);
}
if (process.env.DIRECT_URL) {
    process.env.DIRECT_URL = clean(process.env.DIRECT_URL);
}

const args = process.argv.slice(2);
console.log(`🥋 SENSEI: Executing prisma ${args.join(" ")} with cleaned environment...`);

const result = spawnSync("npx", ["prisma", ...args], { 
    stdio: "inherit",
    env: process.env,
    shell: true
});

process.exit(result.status ?? 0);
