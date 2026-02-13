# 🐙 Octocat Azure App — SRE Agent Demo

This app demonstrates the value of the **Azure SRE Agent** by comparing
a production deployment **without** the agent (insecure, fragile) versus
**with** the agent (secure, observable, resilient).

## 🎯 Demo Scenario

You're deploying a Next.js 16 web app to Azure App Service. Compare:

| Aspect | ❌ Without SRE Agent | ✅ With SRE Agent |
|--------|---------------------|-------------------|
| **Secrets** | Hardcoded in app settings | Key Vault references |
| **Identity** | None (connection strings) | System-assigned Managed Identity |
| **TLS** | 1.0 (vulnerable) | 1.2+ enforced |
| **HTTPS** | Not enforced | HTTPS-only redirect |
| **FTP** | Enabled | Disabled |
| **Remote Debug** | ON in production | OFF |
| **Deployment** | Direct to production | Staging slot → swap |
| **Health Checks** | None | `/health` endpoint configured |
| **Monitoring** | None | App Insights + alerts |
| **Scaling** | Free tier (no scale) | Auto-scale 2–10 instances |
| **Rollback** | Panic and fix-forward | Instant slot swap |
| **Tags** | None | Cost center, owner, env |
| **CI/CD** | Push-to-deploy, no gates | Build → validate → stage → approve → swap |

## 📁 Key Files

```
apps/octocat-azure-app/
├── app/
│   ├── layout.tsx              # App shell
│   ├── page.tsx                # Side-by-side comparison UI
│   └── health/route.ts         # Health endpoint (SRE best practice)
├── infra/
│   ├── bad-deployment.bicep    # ❌ Without SRE Agent
│   ├── good-deployment.bicep   # ✅ With SRE Agent
│   ├── deploy-bad.yml          # ❌ YOLO CI/CD pipeline
│   └── deploy-good.yml         # ✅ Slot-based safe pipeline
└── README.md
```

## 🚀 Running Locally

```bash
pnpm install
pnpm --filter octocat-azure-app dev
# Open http://localhost:3003
```

## 🎬 Demo Script

1. **Show the bad Bicep** (`infra/bad-deployment.bicep`) — point out hardcoded secrets, TLS 1.0, no identity
2. **Ask the SRE Agent** to review it — watch it flag every 🚩 issue
3. **Show the good Bicep** (`infra/good-deployment.bicep`) — generated/validated by the SRE Agent
4. **Compare the workflows** — YOLO deploy vs. slot-based safe pipeline
5. **Hit `/health`** — show the health endpoint the agent requires
6. **Show the rollback** — one slot swap command to undo everything

## 🔗 Related

- **SRE Agent definition**: `.github/agents/platform-sre-azure.agent.md`
- **Kubernetes SRE Agent**: `.github/agents/platform-sre-kubernetes.agent.md`
