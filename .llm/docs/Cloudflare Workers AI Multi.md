# Cloudflare Workers AI Multi-Tenant Monorepo — plan.md

## 0) Executive Summary

We are building a multi-tenant Cloudflare Workers AI platform inside a monorepo. It must support:
- Workers AI (model inference), AI Gateway (policy/routing/observability), Vectorize (embeddings + retrieval), AI Search (RAG UX), KV, Durable Objects (sessions/state), streaming chat, “tool”/function execution, TTS contract (and optional implementation depending on provider constraints), metrics + QA gates, and repeatable deployments per tenant/account.

We also build a developer experience layer: an **Nx plugin** that provides generators/executors comparable to Cloudflare’s `wrangler` + `create-cloudflare` so new apps/services/tenants can be created and deployed consistently.

**Hard requirements:**
- Tenant isolation is non-negotiable.
- No secrets in repo.
- Every milestone ships runnable code + tests + measurable success criteria.
- Everything is repeatable: scaffold -> dev -> test -> deploy per tenant.

---

## 1) Non-Negotiable Constraints and Guardrails

### 1.1 Tenant isolation rules
- Every request must resolve tenant context BEFORE any storage/AI call.
- All storage bindings must be tenant-scoped:
  - KV namespaces per tenant (or tenant prefix strategy if required).
  - Durable Object IDs must include tenant.
  - Vectorize index must be tenant-scoped.
  - Any optional storage (R2/D1) must be tenant-scoped if added later.
- No cross-tenant reads/writes unless explicit “shared” policy exists.

### 1.2 Security + compliance defaults
- Strict request validation on every endpoint.
- CORS locked down per tenant.
- Rate limiting per tenant per IP/user key.
- Redaction in logs (no PII by default; no tokens or raw prompts in logs unless explicitly enabled).

### 1.3 Operational clarity
- Observability is a first-class deliverable:
  - metrics definitions, logging schema, dashboards/alerts suggestions, runbooks.
- Every component has failure mode documentation.

---

## 2) Target Architecture (High-level)

### 2.1 Core apps (Workers)
1) **worker-api**: Primary API surface
   - `/chat` (streaming)
   - `/search` (RAG UX)
   - `/tools/execute` (function/tool dispatcher)
   - `/ingest` (optional or separated)
   - `/tts` (contract + adapter boundary)
2) **ingest-worker** (optional separation)
   - Document ingestion pipeline: chunk -> embed -> Vectorize upsert

### 2.2 Shared packages
- `packages/core`: tenant resolution, middleware, schemas, errors
- `packages/storage`: KV/DO/Vectorize adapters (tenant-aware)
- `packages/rag`: chunking, prompting, citations, safety filters
- `packages/observability`: structured logs + metrics helpers
- `packages/testing`: fixtures, harness, local runners

### 2.3 Key primitives mapping
- **Durable Objects**: sessions, rate limiting, streaming coordination (if needed)
- **KV**: lightweight cache, tenant metadata, prompt versions, feature flags
- **Vectorize**: embeddings store + retrieval
- **Workers AI**: inference + embeddings (if using that route)
- **AI Gateway**: policy + routing + observability for model calls

---

## 3) Repo & Tenant Layout

### 3.1 Proposed folder structure
- `/apps/worker-api`
- `/apps/ingest-worker` (optional)
- `/packages/*`
- `/tenants/<tenant-id>/`
  - `tenant.config.json`
  - `wrangler.jsonc`
  - `policies.json` (optional)
  - `prompts/*.md` (optional)
- `/docs/*`
- `/scripts/*`
- `/tests/*`

### 3.2 Tenant config (minimum fields)
- `tenantId`
- `accountId` (Cloudflare account association if required)
- `hostnameMapping` (optional)
- `ai` policy (models, gateway routes, budgets)
- `vectorize` index name(s)
- `kv` namespace mappings
- `do` class + binding names
- `cors` origins
- `featureFlags`

---

## 4) Blockers & Unknowns (Tracked Early)

This project touches APIs that evolve. These are the “don’t hallucinate” checkpoints.

