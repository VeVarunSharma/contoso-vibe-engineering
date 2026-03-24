/**
 * Multi-Model Code Review — Fan-In Consensus Engine
 *
 * Reads structured JSON reviews from multiple AI models,
 * applies majority vote, deduplicates cross-model findings,
 * and generates a consolidated markdown report.
 *
 * Usage: node consensus.mjs <reviews-dir> <output-dir>
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const APPROVAL_THRESHOLD_RATIO = 0.75;
const MIN_QUORUM = 2; // At least 2 valid reviews required for consensus

// Explicit thresholds per reviewer count for correct majority behavior
const THRESHOLD_MAP = {
  2: 2, // 2/2 must approve
  3: 2, // 2/3 must approve (graceful degradation)
  4: 3, // 3/4 must approve
};

function loadReviews(reviewsDir) {
  const allReviews = [];
  const errorReviews = [];
  const files = readdirSync(reviewsDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const raw = readFileSync(join(reviewsDir, file), "utf-8");
      const review = JSON.parse(raw);

      review._sourceFile = basename(file, ".json");

      // Separate error/failed reviews from valid ones
      if (review.verdict === "error") {
        console.warn(`⚠️  ${file}: model failed (verdict: error) — excluded from consensus vote`);
        errorReviews.push(review);
        continue;
      }

      if (!review.verdict || !["approve", "request_changes"].includes(review.verdict)) {
        console.warn(`⚠️  Skipping ${file}: invalid verdict "${review.verdict}"`);
        errorReviews.push({ ...review, verdict: "error" });
        continue;
      }

      allReviews.push(review);
      console.log(`✅ Loaded review from ${file} — verdict: ${review.verdict}`);
    } catch (err) {
      console.warn(`⚠️  Failed to parse ${file}: ${err.message}`);
      const sourceName = basename(file, ".json");
      errorReviews.push({ verdict: "error", model: sourceName, _sourceFile: sourceName });
    }
  }

  return { validReviews: allReviews, errorReviews };
}

function computeConsensus(validReviews, errorReviews) {
  const total = validReviews.length;
  const errored = errorReviews.length;

  if (total === 0) {
    return { verdict: "error", approvals: 0, rejections: 0, total: 0, errored, threshold: 0 };
  }

  // Require minimum quorum — too many failures means we can't trust the result
  if (total < MIN_QUORUM) {
    console.warn(
      `⚠️  Only ${total} valid review(s) — below minimum quorum of ${MIN_QUORUM}. Treating as insufficient.`
    );
    return { verdict: "error", approvals: 0, rejections: 0, total, errored, threshold: MIN_QUORUM };
  }

  const approvals = validReviews.filter((r) => r.verdict === "approve").length;
  const rejections = total - approvals;
  const threshold = THRESHOLD_MAP[total] ?? Math.ceil(total * APPROVAL_THRESHOLD_RATIO);

  return {
    verdict: approvals >= threshold ? "approve" : "request_changes",
    approvals,
    rejections,
    total,
    errored,
    threshold,
  };
}

function findingKey(f) {
  const descSnippet = (f.description ?? "").slice(0, 50).toLowerCase().replace(/\s+/g, " ");
  return `${f.file}:${f.line ?? "?"}:${f.category}:${f.severity}:${descSnippet}`;
}

function deduplicateFindings(reviews) {
  const findingMap = new Map();

  for (const review of reviews) {
    const model = review.model ?? review._sourceFile;
    for (const finding of review.findings ?? []) {
      const key = findingKey(finding);
      if (!findingMap.has(key)) {
        findingMap.set(key, { ...finding, agreedBy: [model] });
      } else {
        findingMap.get(key).agreedBy.push(model);
      }
    }
  }

  const all = [...findingMap.values()];
  // Sort by agreement count (desc), then severity priority
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  all.sort((a, b) => {
    const agreeDiff = b.agreedBy.length - a.agreedBy.length;
    if (agreeDiff !== 0) return agreeDiff;
    return (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
  });

  return {
    crossModel: all.filter((f) => f.agreedBy.length >= 2),
    all,
  };
}

function severityEmoji(severity) {
  const map = { critical: "🔴", high: "🟠", medium: "🟡", low: "🔵", info: "ℹ️" };
  return map[severity] ?? "⚪";
}

function verdictEmoji(verdict) {
  return verdict === "approve" ? "✅" : "❌";
}

function generateMarkdownReport(reviews, errorReviews, consensus, findings) {
  const lines = [];

  lines.push("# 🤖 Multi-Model AI Code Review\n");

  // Overall verdict
  if (consensus.verdict === "approve") {
    lines.push(
      `## Consensus: ✅ APPROVED (${consensus.approvals}/${consensus.total} models approve)\n`
    );
  } else if (consensus.verdict === "request_changes") {
    lines.push(
      `## Consensus: ❌ CHANGES REQUESTED (${consensus.rejections}/${consensus.total} models request changes)\n`
    );
  } else {
    lines.push(`## Consensus: ⚠️ ERROR — no valid reviews received\n`);
  }

  // Vote tally
  lines.push("### Vote Tally\n");
  lines.push("| Model | Verdict | Confidence |");
  lines.push("|-------|---------|------------|");
  for (const r of reviews) {
    const model = r.model ?? r._sourceFile;
    const emoji = verdictEmoji(r.verdict);
    const conf = r.confidence != null ? `${r.confidence}%` : "N/A";
    const verdictLabel = r.verdict === "approve" ? "Approve" : "Request Changes";
    lines.push(`| ${model} | ${emoji} ${verdictLabel} | ${conf} |`);
  }
  for (const r of errorReviews) {
    const model = r.model ?? r._sourceFile;
    lines.push(`| ${model} | ⚠️ Error (excluded) | N/A |`);
  }
  lines.push("");

  if (consensus.errored > 0) {
    lines.push(
      `> ⚠️ **${consensus.errored}** model(s) failed and were excluded from the vote. Threshold adjusted to ${consensus.threshold}/${consensus.total}.\n`
    );
  }

  // Cross-model findings
  if (findings.crossModel.length > 0) {
    lines.push("### 🔴 Cross-Model Findings (agreed by 2+ models)\n");
    lines.push("These issues were independently identified by multiple models — highest priority.\n");
    for (const f of findings.crossModel) {
      const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
      lines.push(
        `- ${severityEmoji(f.severity)} **${f.severity.toUpperCase()}** (${f.category}) — \`${loc}\``
      );
      lines.push(`  ${f.description}`);
      if (f.suggestion) {
        lines.push(`  > 💡 ${f.suggestion}`);
      }
      lines.push(`  _Agreed by: ${f.agreedBy.join(", ")}_\n`);
    }
  }

  // Per-model reviews (collapsible)
  lines.push("### 📋 Per-Model Reviews\n");
  for (const r of reviews) {
    const model = r.model ?? r._sourceFile;
    const emoji = verdictEmoji(r.verdict);
    lines.push(`<details>`);
    lines.push(`<summary>${emoji} <strong>${model}</strong> — ${r.summary ?? "No summary"}</summary>\n`);

    if ((r.findings ?? []).length > 0) {
      lines.push("#### Findings\n");
      for (const f of r.findings) {
        const loc = f.line != null ? `${f.file}:${f.line}` : f.file ?? "general";
        lines.push(`- ${severityEmoji(f.severity)} **${f.severity}** (${f.category}) — \`${loc}\``);
        lines.push(`  ${f.description}`);
        if (f.suggestion) {
          lines.push(`  > 💡 ${f.suggestion}`);
        }
      }
      lines.push("");
    }

    if ((r.strengths ?? []).length > 0) {
      lines.push("#### Strengths\n");
      for (const s of r.strengths) {
        lines.push(`- 💪 ${s}`);
      }
      lines.push("");
    }

    lines.push("</details>\n");
  }

  // Footer
  lines.push("---");
  const totalModels = reviews.length + errorReviews.length;
  lines.push(
    `*Reviewed by ${totalModels} AI models via GitHub Copilot CLI • Majority vote (${consensus.threshold}/${consensus.total} required)*`
  );

  return lines.join("\n");
}

function main() {
  const [reviewsDir, outputDir] = process.argv.slice(2);

  if (!reviewsDir || !outputDir) {
    console.error("Usage: node consensus.mjs <reviews-dir> <output-dir>");
    process.exit(2);
  }

  if (!existsSync(reviewsDir)) {
    console.error(`Reviews directory not found: ${reviewsDir}`);
    process.exit(2);
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Load reviews (separates valid from errored)
  const { validReviews, errorReviews } = loadReviews(reviewsDir);

  if (validReviews.length === 0) {
    console.error("❌ No valid reviews found. Cannot produce consensus.");
    writeFileSync(
      join(outputDir, "consensus-result.json"),
      JSON.stringify({ verdict: "error", approvals: 0, rejections: 0, total: 0, errored: errorReviews.length }, null, 2)
    );
    process.exit(1);
  }

  // Compute consensus (only valid reviews count toward vote)
  const consensus = computeConsensus(validReviews, errorReviews);
  console.log(
    `\n📊 Consensus: ${consensus.verdict.toUpperCase()} (${consensus.approvals}/${consensus.total} approve, threshold: ${consensus.threshold}, errored: ${consensus.errored})`
  );

  // Deduplicate findings
  const findings = deduplicateFindings(validReviews);
  console.log(`📋 Total unique findings: ${findings.all.length}`);
  console.log(`🔴 Cross-model findings: ${findings.crossModel.length}`);

  // Generate report
  const report = generateMarkdownReport(validReviews, errorReviews, consensus, findings);
  writeFileSync(join(outputDir, "consensus-report.md"), report);
  console.log(`📝 Report written to ${join(outputDir, "consensus-report.md")}`);

  // Write machine-readable result
  const result = {
    verdict: consensus.verdict,
    approvals: consensus.approvals,
    rejections: consensus.rejections,
    total: consensus.total,
    errored: consensus.errored,
    threshold: consensus.threshold,
    crossModelFindingsCount: findings.crossModel.length,
    totalFindingsCount: findings.all.length,
    models: [
      ...validReviews.map((r) => ({
        model: r.model ?? r._sourceFile,
        verdict: r.verdict,
        confidence: r.confidence ?? null,
        findingsCount: (r.findings ?? []).length,
      })),
      ...errorReviews.map((r) => ({
        model: r.model ?? r._sourceFile,
        verdict: "error",
        confidence: null,
        findingsCount: 0,
      })),
    ],
  };
  writeFileSync(join(outputDir, "consensus-result.json"), JSON.stringify(result, null, 2));

  // Exit with appropriate code
  if (consensus.verdict === "approve") {
    console.log("\n✅ Consensus: APPROVED — PR is safe to merge.");
    process.exit(0);
  } else {
    console.log("\n❌ Consensus: CHANGES REQUESTED — PR should not be merged.");
    process.exit(1);
  }
}

main();
