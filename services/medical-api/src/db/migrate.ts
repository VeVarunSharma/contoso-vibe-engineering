/**
 * Manual migration script for applying SQL migrations
 * Uses PostgreSQL via node-postgres
 */
import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function migrate() {
  console.log("🔄 Running PostgreSQL migrations...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const migrationsDir = "./drizzle";

  try {
    // Get all SQL files
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, "utf-8");

      console.log(`  📄 Applying: ${file}`);

      // PostgreSQL can handle multiple statements, but we split for clarity
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await pool.query(statement);
      }
    }

    console.log("✅ Migrations complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
