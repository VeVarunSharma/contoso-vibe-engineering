import { comment, execution } from "@test-mocks/factory";
import { executionSchema } from "../schemas.js";
import { readRecord } from "../state.js";

describe("durable factory state", () => {
  afterEach(() => jest.clearAllMocks());

  it("reads schema-validated state from the immutable GitHub Actions bot identity", () => {
    const state = execution();
    expect(readRecord([comment(state)], "execution", executionSchema)).toEqual({
      id: 201,
      value: state,
    });
  });

  it("distinguishes absent state from malformed state", () => {
    expect(readRecord([], "execution", executionSchema)).toBeNull();
    expect(() =>
      readRecord(
        [
          {
            ...comment(execution()),
            body: "<!-- dark-factory:execution:v1 -->broken",
          },
        ],
        "execution",
        executionSchema,
      ),
    ).toThrow("Malformed");
  });

  it("rejects forged records even when the login is copied", () => {
    const forged = comment(execution());
    forged.user.id = 12345;
    expect(() => readRecord([forged], "execution", executionSchema)).toThrow(
      "Untrusted",
    );
  });

  it("rejects ambiguous duplicate state instead of picking a convenient record", () => {
    expect(() =>
      readRecord(
        [comment(execution()), { ...comment(execution()), id: 202 }],
        "execution",
        executionSchema,
      ),
    ).toThrow("duplicate");
  });

  it("does not interpret a newer state format as absent ownership", () => {
    const newer = comment(execution());
    newer.body = newer.body.replace("execution:v1", "execution:v2");
    expect(() => readRecord([newer], "execution", executionSchema)).toThrow(
      "Unsupported",
    );
  });
});
