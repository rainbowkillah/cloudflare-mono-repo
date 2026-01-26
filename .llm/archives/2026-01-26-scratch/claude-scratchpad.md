# Claude Code Scratchpad

Quick notes, working thoughts, and temporary documentation for Claude Code sessions.

---

## Current Session: 2026-01-26

### Context

**Project:** Cloudflare Workers AI Multi-Tenant Monorepo
**Role:** Claude (Architect) - Architecture + technical leadership
**Session Focus:** Plan review, documentation creation, GitHub project setup

### Session Summary

This session accomplished:

1. Reviewed `AGENTS.md` and `agents.prompt.yml` orchestration config
2. Explored repository structure and compared against plan.md expectations
3. Coordinated reviews with Gemini (Planner) and Codex (Builder)
4. Created GitHub Project with 122 issues across 13 milestones
5. Wrote complete architecture documentation suite (7 docs)

### Repository State

```
Current State: Pre-M0 (tooling configured, no code scaffolded)

Exists:
├── .llm/                  # Agent workspace (populated)
├── packages/              # Empty (.gitkeep only)
├── tenants/               # Empty subdirs (rainbowsmokeofficial, mrrainibowsmoke)
├── node_modules/          # Dependencies installed
├── nx.json                # Nx configured
├── tsconfig.base.json     # TypeScript configured
└── package.json           # Workspaces defined (path mismatch noted)

Missing:
├── apps/                  # No worker-api, ingest-worker
├── docs/                  # Docs in .llm/docs instead
├── scripts/               # No deployment scripts
├── tests/                 # No test suites
└── wrangler.jsonc         # No Cloudflare config
```

### Key Findings from Reviews

**Gemini (Planner) Feedback:**

- Milestone sequencing: Good, add explicit dependency mapping
- Exit criteria: Good, quantify with specific metrics (P90 < X ms)
- Observability: Define logging schema earlier than M7
- Testing: Add E2E layer, security testing, performance baselines
- Failure modes: Create standardized template (done!)

**Codex (Builder) Feedback:**

- Nx workspace has 0 projects registered - need project.json files
- Endpoint schemas too high-level - need concrete request/response types
- Missing runtime decisions: wrangler version, ESM vs service-worker
- Missing test stack definition: Vitest vs Jest, workerd vs miniflare
- Nx plugin feasible - use `jsonc-parser` for config edits
- Blockers: AI Gateway uncertainty, Vectorize local limits, multi-account creds

### GitHub Project

**URL:** https://github.com/users/rainbowkillah/projects/12
**Issues:** 122 total

| Milestone         | Count | Priority         |
| ----------------- | ----- | ---------------- |
| M0: Foundation    | 12    | Start here       |
| M1: Chat+Sessions | 10    |                  |
| M2: AI Gateway    | 7     | Spike needed     |
| M3: RAG           | 14    |                  |
| M4: Search UX     | 8     |                  |
| M5: Tools         | 13    |                  |
| M6: TTS           | 7     |                  |
| M7: Observability | 12    |                  |
| M8: Deploy        | 8     |                  |
| NX-1: Bootstrap   | 6     | Parallel with M0 |
| NX-2: Worker Gen  | 5     |                  |
| NX-3: Tenant Gen  | 5     |                  |
| NX-4: Bindings    | 8     |                  |
| Review Feedback   | 7     |                  |

### Documentation Created

All in `.llm/docs/`:

| Document         | Status       | Lines | Key Content                          |
| ---------------- | ------------ | ----- | ------------------------------------ |
| plan.md          | Pre-existing | 498   | Milestones M0-M8, NX-1 to NX-4       |
| architecture.md  | Created      | ~350  | System design, components, data flow |
| tenancy.md       | Created      | ~300  | Multi-tenant isolation strategy      |
| api-contracts.md | Created      | ~450  | All endpoint specifications          |
| testing.md       | Created      | ~400  | Unit/integration/E2E strategy        |
| metrics.md       | Created      | ~350  | Logging, metrics, alerting           |
| security.md      | Created      | ~450  | Threat model, auth, validation       |
| failure-modes.md | Created      | ~550  | 15+ failure scenarios, runbook       |
| BINDINGS.md      | Pre-existing | ~150  | Cloudflare bindings reference        |

### Files Modified This Session

```
Created:
.llm/docs/architecture.md
.llm/docs/tenancy.md
.llm/docs/api-contracts.md
.llm/docs/testing.md
.llm/docs/metrics.md
.llm/docs/security.md
.llm/docs/failure-modes.md
.llm/scratch/github-project-spec.json
.llm/scratch/create-issues.sh

Updated:
.llm/PLAN.md
.llm/TODO.md
.llm/CHANGELOG.md
```