### 4.1 Cloudflare AI Gateway specifics
**Unknowns/Blockers**
- Exact configuration required to route Workers AI calls via AI Gateway in Workers runtime.
- How usage metrics are exposed/collected and best practice logging.
**Action**
- Create a “Gateway Validation Spike” early (Milestone M2) that proves:
  - calls go through gateway
  - we can capture request_id, latency, and token usage signals (where available)

### 4.2 TTS feasibility
**Unknowns/Blockers**
- Cloudflare-native TTS availability and best option.
**Action**
- Build TTS as an adapter boundary:
  - Contract exists even if implementation is stubbed
  - Later plug a provider (Cloudflare-native if/when supported or external service)

### 4.3 Local dev parity
**Unknowns/Blockers**
- How much of Vectorize/Workers AI can be simulated locally.
**Action**
- Define a local harness:
  - unit tests fully local
  - integration tests use staging resources per tenant where needed (CI gated)

### 4.4 Multi-account deployment
**Unknowns/Blockers**
- wrangler auth context switching across accounts/tenants.
**Action**
- Deployment scripts must support:
  - deploying by tenant folder (each with its own wrangler.jsonc)
  - “deploy all tenants” with explicit order and failure handling

---

## 5) Milestones (Actions, Subactions, Exit Criteria)

> Every milestone ends with:
> 1) runnable demo steps
> 2) tests passing
> 3) metrics/logs emitted
> 4) short Milestone Report in `/docs/reports/`

---

### Milestone M0 — Foundation & Scaffolding
**Goal:** Monorepo boots cleanly; tenant resolution exists; baseline tooling + docs.

**Actions**
1. Create monorepo skeleton
   - apps/packages/tenants/docs/scripts/tests
2. Tooling setup
   - TypeScript baseline + tsconfig
   - lint + format
   - unit test runner
3. Tenant resolution middleware (MANDATORY)
   - Resolve tenant via header/hostname (configurable priority)
   - Attach tenant context object to request lifecycle
4. Core error handling + response envelopes
5. Local dev boot
   - hello endpoint per tenant
   - smoke tests

**Exit criteria**
- `install -> build -> test` passes
- Local dev server runs for at least one worker app
- Unit tests prove tenant resolution + rejection when missing

**Blockers**
- None expected; if toolchain issues, lock versions and document.

---

### Milestone M1 — Streaming Chat + Sessions (DO) + KV cache
**Goal:** `/chat` streaming works; sessions are tenant-isolated; rate limiting exists.

**Actions**
1. Build `/chat` endpoint
   - Request schema: message list, session id, options
   - Streaming response contract (SSE or chunked)
2. Durable Object session store
   - Tenant-scoped session IDs
   - Conversation history with retention policy
3. KV cache layer
   - Tenant-scoped cache keys
   - Cache policy rules
4. Rate limiting
   - DO-based limiter: per tenant + per IP/user
5. Tests
   - streaming behavior test (contract-level)
   - session isolation test
   - rate limit enforcement test

**Exit criteria**
- Streaming response works end-to-end
- Sessions persist and are isolated per tenant
- Rate limits demonstrably enforced
- Logs include request_id + tenant + route + latency

**Blockers**
- Streaming edge cases in runtime; mitigate by defining a strict response protocol.

---

### Milestone M2 — AI Gateway Integration + Model Routing Policy
**Goal:** All model calls go through AI Gateway; policies are enforceable.

**Actions**
1. Gateway integration spike
   - Prove connectivity + configuration
2. Model routing
   - Tenant config chooses model(s)
   - Per-route override options
3. Budget/limits hooks
   - request-level token limits where possible
   - rate limit integration
4. Observability hooks
   - record: latency, status, tokens in/out (if available)
5. Docs
   - `docs/ai-gateway.md` how we route and why

**Exit criteria**
- Gateway used for all AI calls
- Tenant-specific routing works
- Usage signals recorded (as available)
- Fallback behavior documented

**Blockers**
- API details may change; if so, freeze on known-working config and document.

---

### Milestone M3 — Embeddings + Vectorize + Retrieval + RAG assembly
**Goal:** Ingest documents, retrieve relevant chunks, generate RAG responses with citations.

