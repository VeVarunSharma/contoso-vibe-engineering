import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { z } from "zod";
import { API_VERSION } from "./schemas.js";

export type Role = "read" | "state" | "tasks" | "automation";
export type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
export type Transport = (
  method: Method,
  path: string,
  body: unknown,
  role: Role,
) => Promise<unknown>;

export function isRead(method: Method, path: string, body: unknown): boolean {
  if (method === "GET") return true;
  return (
    method === "POST" &&
    path === "graphql" &&
    typeof body === "object" &&
    body !== null &&
    "query" in body &&
    typeof body.query === "string" &&
    /^\s*query(?:\s|\(|\{)/.test(body.query) &&
    !/\b(?:mutation|subscription)\b/.test(body.query) &&
    !("operationName" in body)
  );
}

export class GitHubError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export function cliTransport(tokens: Partial<Record<Role, string>>): Transport {
  return async (method, path, body, role) => {
    if (role === "read" && !isRead(method, path, body))
      throw new Error("Read credential cannot perform a mutation");
    const token = tokens[role];
    if (method !== "GET" && !token) {
      throw new Error(`Missing explicit ${role} credential; refusing mutation`);
    }
    const args = [
      "api",
      "--method",
      method,
      path,
      "-H",
      `X-GitHub-Api-Version: ${API_VERSION}`,
    ];
    if (body !== undefined) args.push("--input", "-");
    try {
      const output = execFileSync("gh", args, {
        input: body === undefined ? undefined : JSON.stringify(body),
        encoding: "utf8",
        env: token ? { ...process.env, GH_TOKEN: token } : process.env,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60_000,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      });
      return output.trim() ? JSON.parse(output) : null;
    } catch (error) {
      const stderr =
        error && typeof error === "object" && "stderr" in error
          ? String(error.stderr)
          : "";
      const status = /HTTP (\d{3})/.exec(stderr)?.[1];
      throw new GitHubError(
        status ? Number(status) : null,
        `GitHub ${method} ${path.split("?")[0]} failed${status ? ` (HTTP ${status})` : " with an uncertain transport outcome"}`,
      );
    }
  };
}

export class GitHub {
  readonly prefix: string;
  constructor(
    readonly repository: string,
    private readonly transport: Transport,
    readonly dryRun = true,
  ) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
      throw new Error("Invalid repository name");
    this.prefix = `repos/${repository}`;
  }

  async request(
    method: Method,
    path: string,
    body?: unknown,
    role: Role = "read",
  ): Promise<unknown> {
    if (/^[a-z]+:\/\//i.test(path) || path.includes(".."))
      throw new Error("Only fixed GitHub API paths are permitted");
    const permitted =
      path === "graphql" ||
      path === "user" ||
      path === this.prefix ||
      path.startsWith(`${this.prefix}/`) ||
      path.startsWith(`agents/repos/${this.repository}/`);
    if (!permitted) throw new Error("Cross-repository API operation denied");
    const read = isRead(method, path, body);
    if (this.dryRun && !read) {
      throw new Error(`Dry run denied ${method} ${path}`);
    }
    if (role === "read" && !read)
      throw new Error("Read credential cannot perform a mutation");
    return this.transport(method, path, body, role);
  }

  async get<T>(
    path: string,
    schema: z.ZodType<T>,
    role: Role = "read",
  ): Promise<T> {
    return schema.parse(await this.request("GET", path, undefined, role));
  }

  async list<T>(
    path: string,
    schema: z.ZodType<T>,
    role: Role = "read",
    field?: string,
  ): Promise<T[]> {
    const result: T[] = [];
    const pages = new Set<string>();
    for (let page = 1; page <= 1000; page++) {
      const response = await this.request(
        "GET",
        `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
        undefined,
        role,
      );
      const rows = field
        ? z.record(z.string(), z.unknown()).parse(response)[field]
        : response;
      const parsed = z.array(schema).parse(rows);
      const signature = createHash("sha256")
        .update(JSON.stringify(rows))
        .digest("hex");
      if (parsed.length > 0 && pages.has(signature)) {
        throw new Error(`Incomplete pagination: repeated page for ${path}`);
      }
      pages.add(signature);
      result.push(...parsed);
      if (parsed.length < 100) return result;
    }
    throw new Error(`Incomplete pagination for ${path}`);
  }

  async graph<T>(
    query: string,
    variables: Record<string, unknown>,
    schema: z.ZodType<T>,
    role: Role = "read",
  ): Promise<T> {
    const response = z
      .object({
        data: z.unknown().optional(),
        errors: z.array(z.unknown()).optional(),
      })
      .parse(await this.request("POST", "graphql", { query, variables }, role));
    if (
      response.errors?.length ||
      response.data === undefined ||
      response.data === null
    ) {
      throw new Error(
        "GraphQL returned incomplete data; refusing to infer empty evidence",
      );
    }
    return schema.parse(response.data);
  }
}
