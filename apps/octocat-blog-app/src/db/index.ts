import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getPoolConfig } from "./pool-config";
import * as schema from "./schema";

const missingDatabaseUrlError = "DATABASE_URL environment variable is not set";

function buildDatabase() {
  const pool = new Pool(getPoolConfig());

  return drizzle(pool, { schema });
}

function createMissingDatabase(): ReturnType<typeof buildDatabase> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(missingDatabaseUrlError);
      },
    },
  ) as ReturnType<typeof buildDatabase>;
}

const hasConnectionConfiguration =
  Boolean(process.env.DATABASE_URL) ||
  process.env.AZURE_POSTGRES_MANAGED_IDENTITY === "true";

export const db = hasConnectionConfiguration
  ? buildDatabase()
  : createMissingDatabase();
