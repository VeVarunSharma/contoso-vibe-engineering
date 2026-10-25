import type { PublishingAvailability } from "@/lib/types";

export function getPublishingAvailability(): PublishingAvailability {
  const mode = process.env.SUPPORT_MODE ?? "preview";
  if (mode === "preview") return { mode: "preview" };

  if (mode !== "live") {
    return {
      mode: "unavailable",
      reason: "Set SUPPORT_MODE to preview or live, then restart the server.",
    };
  }

  const required = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    return {
      mode: "unavailable",
      reason: `Live publishing needs ${missing.join(", ")}. Configure them and restart, or use the local Markdown handoff.`,
    };
  }

  const owner = process.env.GITHUB_OWNER ?? "";
  const repo = process.env.GITHUB_REPO ?? "";
  if (
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(owner) ||
    !/^[a-zA-Z0-9_.-]+$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    return {
      mode: "unavailable",
      reason:
        "GITHUB_OWNER and GITHUB_REPO must be repository names, not URLs.",
    };
  }

  const useSdk = process.env.USE_COPILOT_SDK ?? "false";
  if (useSdk !== "true" && useSdk !== "false") {
    return {
      mode: "unavailable",
      reason:
        "USE_COPILOT_SDK must be true or false. No fallback mode was selected.",
    };
  }

  return {
    mode: useSdk === "true" ? "copilot" : "direct",
    repository: `${owner}/${repo}`,
  };
}
