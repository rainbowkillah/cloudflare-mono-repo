# M0 Team Kickoff Briefing

**Date:** 2026-01-26  
**Attendees:** Claude (Lead), Gemini (Planner), Codex (Builder)  
**Topic:** Coordinate M0 implementation with GitHub Project alignment

---

## 1. Executive Summary

We are **ready to start M0** with comprehensive documentation (4,491 lines), a 122-issue GitHub Project board, and clear architecture. This briefing aligns the team before any code is written.

**Key Constraint:** ✅ GitHub Project board MUST drive all implementation decisions. No code without issue tracking.

---

## 2. Workspace Status

### Documentation Complete ✅

- **plan.md** (498 lines): M0-M8 milestones + NX-1 to NX-4 plugin roadmap
- **architecture.md** (444 lines): System design, multi-tenant data flow
- **tenancy.md** (458 lines): Isolation rules, validation gates
- **api-contracts.md** (600 lines): `/chat`, `/search`, `/tools/execute`, `/ingest`, `/tts`
- **testing.md** (560 lines): Vitest + Miniflare strategy
- **metrics.md** (387 lines): Observability schema
- **security.md** (594 lines): Auth, rate limiting, validation
- **failure-modes.md** (794 lines): Risk analysis + mitigations
- **BINDINGS.md** (116 lines): Cloudflare bindings reference

### Nx Workspace Status

