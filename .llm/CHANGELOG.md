# CHANGELOG.md

Track notable changes to plans, docs, and repo decisions here.

## 2026-01-26

### M0 Coordination Kickoff
- Read agent baseline instructions in `.llm/AGENTS.md` and `.llm/agents.prompt.yaml`
- Opened `.llm/PLAN.md`, `.llm/TODO.md`, `.llm/PRE-M0-STATUS.md` to align on M0 scope
- Started cross-agent reviews for M0 readiness (architecture/security + plan/TODO alignment)
- Updated pre-M0 checklist to reflect completed `npm install` and `npx nx --version`
- Logged M0 decision gaps in `.llm/TODO.md` (auth model, tenant config source, DO tenant checks, D1 scope)
- Ran Gemini M0 readiness review; added items for config bootstrap, Nx strategy, and plan auth note
- M0 decisions recorded: header-only auth in M0, file-based tenant config bundle (KV sync deferred)
- Scaffolding started: apps/worker-api, packages/core, packages/testing, tenant configs, and Nx project.json files
- Documented D1 as deferred in M0 (`.llm/docs/BINDINGS.md`)
- Ran `npm install` to add `zod` dependency; noted swc peer dependency warning
- Verified Nx project detection with `NX_CACHE_PROJECT_GRAPH=false` (projects: core, testing, worker-api)
- Attempted `nx run-many --target test`; Nx CLI hung while calculating project graph on daemon (diagnosis pending)
- User verified `npx nx run-many --target test` completes successfully (3 projects)
- Added tenant Nx projects with `wrangler dev/deploy` targets
- Centralized JSON/error response helpers in core and wired worker-api to use them
- Configured Workers Vitest pool for `worker-api` (Miniflare-backed test runner)
- Fixed Vitest configs to set project `root`; core tests pass via direct Vitest run
- Added smoke tests for `packages/testing` and `apps/worker-api` to avoid empty test runs
- Added `@org/core` package exports entry for Vite resolution; worker-api Vitest run passes (wrangler pool)
- Diagnosed Nx hang: plugin isolation/graph lock; workaround `NX_ISOLATE_PLUGINS=false`
- `nx run-many --target test` succeeds with `NX_DAEMON=false NX_CACHE_PROJECT_GRAPH=false NX_ISOLATE_PLUGINS=false` (NX_NO_CLOUD optional)
- Updated test script to include Nx hang workaround flags
- Normalized wrangler compatibility_date to 2026-01-20 to match local runtime support
- Disabled Nx Cloud for `npm test` to avoid EAI_AGAIN failures
- Added tenant `.dev.vars` files with `TENANT_ID` for local wrangler/test runs
- Added npm-scope aliases for tenant config imports and tenant `index.ts` exports to satisfy Nx module boundaries linting
- Marked tenant Nx projects as `library` to allow app-to-tenant imports under module boundaries rules
- Added Vite alias resolution for tenant package names in worker-api Vitest config
- Switched `worker-api:test` to `nx:run-commands` calling Vitest CLI to avoid Nx vitest executor failures
- Fixed core tenant test import to use `TenantResolutionError` from `errors`
- Disabled arg forwarding for `worker-api:test` run-commands to prevent Nx flags from breaking Vitest
- Made worker-api Vitest config switch to Node pool when running under Nx task env
- Restored `worker-api:test` to `@nx/vitest:test` executor
- Added scratchpad + session export documenting Nx/vitest findings for follow-up
- Gemini design review: Hardened `packages/core/src/env.ts` to be the full source of truth for bindings
- Gemini design review: Updated `TenantResolution` with `accountId` and `requestId` (automatic UUID generation)
- Gemini design review: Aligned `worker-api /health` endpoint with API contract; added `env` and `ctx` to fetch handler
- Gemini design review: Verified tenant isolation logic and updated smoke tests
- Claude Architect: Added `validateTenantScope` and `formatTenantResourceId` helpers to `packages/core` to enforce future storage isolation.
- Claude Architect: Updated `plan.md` with explicit Milestone Dependency Map and quantified exit criteria for all milestones.
- Claude Architect: Expanded `testing.md` with E2E user journeys and dedicated security testing activities.
- Claude Architect: Finalized M0 Foundation and Scaffolding with formal sign-off report.

### Inspections Completed
- **Copilot (Pair) pre-commit inspection** at 14:29 UTC
  - Comprehensive repository state analysis
  - Validated documentation completeness (4,491+ lines)
  - Confirmed no blockers for M0 implementation
  - Created inspection report: `sessions/2026-01-26-copilot-inspection.md`
  - Status: ✅ READY FOR M0 IMPLEMENTATION

### Added
- **GitHub Project created** - 122 issues across 13 milestones + review feedback
  - URL: https://github.com/users/rainbowkillah/projects/12
  - Custom fields: Phase, Priority
  - Labels created for all task categories

- **Pre-M0 cleanup checklist**
  - `docs/cleanup.md` - Candidate files/folders to remove or archive

- **Architecture documentation suite completed**:
  - `docs/architecture.md` - Full system architecture with diagrams
  - `docs/tenancy.md` - Multi-tenant isolation strategy
  - `docs/metrics.md` - Observability and logging plan
  - `docs/testing.md` - Testing strategy at all levels
  - `docs/api-contracts.md` - Detailed endpoint specifications
  - `docs/security.md` - Security model, auth, threat analysis
- `docs/failure-modes.md` - Failure analysis and mitigation strategies

### Updated
- Archived `.llm/scratch/` into `.llm/archives/2026-01-26-scratch/`
- Removed empty tenant placeholder folders under `tenants/`

### Reviews Completed
- **Gemini (Planner) review** of plan.md
  - Milestone sequencing: Good, recommend explicit dependency mapping
  - Exit criteria: Good, recommend quantifying metrics
  - Observability: Needs earlier logging schema definition
  - Testing: Gaps in E2E and security testing
  - Failure modes: Need standardized template

- **Codex (Builder) review** of plan.md
  - Repo structure: Need project.json files for Nx
  - Technical clarity: Endpoint schemas too high-level
  - M0 scaffolding: Missing wrangler version, ESM decision
  - Nx plugin: Feasible, use jsonc-parser
  - Blockers: AI Gateway uncertainty, Vectorize local limits

### Updated
- `TODO.md` - Updated with review feedback and GitHub project stats
- `PLAN.md` - Updated index with new documentation links

---

## 2026-01-25

### Added
- Initial plan.md with 8 milestones (M0-M8) + Nx plugin plan (NX-1 to NX-4)
- agents.prompt.yml orchestration configuration
- Basic .llm folder structure

---

*Format: Keep entries in reverse chronological order (newest first)*
