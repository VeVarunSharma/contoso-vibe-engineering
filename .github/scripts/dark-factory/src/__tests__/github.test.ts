import { z } from "zod";
import { cliTransport, GitHub, type Transport } from "../github.js";

describe("factory GitHub boundary", () => {
  afterEach(() => jest.clearAllMocks());

  it.each(["POST", "PATCH", "DELETE", "PUT"] as const)(
    "denies %s mutations in report-only mode",
    async (method) => {
      const transport = jest.fn<ReturnType<Transport>, Parameters<Transport>>();
      const api = new GitHub("example/factory", transport, true);
      await expect(
        api.request(method, "repos/example/factory/issues/1", {}, "state"),
      ).rejects.toThrow("Dry run denied");
      expect(transport).not.toHaveBeenCalled();
    },
  );

  it("denies GraphQL mutations in report-only mode", async () => {
    const transport = jest.fn<ReturnType<Transport>, Parameters<Transport>>();
    const api = new GitHub("example/factory", transport, true);
    await expect(
      api.graph(
        "mutation($id:ID!){deleteIssue(input:{issueId:$id}){clientMutationId}}",
        { id: "issue" },
        z.unknown(),
        "state",
      ),
    ).rejects.toThrow("Dry run denied");
    expect(transport).not.toHaveBeenCalled();
  });

  it("allows explicitly read-only GraphQL queries", async () => {
    const transport: Transport = jest
      .fn()
      .mockResolvedValue({ data: { repository: { id: "repo" } } });
    const api = new GitHub("example/factory", transport, true);
    await expect(
      api.graph(
        'query{repository(owner:"example",name:"factory"){id}}',
        {},
        z.object({ repository: z.object({ id: z.string() }) }),
      ),
    ).resolves.toEqual({ repository: { id: "repo" } });
  });

  it("requires an explicit mutation credential before starting a CLI subprocess", async () => {
    await expect(
      cliTransport({})(
        "POST",
        "repos/example/factory/issues/1/labels",
        {},
        "state",
      ),
    ).rejects.toThrow("Missing explicit state credential");
  });

  it("never allows the read role to execute a write even outside dry-run mode", async () => {
    const transport = jest.fn<ReturnType<Transport>, Parameters<Transport>>();
    await expect(
      new GitHub("example/factory", transport, false).request(
        "POST",
        "repos/example/factory/issues",
        {},
        "read",
      ),
    ).rejects.toThrow("Read credential cannot perform a mutation");
    expect(transport).not.toHaveBeenCalled();
  });

  it("rejects a document containing a mutation disguised behind a leading query", async () => {
    const transport = jest.fn<ReturnType<Transport>, Parameters<Transport>>();
    const api = new GitHub("example/factory", transport, true);
    await expect(
      api.request("POST", "graphql", {
        query: "query Read{viewer{login}} mutation Write{noop}",
        operationName: "Write",
      }),
    ).rejects.toThrow("Dry run denied");
    expect(transport).not.toHaveBeenCalled();
  });

  it("does not treat GraphQL errors or null data as an empty successful read", async () => {
    for (const response of [
      { data: null },
      { errors: [{ message: "Permission denied" }] },
      { data: {}, errors: [{}] },
    ]) {
      const api = new GitHub(
        "example/factory",
        jest.fn().mockResolvedValue(response),
        true,
      );
      await expect(
        api.graph("query{viewer{login}}", {}, z.unknown()),
      ).rejects.toThrow("incomplete data");
    }
  });

  it("rejects cross-repository and arbitrary URL operations", async () => {
    const transport = jest.fn<ReturnType<Transport>, Parameters<Transport>>();
    const api = new GitHub("example/factory", transport, false);
    await expect(
      api.request("GET", "repos/other/repository/issues"),
    ).rejects.toThrow("Cross-repository");
    await expect(
      api.request("GET", "https://untrusted.example/api"),
    ).rejects.toThrow("fixed GitHub API paths");
    expect(transport).not.toHaveBeenCalled();
  });

  it("reads every page rather than assuming the first hundred records are complete", async () => {
    const transport: Transport = jest
      .fn()
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, id) => ({ id })))
      .mockResolvedValueOnce([{ id: 100 }]);
    const api = new GitHub("example/factory", transport);
    expect(
      await api.list(
        "repos/example/factory/issues",
        z.object({ id: z.number() }),
      ),
    ).toHaveLength(101);
    expect(transport).toHaveBeenLastCalledWith(
      "GET",
      "repos/example/factory/issues?per_page=100&page=2",
      undefined,
      "read",
    );
  });

  it("rejects an endpoint that repeats a full page instead of advancing", async () => {
    const transport: Transport = jest
      .fn()
      .mockResolvedValue(Array.from({ length: 100 }, (_, id) => ({ id })));
    const api = new GitHub("example/factory", transport);
    await expect(
      api.list("repos/example/factory/issues", z.object({ id: z.number() })),
    ).rejects.toThrow("Incomplete pagination: repeated page");
    expect(transport).toHaveBeenCalledTimes(2);
  });
});
