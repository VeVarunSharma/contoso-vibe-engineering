import { afterEach, describe, expect, it } from "@jest/globals";
import { getPoolConfig } from "../pool-config";

const managedIdentityVariables = [
  "AZURE_POSTGRES_HOST",
  "AZURE_POSTGRES_DATABASE",
  "AZURE_POSTGRES_USER",
];

afterEach(() => {
  delete process.env.AZURE_POSTGRES_MANAGED_IDENTITY;
  delete process.env.DATABASE_URL;
  managedIdentityVariables.forEach((name) => delete process.env[name]);
});

describe("database connection configuration", () => {
  it("uses the configured URL for local development", () => {
    process.env.DATABASE_URL = "postgresql://localhost/octocat_blog";

    expect(getPoolConfig()).toEqual({
      connectionString: process.env.DATABASE_URL,
    });
  });

  it("creates a token-backed TLS connection for Azure", () => {
    process.env.AZURE_POSTGRES_MANAGED_IDENTITY = "true";
    process.env.AZURE_POSTGRES_HOST =
      "octocat-blog.postgres.database.azure.com";
    process.env.AZURE_POSTGRES_DATABASE = "octocat_blog";
    process.env.AZURE_POSTGRES_USER = "octocat-blog";

    const config = getPoolConfig();

    expect(config).toMatchObject({
      host: process.env.AZURE_POSTGRES_HOST,
      database: process.env.AZURE_POSTGRES_DATABASE,
      user: process.env.AZURE_POSTGRES_USER,
      port: 5432,
      ssl: { rejectUnauthorized: true },
    });
    expect(config.password).toEqual(expect.any(Function));
  });

  it("rejects incomplete managed identity configuration", () => {
    process.env.AZURE_POSTGRES_MANAGED_IDENTITY = "true";

    expect(() => getPoolConfig()).toThrow(
      "AZURE_POSTGRES_HOST, AZURE_POSTGRES_DATABASE, and AZURE_POSTGRES_USER",
    );
  });
});