- **0 projects currently registered** (no project.json files exist)
- **node_modules/** not yet initialized (need `npm install`)
- **Dependencies defined** but not installed (122 packages in package.json)

### GitHub Project

- **122 issues** across M0-M8 + NX plugin milestones
- **URL:** https://github.com/users/rainbowkillah/projects/12
- **Must be source of truth** for all work prioritization

---

## 3. M0 Goals (Foundation)

### What M0 Must Deliver

1. **Repo scaffolding**: Nx projects, apps/, packages/, tenants/ folders
2. **Tenant middleware**: Request → tenant context resolution (non-negotiable)
3. **Storage adapters**: KV, Durable Objects, Vectorize with tenant scoping enforced
4. **Core packages**: core/, storage/, rag/, observability/, testing/
5. **worker-api skeleton**: Routes for `/chat`, `/search`, `/tools/execute`, `/ingest`, `/tts`
6. **Tests**: Unit + integration validating tenant isolation, storage access
7. **Deployment readiness**: Sample tenant config + wrangler deploy validation

### Success Criteria (from plan.md)

- ✅ All routes respond with 200 for valid tenant requests
- ✅ Invalid tenant requests fail with 403 (not 500)
- ✅ KV/Vectorize operations are tenant-scoped (verified in tests)
- ✅ Durable Object IDs include tenant prefix
- ✅ Metrics telemetry flows for each request
- ✅ Logs redact PII by default
- ✅ Every component has runnable tests

---

## 4. Hard Constraints (Non-Negotiable)

### 4.1 Tenant Isolation

- **Every request must resolve tenant BEFORE any storage/AI call**
- All storage bindings must be tenant-scoped:
  - KV: tenant prefix strategy or separate namespace
  - Durable Objects: tenant in ID
  - Vectorize: tenant index or prefix
  - R2/D1 (if added): tenant path/schema prefix
- No cross-tenant reads/writes unless explicit "shared" policy

### 4.2 Security Defaults

- Strict request validation on every endpoint
- CORS locked down per tenant
- Rate limiting per tenant per IP/user key
- Logs redact PII (tokens, prompts, user data)

### 4.3 Code Quality

- No secrets in repo (.env.local / .env ignored)
- Every endpoint has tests
- Tenant isolation enforced at storage adapter layer (not app layer)
- Failure modes documented for each component

### 4.4 Deployment Pattern

- Repeatable: scaffold → dev → test → deploy per tenant
- tenant.config.json drives all tenant-specific behavior
- wrangler.jsonc for each tenant generated from template + tenant config

---

## 5. Team Roles & Responsibilities

### Claude (Lead - Orchestration)

**Responsibilities:**

- Coordinate overall M0 execution
- Review GitHub Project issues before implementation
- Keep team aligned on constraints and exit criteria
- Document decisions in `.llm/sessions/`
- Ensure tests pass and deployment readiness checks complete

**M0 Deliverables:**

1. ✅ Verify GitHub Project (this briefing)
2. Review issue acceptance criteria with team
3. Coordinate code reviews and merge readiness
4. Final M0 sign-off with success criteria validation

### Gemini (Planner - Architecture & Strategy)

**Responsibilities:**

- Validate tenant isolation design before code
- Review architecture decisions (storage adapter patterns, middleware design)
- Identify risks early (blockers, performance concerns)
- Propose test coverage strategy
- Plan M1+ based on M0 learnings

**M0 Deliverables:**

1. Design review: tenant middleware → storage adapter flow
2. Test strategy: unit isolation tests, integration tests with Miniflare
3. Architecture validation: Do tenant-scoped storage adapters prevent cross-tenant leaks?
4. Risk assessment: What breaks first in production?

### Codex (Builder - Implementation)

**Responsibilities:**

- Scaffold Nx projects (apps/, packages/)
- Implement tenant middleware + storage adapters
- Build worker-api routes
- Write integration tests
- Generate sample tenant config + deployment validation

**M0 Deliverables:**

1. Create `project.json` for each app/package
2. Implement `packages/core`: tenant context, middleware, schemas
3. Implement `packages/storage`: KV/DO/Vectorize adapters (tenant-scoped)
4. Implement `apps/worker-api`: skeleton routes + request validation
5. Write tests: tenant isolation, storage access, request handling
6. Deployment validation: wrangler config + test deploy

---

## 6. GitHub Project Alignment Check

### Pre-Implementation Checklist

Before writing any code, verify:

- [ ] **Claude**: GitHub Project board has M0 issues labeled and prioritized
- [ ] **Claude**: Each issue has clear acceptance criteria
- [ ] **Claude**: Team understands issue dependencies (what blocks what)
- [ ] **Gemini**: Architecture/design issues reviewed and signed off
- [ ] **Codex**: Implementation issues broken into 2-3 hour tasks
- [ ] **All**: No surprises during code review because issues were clear

### GitHub Project URL

**https://github.com/users/rainbowkillah/projects/12**

---

## 7. Implementation Sequence

### Phase 1: Setup (1-2 hours)

```bash
# 1. Initialize dependencies
npm install

# 2. Verify toolchain
npx nx --version
npx tsc --version
npx vitest --version
npx wrangler --version

# 3. Scaffold Nx projects
# (Codex creates project.json for apps/worker-api, packages/core, etc.)
```

### Phase 2: Core Architecture (3-4 hours)

- **Gemini**: Design tenant middleware + storage adapter interface
- **Codex**: Implement `packages/core`: tenant context, middleware
- **Codex**: Implement `packages/storage`: adapters with tenant scoping enforced
- **Claude**: Review for compliance with constraints

### Phase 3: App Scaffold (2-3 hours)

- **Codex**: Build `apps/worker-api` routes (skeleton, no logic)
- **Codex**: Inject tenant middleware + request validation
- **Claude**: Review routing + middleware wiring

### Phase 4: Tests & Validation (2-3 hours)

- **Codex**: Write unit tests for tenant isolation
- **Codex**: Write integration tests with Miniflare
- **Gemini**: Review test coverage against failure modes
- **Claude**: Validate all tests pass

### Phase 5: Deployment Readiness (1-2 hours)

- **Codex**: Create sample tenant.config.json + wrangler.jsonc
- **Codex**: Test local dev with `wrangler dev`
- **Claude**: Validate deployment checklist

---

## 8. Dependencies & Blockers

### Known Blockers (from TODO.md)

- ⚠️ AI Gateway routing details uncertain → **needs M2 validation spike**
- ⚠️ Vectorize local emulation limitations → **staging strategy needed**
- ⚠️ Multi-account credential strategy undefined → **defer to M2+**

### M0 Workaround Strategy

- Use **mock/stub AI Gateway** for M0 (real integration in M2)
- Use **Miniflare Vectorize stub** for local tests (staging validation in M2)
- Single-account deployment for M0 (multi-account in M3)

---

## 9. Success Criteria & Exit Conditions

### M0 Definition of Done

- ✅ `npm install` completes (122 packages)
- ✅ `npx nx run-many --target=test` passes all unit + integration tests
- ✅ Tenant isolation verified: invalid tenant → 403 (not 500)
- ✅ Storage adapters enforce tenant scoping (code review + tests)
- ✅ worker-api routes respond with 200 for valid tenant requests
- ✅ Metrics telemetry flows for each request (verified in logs)
- ✅ Logs redact PII by default (verified in test output)
- ✅ Sample tenant config loads + wrangler dev works
- ✅ All PRs reviewed, no TODOs left in code
- ✅ M0 session documented in `.llm/sessions/2026-01-26-M0-implementation.md`

### Deployment Readiness

- ✅ `wrangler deploy --env <tenant>` succeeds for sample tenant
- ✅ Deployed worker responds to `GET /health` with 200 + tenant context
- ✅ Deployed worker resolves KV/Vectorize bindings per tenant

---

## 10. Process & Communication

### Daily Standup (Quick Sync)

- **What did I do yesterday?**
- **What am I doing today?**
- **Blockers?**

### Code Review Gate

- All PRs must reference GitHub issue #
- Tests must pass before merge
- Tenant isolation logic must be reviewed by Gemini
- Deployment scripts reviewed by Claude

### Documentation

- **Each decision** → comment in GitHub issue
- **Each blocker** → escalate to Claude + Gemini
- **Session end** → summary in `.llm/sessions/2026-01-26-M0-implementation.md`

### Escalation Path

1. Issue unblocked? → Ask question in GitHub issue comment
2. Architectural question? → Gemini reviews + approves
3. Constraint violation? → Claude makes final call
4. Dependencies blocked? → Move to M1 candidate list

---

## 11. Tools & Setup

### Nx MCP Server

- Use `mcp_nx_mcp_server_nx_workspace` to understand project structure
- Use `mcp_nx_mcp_server_nx_project_details` for individual project config
- Use `mcp_nx_mcp_server_nx_generators` to scaffold new packages

### GitHub Tools

- Use `activate_code_and_repository_search_tools` to explore repo
- Use `activate_repository_management_tools` to create branches/PRs
- Use `mcp_io_github_git_search_pull_requests` to track PR status

### Local Development

- `wrangler dev` for local testing
- `vitest --run` for tests
- `npm run lint` for ESLint checks

---

## 12. Questions for Team Alignment

### For Gemini (Planner)

1. ✅ Tenant middleware design: Where does it live? (packages/core/middleware.ts?)
2. ✅ Storage adapter interface: How strict is tenant-scoping enforcement?
3. ✅ Test coverage: What % coverage do we aim for M0? (Target: 80%+?)

### For Codex (Builder)

1. ✅ Nx scaffolding: Should we use @nx/node generators or custom?
2. ✅ Dependencies: Any package.json changes needed before M0?
3. ✅ Deployment: Should sample tenant.config.json go in /tenants or docs?

### For Claude (Orchestration)

1. ✅ GitHub Project: Should we create sub-issues for each M0 task, or use epics?
2. ✅ Rollout: Is M0 a single PR merge or phased merges per component?
3. ✅ Timeline: Target completion date for M0 (1 day, 2 days, 1 week?)

---

## 13. Next Steps (Post-Kickoff)

1. **Claude**: ✅ This briefing sent to team
2. **Claude**: Verify GitHub Project has M0 issues + acceptance criteria
3. **Gemini**: Design review session (architecture validation)
4. **Codex**: Begin Phase 1 setup (npm install, Nx verification)
5. **All**: Weekly sync on progress + blockers

---

## 14. Attachments

- [`.llm/docs/plan.md`](../docs/plan.md) — Full milestone plan
- [`.llm/docs/architecture.md`](../docs/architecture.md) — System design
- [`.llm/docs/tenancy.md`](../docs/tenancy.md) — Tenant isolation rules
- [`.llm/TODO.md`](../TODO.md) — Actionable tasks
- **GitHub Project:** https://github.com/users/rainbowkillah/projects/12

---

## 15. Sign-Off

- **Claude (Lead)**: Ready to coordinate M0
- **Gemini (Planner)**: Awaiting design review
- **Codex (Builder)**: Awaiting GitHub issue prioritization + go/no-go

**M0 Status:** 🟡 **READY PENDING GITHUB PROJECT VERIFICATION**

Once GitHub Project is verified, move to **🟢 READY TO IMPLEMENT**.

---

_Session Doc: `.llm/sessions/2026-01-26-M0-team-kickoff.md`_  
_Next Sync: Post GitHub Project review_
