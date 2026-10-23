const sanitizeForLog = (value: unknown): string =>
  String(value).replace(/[\r\n\u2028\u2029]/g, "");

export const db = {
  // Simulating a raw SQL driver (vulnerable if used incorrectly)
  query: async (sql: string) => {
    console.log(`[DB] Executing Raw SQL: ${sanitizeForLog(sql)}`);
    // Mock return data including sensitive fields
    return [
      {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        password_hash: "s3cr3t_h4sh",
        salt: "xyz123",
      },
    ];
  },
  // Simulating an ORM (Prisma-like)
  user: {
    findUnique: async (args: { where: { id: number } }) => {
      console.log(`[DB] Executing ORM findUnique:`, args);
      return {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        password_hash: "s3cr3t_h4sh",
        salt: "xyz123",
      };
    },
  },
};