### Quick Reference

**Tenant Accounts:**

- rainbowsmokeofficial
- mrrainbowsmoke (note: folder has typo "mrrainibowsmoke")

**Key Cloudflare Primitives:**

- Workers AI - Model inference
- AI Gateway - Policy, routing, observability
- Vectorize - Embeddings + retrieval
- KV - Cache, metadata, feature flags
- Durable Objects - Sessions, rate limiting

**API Endpoints (planned):**

- `POST /chat` - Streaming chat with sessions
- `POST /search` - RAG search with citations
- `POST /ingest` - Document ingestion
- `POST /tools/execute` - Function calling
- `POST /tts` - Text-to-speech (adapter pattern)
- `GET /health` - Health check

### Pending Tasks

From TODO.md:

- [ ] Implement M0 repo scaffolding + tenant middleware
- [ ] Start NX-1 plugin bootstrap in parallel

From Review Feedback:

- [ ] Add explicit milestone dependency mapping to plan.md
- [ ] Quantify exit criteria (P90 latency < X ms)
- [ ] Define AuthN/AuthZ strategy decision
- [ ] Pick logging/metrics sink (Analytics Engine vs Logpush)

### Blockers Identified

1. **AI Gateway uncertainty** - Need validation spike in M2
2. **Vectorize local emulation** - Limited, need staging strategy
3. **Multi-account deployment** - Credential strategy undefined
4. **Package.json workspace mismatch** - References `com-*` but folders are `tenants/*`

### Technical Decisions Needed

| Decision           | Options                   | Recommendation                      |
| ------------------ | ------------------------- | ----------------------------------- |
| Module format      | ESM vs Service Worker     | ESM (modern, tree-shaking)          |
| Streaming protocol | SSE vs Chunked            | SSE (browser native)                |
| Test runner        | Vitest vs Jest            | Vitest (faster, native ESM)         |
| Local dev          | wrangler dev vs Miniflare | wrangler dev (official)             |
| Validation         | Zod vs Valibot            | Zod (more mature)                   |
| JSONC editing      | jsonc-parser vs manual    | jsonc-parser (preserves formatting) |

### Useful Commands

```bash
# Nx commands
nx graph                           # Visualize project graph
nx run-many -t build               # Build all projects
nx run-many -t test                # Test all projects
nx affected -t test                # Test affected projects

# Wrangler commands
wrangler dev                       # Local development
wrangler deploy                    # Deploy to Cloudflare
wrangler secret put SECRET_NAME    # Set secret

# GitHub CLI
gh project view 12 --owner rainbowkillah
gh issue list --repo rainbowkillah/cloudflare-mono-repo
gh issue create --repo rainbowkillah/cloudflare-mono-repo

# Codex/Gemini (from session)
codex exec --skip-git-repo-check --sandbox read-only --full-auto "prompt"
gemini -m gemini-2.5-flash --approval-mode yolo "prompt"
```

### Agent Coordination Notes

Per `agents.prompt.yml`:

- **Claude (Architect):** Architecture, ADRs, security, contracts
- **Gemini (Planner):** Milestones, testing, metrics, QA
- **Codex (Builder):** Implementation, scaffolding, tests
- **Copilot (Pair):** Refactoring, DX, cleanup

Orchestration mode: autonomous-first

- Architect/Planner proceed without questions unless hard blocker
- Builder executes milestones in order
- Pair runs after each milestone

---

## Session Archive

### 2026-01-26 Session Complete

**Duration:** ~1 hour
**Outcome:** Documentation complete, GitHub project created, ready for M0 implementation

Move to `.llm/sessions/` after next session starts.

---

## Notes

### Package.json Workspace Issue

Current `package.json` has:

```json
"workspaces": [
  "packages/*",
  "com-mrrainbowsmoke/*",
  "com-rainbowsmokeofficial/*"
]
```

But actual structure is:

```
tenants/
├── rainbowsmokeofficial/
└── mrrainibowsmoke/        # Note typo: "rainibowsmoke"
```

**Fix needed:** Either rename folders or update workspaces config.

### Stray `/com` Directory

There's a `/com` directory at root with only `.gitignore`. Unclear purpose - may be leftover from earlier structure. Consider removing.

---

## Useful Links

- [GitHub Project](https://github.com/users/rainbowkillah/projects/12)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [Nx Documentation](https://nx.dev/getting-started/intro)
