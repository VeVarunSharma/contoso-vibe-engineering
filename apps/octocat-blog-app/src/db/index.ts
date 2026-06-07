import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const missingDatabaseUrlError = "DATABASE_URL environment variable is not set";

function buildDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
  });

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

const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? buildDatabase(connectionString)
  : createMissingDatabase();
