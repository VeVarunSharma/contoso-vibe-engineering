import { ticketFormSchema } from "@/lib/types";

describe("ticketFormSchema", () => {
  const valid = {
    name: "Alice",
    email: "alice@example.com",
    category: "bug" as const,
    priority: "medium" as const,
    subject: "A reasonable subject line",
    description:
      "A description that is at least twenty characters in length so it parses.",
  };

  it("accepts a fully valid ticket", () => {
    const parsed = ticketFormSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects names shorter than 2 characters", () => {
    const parsed = ticketFormSchema.safeParse({ ...valid, name: "A" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["name"]);
    }
  });

  it("rejects invalid email addresses", () => {
    const parsed = ticketFormSchema.safeParse({
      ...valid,
      email: "not-an-email",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["email"]);
    }
  });

  it("rejects subjects shorter than 5 characters", () => {
    const parsed = ticketFormSchema.safeParse({ ...valid, subject: "abc" });
    expect(parsed.success).toBe(false);
  });

  it("rejects descriptions shorter than 20 characters", () => {
    const parsed = ticketFormSchema.safeParse({
      ...valid,
      description: "too short",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown categories", () => {
    const parsed = ticketFormSchema.safeParse({
      ...valid,
      category: "marketing" as unknown as typeof valid.category,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown priorities", () => {
    const parsed = ticketFormSchema.safeParse({
      ...valid,
      priority: "yesterday" as unknown as typeof valid.priority,
    });
    expect(parsed.success).toBe(false);
  });
});
