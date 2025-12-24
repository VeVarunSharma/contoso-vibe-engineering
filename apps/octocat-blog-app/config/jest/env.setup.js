import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

// Set test environment variables
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test_db";