**Actions**
1. Ingestion pipeline
   - chunking strategy (size, overlap)
   - embedding generation
   - Vectorize upsert with metadata
2. Retrieval pipeline
   - query embedding
   - Vectorize search
   - optional rerank hook (interface only if not available)
3. RAG response assembly
   - prompt template with citations
   - safety filters (basic)
4. Tenant-scoped Vectorize indexes
5. Tests
   - deterministic fixture retrieval tests
   - tenant isolation for Vectorize
   - metadata integrity tests

**Exit criteria**
- RAG returns answers with citations/metadata
- Ingestion + retrieval works per tenant
- Retrieval tested with fixtures

**Blockers**
- Local simulation limitations; use staging for integration tests if needed.

---

### Milestone M4 — AI Search UX Endpoint
**Goal:** `/search` delivers structured results optimized for search experience.

**Actions**
1. Build `/search`
   - output schema: answer + sources + confidence notes + recommended follow-ups
2. Query rewriting / intent detection (lightweight)
3. Caching for common queries
4. Metrics
   - search latency
   - cache hit rate
   - retrieval count
5. Tests
   - schema validation tests
   - caching behavior tests

**Exit criteria**
- Stable structured output
- Measurable latency improvements with cache
- Clear “why these results” transparency fields

---

### Milestone M5 — Tooling / Generative Functions (Function Calling)
**Goal:** A controlled tool executor system: predictable, logged, tenant-safe.

**Actions**
1. Define tool schema
   - JSON schema for tool name, args, permissions
2. Tool dispatcher
   - registry of tools
   - validation + auth/permission gating
3. Implement at least 5 tools
   - summarize
   - extract entities
   - classify intent
   - tag/chunk docs
   - ingest docs
4. Audit logging
   - tool name + args hash + outcome
5. Tests
   - permission tests
   - injection guard tests
   - tool correctness tests

**Exit criteria**
- Tools run safely and predictably
- Audit logs exist and are tenant-bound
- Tool contracts documented

---

### Milestone M6 — TTS Contract + Adapter Boundary
**Goal:** TTS endpoint exists with a stable API; implementation pluggable.

**Actions**
1. Define `/tts` contract
   - input: text, voice, format, streaming flag
   - output: audio stream or job id
2. Implement adapter interface
3. Provide stub implementation with clear “not enabled” behavior
4. If feasible: implement provider adapter
5. Tests
   - contract tests
   - stub behavior tests

**Exit criteria**
- Contract documented and stable
- No coupling to a single provider in core code

---

### Milestone M7 — Observability, Metrics, QA Gates, Load Tests
**Goal:** We can measure, regress, and operate this thing like adults.

**Actions**
1. Finalize logging schema
2. Implement metrics helpers and required metrics
3. Add dashboards/alerts suggestions (document)
4. Load test scripts
5. Regression suite
   - retrieval quality “smoke score”
   - streaming stability
6. CI gates
   - lint, typecheck, unit, integration

**Exit criteria**
- Metrics emitted for chat/search/retrieval/tools
- CI gates enforce quality
- Load test runnable and documented

---

### Milestone M8 — Repeatable Deployment per Tenant + Drift Detection
**Goal:** One-command deploy per tenant; multi-tenant deploy-all; drift detection.

**Actions**
1. Deployment scripts
   - deploy one tenant
   - deploy all tenants
   - environment selection (dev/stage/prod)
2. Config validation
   - fail fast if missing bindings
3. Drift detection
   - compare expected bindings vs deployed config (best-effort)
4. Runbooks
   - deploy rollback guidance
   - incident response notes

**Exit criteria**
- Deploy per tenant is consistent and repeatable
- Docs allow fresh clone -> deploy without guesswork

---

## 6) Nx Generator Plan (Comparable to Wrangler + create-cloudflare)

This section is the “/claude architecture + /gemini quality gate” version of the Nx plugin plan.

### 6.1 Goals of Nx plugin
Provide a single consistent workflow to:
- scaffold a new Worker app (like `create-cloudflare`)
- configure bindings for KV/DO/Vectorize/AI Gateway (like wrangler config management)
- scaffold a new tenant (tenant folder + wrangler.jsonc + config)
- run dev/test/deploy commands through Nx executors
- support multi-account context cleanly

