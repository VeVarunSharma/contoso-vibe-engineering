import type { PoolConfig } from "pg";

let getManagedIdentityPassword: (() => Promise<string>) | undefined;

async function managedIdentityPassword() {
  if (!getManagedIdentityPassword) {
    const [{ DefaultAzureCredential }, { entraTokenProvider }] =
      await Promise.all([
        import("@azure/identity"),
        import("@azure/postgresql-auth"),
      ]);

    getManagedIdentityPassword = entraTokenProvider(
      new DefaultAzureCredential(),
    );
  }

  return getManagedIdentityPassword();
}

export function getPoolConfig(): PoolConfig {
  if (process.env.AZURE_POSTGRES_MANAGED_IDENTITY === "true") {
    const host = process.env.AZURE_POSTGRES_HOST;
    const database = process.env.AZURE_POSTGRES_DATABASE;
    const user = process.env.AZURE_POSTGRES_USER;

    if (!host || !database || !user) {
      throw new Error(
        "AZURE_POSTGRES_HOST, AZURE_POSTGRES_DATABASE, and AZURE_POSTGRES_USER are required for managed identity authentication",
      );
    }

    return {
      host,
      database,
      user,
      port: 5432,
      password: managedIdentityPassword,
      ssl: { rejectUnauthorized: true },
    };
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return { connectionString: process.env.DATABASE_URL };
}
