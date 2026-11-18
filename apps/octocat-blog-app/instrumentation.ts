export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.RUN_DATABASE_MIGRATIONS === "true"
  ) {
    const { runMigrations } = await import("./src/db/migrate");
    await runMigrations();
  }
}
