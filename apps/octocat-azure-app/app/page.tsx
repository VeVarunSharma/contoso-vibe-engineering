import { Shield, ShieldAlert, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          🐙 Octocat Azure App
        </h1>
        <p className="text-lg text-gray-400">
          SRE Agent Demo &mdash; Before &amp; After
        </p>
        <p className="mt-2 text-sm text-gray-500">
          See how the Azure SRE Agent transforms a risky deployment into a
          production-grade, secure, and observable system.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* BAD — Without SRE Agent */}
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-8">
          <div className="mb-4 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-400" />
            <h2 className="text-2xl font-semibold text-red-400">
              Without SRE Agent
            </h2>
          </div>
          <p className="mb-4 text-xs text-red-300/60">
            infra/bad-deployment.bicep
          </p>
          <ul className="space-y-3 text-sm text-red-300/80">
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>Secrets hardcoded in app settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>
                No Managed Identity — connection strings with passwords
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>TLS 1.0 allowed, HTTP not redirected to HTTPS</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>FTP enabled, remote debugging ON in production</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>No deployment slots — deploying direct to production</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>No health checks, no Application Insights</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>No resource tags — impossible to track costs</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>No rollback plan — fix-forward under pressure</span>
            </li>
          </ul>
        </div>

        {/* GOOD — With SRE Agent */}
        <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-8">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-400" />
            <h2 className="text-2xl font-semibold text-green-400">
              With SRE Agent
            </h2>
          </div>
          <p className="mb-4 text-xs text-green-300/60">
            infra/good-deployment.bicep
          </p>
          <ul className="space-y-3 text-sm text-green-300/80">
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>All secrets in Key Vault with references</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>System-assigned Managed Identity</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>TLS 1.2+ enforced, HTTPS-only redirect</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>FTP disabled, remote debugging OFF</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Staging slot with swap-based zero-downtime deploys</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Health endpoint, App Insights, alerts configured</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Cost center, owner, environment tags on all resources</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Instant rollback via slot swap</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex justify-center gap-4">
        <a
          href="/health"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Check Health Endpoint <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}