### 6.2 Nx plugin deliverables
Create `packages/nx-cloudflare/` (Nx plugin)
- **Generators**
  1) `init`: add baseline config to repo (workspace config, default targets)
  2) `worker`: scaffold a Worker app with standard endpoints + middleware
  3) `tenant`: scaffold tenant folder + config + wrangler.jsonc template
  4) `binding`: add KV/DO/Vectorize/AI bindings to tenant + app config
  5) `rag-module`: add ingestion/retrieval wiring + sample prompts
- **Executors**
  1) `dev`: runs wrangler dev for a selected tenant/app
  2) `test`: runs unit/integration tests; optionally uses staging for Vectorize/AI
  3) `deploy`: deploy one tenant (wrangler deploy)
  4) `deployAll`: loops tenants with safe failure behavior
  5) `typecheck/lint`: standard

### 6.3 Generator behavior specs (what it should produce)
**worker generator outputs**
- `apps/<name>/src/index.ts` with:
  - tenant resolution middleware
  - basic routes: /health, /chat skeleton
- `apps/<name>/project.json` with Nx targets for dev/test/deploy
- `apps/<name>/README.md` “how to run”

**tenant generator outputs**
- `tenants/<tenant-id>/tenant.config.json`
- `tenants/<tenant-id>/wrangler.jsonc`
- optional `policies.json`, `prompts/`

**binding generator outputs**
- Updates tenant wrangler.jsonc with required bindings
- Updates shared typing in `packages/core` for Env bindings
- Optionally adds DO class skeleton

### 6.4 Compatibility mapping: Wrangler / create-cloudflare → Nx
- `create-cloudflare` ~ `nx g nx-cloudflare:worker`
- `wrangler init` ~ `nx g nx-cloudflare:init`
- `wrangler dev` ~ `nx dev <project> --tenant=<id>`
- `wrangler deploy` ~ `nx deploy <project> --tenant=<id>`
- multi-tenant deploy-all ~ `nx deployAll <project>`

### 6.5 Nx plugin action plan (Milestone NX-1..NX-4)

#### NX-1 — Plugin bootstrap
Actions:
- create Nx plugin package skeleton
- implement `init` generator
- add shared utilities: parse tenant config, update JSONC, validate
Exit criteria:
- `nx g nx-cloudflare:init` runs cleanly and adds baseline targets

Blockers:
- JSONC editing reliably (need robust JSONC parser/writer)

#### NX-2 — worker generator
Actions:
- scaffold worker-api template with tenant middleware + /health
- add project.json targets for dev/test/deploy
Exit criteria:
- new worker app created and runs with `nx dev`

#### NX-3 — tenant generator
Actions:
- scaffold tenant folder, config, wrangler.jsonc template
- add tenant registry file (optional) for discoverability
Exit criteria:
- new tenant scaffold deploys with existing worker

#### NX-4 — bindings + deployAll
Actions:
- generator to add bindings and update Env typing
- executor to deployAll tenants safely
Exit criteria:
- `nx deployAll` works and reports per tenant status

### 6.6 Nx plugin quality gates (/gemini brain)
- “dry-run” mode for generators
- validation: generated files compile
- snapshot tests for generator outputs
- idempotency checks (re-running doesn’t duplicate)
- “safe write” policy for config updates

---

## 7) Definition of Done (Global)

Project is “done enough to be dangerous” when:
- New tenant can be created in minutes via Nx generator.
- Streaming chat works with sessions and rate limits.
- RAG ingestion + retrieval works with citations.
- Tools/functions operate with audit logs.
- Metrics exist and CI gates enforce quality.
- Deployments are repeatable for each tenant/account.

---

## 8) Next Actions (Immediate)

1) Implement M0 repo scaffolding + tenant middleware
2) Write `docs/architecture.md`, `docs/tenancy.md`, `docs/metrics.md`, `docs/testing.md`
3) Start NX-1 plugin bootstrap in parallel (it will pay off fast)

