# Handoff to Gemini: M0 Design Review Preparation

**Status**: 🟡 STANDBY (Review work happens in Phase 3)  
**Date**: 2026-01-26  
**From**: Claude (Architect)  
**Your Role**: Design reviewer & architecture validator for M0 Phases 2-3  

---

## TL;DR - What You Need To Do

**Current Phase**: Codex is executing Phase 1 (infrastructure setup)  
**Your Phase**: Phase 3 prep - Review tenant middleware design BEFORE Codex implements

**Timeline**:
- **Now**: Familiarize yourself with M0 constraints and architecture docs
- **After Phase 1 complete** (~2 hours): Stand by for Phase 2 (Nx project.json generation)
- **Before Phase 3 starts**: Review Issue #8 (tenant middleware) design and approve

**Critical Review**: Issue #8 (tenant resolution middleware) is THE most important architectural decision in M0. Your sign-off is required before Codex implements.

---

## Current State

### What's Complete ✅
- All planning: 4,491 lines across 10 docs in `.llm/docs/`
- GitHub Project: 12 M0 issues mapped (Issues #3-#14)
- Runtime decisions: Wrangler ^4.x + ESM (ES2022) - LOCKED by Claude
- Infrastructure: npm installed, Nx verified
- Team coordination: 4 comprehensive session documents

### What's In Progress ⏳
- **Phase 1** (Codex executing now): Monorepo scaffold + TypeScript + ESLint + Vitest + Zod schema

### What You'll Review 🔍
- **Phase 3 prep**: Tenant middleware architecture (Issue #8)
- **Phase 3 prep**: Env types strategy (Issue #13)

---

## Your Responsibilities

### 1. Review Tenant Isolation Architecture (CRITICAL)

**When**: BEFORE Codex starts Phase 3 (after Phase 1 & 2 complete)  
**What**: Issue #8 - Tenant resolution middleware design  

**Read these documents NOW:**
1. [tenancy.md](./docs/tenancy.md) - Tenant isolation strategy (458 lines)
   - Section: "Tenant Resolution Priority"
   - Section: "Storage Adapter Scoping"
   - Section: "Durable Object Naming Convention"

2. [architecture.md](./docs/architecture.md) - System design (444 lines)
   - Section: "Multi-Tenant Request Flow"
   - Section: "Middleware Stack"
   - Section: "Storage Layer Isolation"

3. [plan.md](./docs/plan.md) - Section 1.1 "Tenant isolation rules"

**Your sign-off required on**:
- Middleware-first architecture (tenant resolved BEFORE any storage/AI call)
- Durable Object ID scoping (all IDs include tenant prefix)
- Storage adapter enforcement (scoping at adapter layer, not app layer)
- Type safety across all tenant-aware components

---

### 2. Review Env Types Strategy (Issue #13)

**When**: In parallel with Phase 2 review  
**What**: Canonical binding types in `packages/core/src/env.ts`  

**Validate**:
- Single source of truth for all Cloudflare binding types
- No drift between generators and runtime code
- All consumers import from this file only
- Type consistency: Workers AI, Vectorize, KV, DO, AI Gateway

**Questions to answer**:
1. Does the env types file prevent generator/executor drift?
2. Are all binding types comprehensive enough for M0-M8?
3. Is there a type testing strategy to catch binding changes?

---

### 3. Phase 2 Observation (Optional)

**When**: After Codex completes Phase 1 (~2 hours from now)  
**What**: Issue #7 - Nx project.json generation  

**Observe** (not required to approve, but helpful context):
- How Codex uses `@naxodev/nx-cloudflare` generators
- What targets are defined (build, lint, test, dev, deploy)
- How bindings are configured in project.json

This will inform your Phase 3 review of how bindings flow from config → types → runtime.

---

## M0 Non-Negotiable Constraints (Your Checklist)

When reviewing Issue #8 (tenant middleware), validate ALL of these:

### Tenant Isolation (from tenancy.md)
- [ ] Tenant resolution happens BEFORE any storage/AI call (middleware-first)
- [ ] All Durable Object IDs include tenant prefix: `tenant-{id}-{type}-{uuid}`
- [ ] Storage adapters enforce scoping at adapter layer (not bypassable from app code)
- [ ] No cross-tenant reads/writes (unless explicit "shared" policy documented)
- [ ] Tenant context object attached to request lifecycle (typed)

### Security Defaults (from plan.md section 1.2)
- [ ] Strict request validation on every endpoint
- [ ] CORS locked down per tenant (no wildcard origins)
- [ ] Rate limiting per tenant + per IP/user key
- [ ] Redaction in logs (no PII, no tokens by default)

### Type Safety (from plan.md section 4.5)
- [ ] `packages/core/src/env.ts` is single source of truth for binding types
- [ ] All apps/packages import env types from core (no drift)
- [ ] TypeScript strict mode enforced (ES2022 target)
- [ ] No `any` types in tenant resolution or storage adapter code

### Operational Clarity (from plan.md section 1.3)
- [ ] Tenant context included in all error responses
- [ ] Metrics definitions for tenant resolution failures
- [ ] Logging schema documents tenant context fields
- [ ] Failure modes documented for multi-tenant edge cases

---

## Issue #8 Design Review Checklist

When Codex proposes the tenant middleware design, evaluate:

### Architecture Correctness
1. **Middleware placement**: Is tenant resolution the FIRST middleware in the stack?
2. **Resolution priority**: Does it follow: `header (x-tenant-id)` → `hostname` → `JWT claims`?
3. **Error handling**: What happens if tenant not found? (reject with 400 or 403?)
4. **Type safety**: Is the resolved tenant context typed (`TenantContext` interface)?

### Storage Integration
5. **Adapter layer**: Do all storage adapters receive `tenantId` as a required parameter?
6. **KV scoping**: Are KV keys prefixed with tenant ID? (e.g., `tenant:{id}:cache:{key}`)
7. **DO scoping**: Are DO IDs constructed as `tenant-{id}-{type}-{uuid}`?
8. **Vectorize scoping**: Does Vectorize query include tenant filter metadata?

### Security & Validation
9. **Validation**: Is `tenantId` validated against allowed format (lowercase, alphanumeric, hyphens)?
10. **CORS**: Is CORS policy loaded from tenant config and enforced per tenant?
11. **Rate limiting**: Are rate limits enforced per tenant (not global)?
12. **Audit logging**: Are tenant resolution events logged (success + failure)?

### Implementation Quality
13. **Code organization**: Is middleware code in `packages/core/src/middleware/`?
14. **Testing**: Are there unit tests for all resolution paths (header, hostname, JWT)?
15. **Error messages**: Do errors include tenant context for debugging?
16. **Documentation**: Is there a clear docstring explaining resolution priority?

---

## Issue #13 Design Review Checklist

When Codex proposes the env types file, evaluate:

### Type Completeness
1. **All bindings covered**: Workers AI, Vectorize, KV, DO, AI Gateway, R2 (if used), D1 (if used)
2. **Correct types**: Using `@cloudflare/workers-types` as base?
3. **Extensibility**: Can new binding types be added without breaking changes?

### Usage Patterns
4. **Single import**: All consumers import from `packages/core/src/env.ts`?
5. **No duplication**: No local type redefinitions in apps/packages?
6. **Generator alignment**: Do Nx generators use these types for code generation?

### Testing
7. **Type tests**: Are there tests verifying binding types match runtime?
8. **Build-time checks**: Does TypeScript compilation fail if bindings are misconfigured?

---

## Key Documents for Your Review

**Must Read NOW (Before Phase 3)**:
1. [tenancy.md](./docs/tenancy.md) - Tenant isolation rules (458 lines)
2. [architecture.md](./docs/architecture.md) - Multi-tenant flow (444 lines)
3. [plan.md](./docs/plan.md) - Sections 1.1, 1.2, 1.3, 4.5

**Read When Codex Proposes Design**:
4. [security.md](./docs/security.md) - Secrets, binding isolation
5. [failure-modes.md](./docs/failure-modes.md) - Error scenarios

**Reference During Review**:
6. [API contracts](./docs/api-contracts.md) - Endpoint specs (for context on middleware use)
7. [Testing strategy](./docs/testing.md) - Test requirements for middleware

**GitHub Issues**:
- Issue #8: https://github.com/users/rainbowkillah/projects/12 (search "tenant resolution middleware")
- Issue #13: https://github.com/users/rainbowkillah/projects/12 (search "env typings")

---

## Communication Protocol

### When Codex Completes Phase 1
- Codex will update `.llm/TODO.md` marking Phase 1 tasks complete
- You'll see a handoff note in `.llm/sessions/2026-01-26-phase-1-complete.md`
- **Action**: Acknowledge and begin reading Issue #8 details

### When Codex Proposes Phase 3 Design
- Codex will create a design document (likely `.llm/sessions/2026-01-26-phase-3-design-proposal.md`)
- **Action**: Review against your checklist above
- **Response**: Approve (✅) or Request Changes (🔴) with specific feedback

### Approval Format
```markdown
## Gemini Phase 3 Design Review - Issue #8

**Status**: ✅ APPROVED / 🔴 CHANGES REQUESTED

### Architecture Review
- [x] Middleware-first tenant resolution
- [x] Correct resolution priority (header → hostname → JWT)
- [x] Storage adapter scoping enforced
- [x] Type safety maintained

### Security Review
- [x] Tenant validation implemented
- [x] CORS per-tenant enforcement
- [x] Rate limiting per-tenant
- [x] Audit logging present

### Concerns / Change Requests
[None / List specific concerns with line references]

**Recommendation**: PROCEED with Phase 3 implementation / BLOCK until concerns addressed

---
*Review completed: 2026-01-26 by Gemini*
```

---

## Blockers & Escalation

### Escalate to Claude if:
1. Codex proposes bypassing tenant isolation constraints
2. Storage adapters allow app-layer scoping (violates architecture)
3. Env types strategy creates generator/executor drift
4. Any deviation from documented constraints in `tenancy.md`

### Do NOT approve if:
- Tenant can be null/undefined in storage calls
- Durable Object IDs don't include tenant prefix
- KV keys don't include tenant scoping
- Storage adapters callable without tenant context

---

## Timeline & Milestones

| Phase | Duration | Your Role | Status |
|-------|----------|-----------|--------|
| **Phase 1** | 2h | Observe (optional) | ⏳ In progress (Codex) |
| **Phase 2** | 1h | Observe (optional) | 🔜 Blocked by Phase 1 |
| **Phase 3** | 2h | **REVIEW REQUIRED** | 🔜 Blocked by Phase 2 |
| **Phase 4** | 2h | Observe (optional) | 🔜 Blocked by Phase 3 |
| **Phase 5** | 1h | Validation support | 🔜 Blocked by Phase 4 |

**Your critical window**: Between Phase 2 complete and Phase 3 start (~3 hours from now, assuming 2h Phase 1 + 1h Phase 2).

---

## Success Criteria (Your Deliverables)

### Before Phase 3 Starts
- [ ] Read tenancy.md, architecture.md, plan.md sections 1.1-1.3
- [ ] Understand tenant isolation constraints (middleware-first, storage scoping, DO naming)
- [ ] Familiarize with Issue #8 acceptance criteria from GitHub

### During Phase 3 Design Review
- [ ] Review Codex's tenant middleware design proposal
- [ ] Validate against 16-item design checklist (above)
- [ ] Validate env types strategy (Issue #13) against 8-item checklist
- [ ] Provide written approval or change requests

### After Phase 3 Implementation
- [ ] Verify implementation matches approved design
- [ ] Confirm tests cover all tenant resolution paths
- [ ] Sign off on Phase 3 completion (gates Phase 4)

---

## Quick Reference: M0 Architecture Decisions

**Locked by Claude (Do NOT question these)**:
- Wrangler: ^4.x (v4.26.0)
- Module Format: ESM (ES2022, no service-worker)
- TypeScript: strict mode, ES2022 target
- Build: esbuild ESM single-bundle
- Testing: Vitest (unit) + miniflare (integration)

**Open for Your Review (Phase 3)**:
- Tenant resolution implementation strategy
- Storage adapter interface design
- Env types organization and import patterns
- Middleware stack ordering

**Out of Scope (Do NOT review)**:
- Phase 1 infrastructure (pre-approved, Codex executing)
- Phase 2 Nx configuration (not architecture-critical)
- Phase 4 local dev setup (tooling, not architecture)

---

## Final Notes

- **Your role is critical**: Tenant isolation is non-negotiable, and your review ensures Codex builds it correctly
- **Be thorough but timely**: Your review blocks Phase 3, so aim for <1 hour turnaround
- **Ask questions**: If anything in tenancy.md or architecture.md is unclear, escalate to Claude NOW
- **Trust the process**: All planning is complete, constraints are documented, your job is to validate adherence

**The team is counting on you to catch architectural issues before they're coded. Be rigorous.** 🔍

---

*Handoff created: 2026-01-26 by Claude*  
*Questions? Check tenancy.md or escalate to Claude for architecture decisions*
