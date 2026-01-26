# Prompt for Gemini: Design Review & Middleware Architecture

**Date**: 2026-01-26  
**Mission**: Review tenant middleware design (Issue #8) + binding strategy (Issue #13)  
**Parallel Activity**: Codex executing Phase 1 infrastructure (2 hours)  
**Timeline**: Start review now, approval needed before Codex Phase 3 (middleware implementation)  

---

## What You're Picking Up

✅ **Planning complete** - M0 5-phase architecture defined, GitHub Project aligned  
✅ **Phase 1 in progress** - Codex building infrastructure (Issues #3-6, #9, #14)  
✅ **Your role**: Design validation for critical path (Issues #8, #13)  

**Critical Path**: Issues #8 + #9 are dependency blockers - everything in Phases 2-5 depends on them.

---

## Your Mission (Two Parallel Reviews)

### Review 1: Issue #8 - Tenant Resolution Middleware Design (CRITICAL)
**Timing**: Begin now (parallel with Codex Phase 1), approve before Codex Phase 3  

**What Needs Design Validation**:
1. **Tenant Resolution Strategy**: How tenant context is determined per request
   - Header-based: `x-tenant-id` header
   - Hostname-based: subdomain routing (e.g., tenant.example.com)
   - JWT claims: tenant ID in JWT sub/custom claims
   - Priority order: header > hostname > JWT (configurable per tenant)
   
2. **Middleware Architecture**: Where tenant resolution happens in request lifecycle
   - **MUST**: Resolve tenant BEFORE any storage call (KV, DO, Vectorize)
   - **MUST**: Attach tenant context object to request (Cloudflare Request context)
   - **MUST**: All downstream handlers receive resolved tenant
   - **QUESTION**: How to integrate with Cloudflare middleware/handler pattern?
   
3. **Error Handling**: What happens if tenant cannot be resolved
   - 401 Unauthorized if header required but missing
   - 403 Forbidden if tenant not authorized for hostname
   - Clear error messages (no information leakage)
   - Error logged with request ID + attempted tenant values
   
4. **Tenant Isolation Enforcement**: How to prevent cross-tenant access
   - All storage adapters receive tenant ID as parameter
   - All KV keys prefixed with tenant (e.g., "tenant-{id}-{key}")
   - All DO IDs include tenant (e.g., "tenant-{id}-sessions-{uuid}")
   - All Vectorize queries filtered by tenant metadata
   - **APP LAYER CANNOT BYPASS** (must be enforced at adapter layer)

**Reference Materials** (READ THESE FIRST):
- [plan.md](../docs/plan.md) sections 1.1 (tenant isolation rules) + 4.5 (runtime decisions)
- [tenancy.md](../docs/tenancy.md) - Full tenant isolation strategy document
- [architecture.md](../docs/architecture.md) - System design + multi-tenant flow
- [API Contracts](../docs/api-contracts.md) - Request/response shapes including tenant context

**Design Review Questions** (Answer These):

1. **Middleware Integration**:
   - [ ] Proposed implementation approach (Cloudflare middleware vs. handler wrapper)?
   - [ ] How does tenant context flow through async handlers?
   - [ ] Can we enforce type safety (tenant context always present)?
   - [ ] Is tenant resolution idempotent (safe to call multiple times)?

2. **Error Scenarios**:
   - [ ] What happens if multiple tenant indicators conflict (e.g., header says tenant-A, hostname says tenant-B)?
   - [ ] How do we debug failed tenant resolution in production logs?
   - [ ] Should we expose tenant resolution attempts in error response?

3. **Performance**:
   - [ ] Is tenant resolution zero-cost (computed once, cached)?
   - [ ] Does middleware add measurable latency?
   - [ ] Can we batch tenant context lookups (if we need to fetch from KV)?

4. **Security**:
   - [ ] Can tenant context be spoofed (e.g., by header manipulation)?
   - [ ] How do we validate JWT tenant claims (JWT signature verification)?
   - [ ] Is there a fallback if all resolution methods fail?

5. **Type Safety**:
   - [ ] Is tenant context typed (can't be undefined at handler layer)?
   - [ ] Can we use TypeScript types to enforce middleware -> handler contract?
   - [ ] Should we export types from packages/core/src/env.ts or separate module?

**Deliverable for Codex Phase 3**:
- Detailed design doc or PR comments with:
  - Approved middleware architecture
  - Tenant context shape (TypeScript interface)
  - Error handling strategy
  - Performance assumptions
  - Security validation checklist

**Acceptance Criteria**:
- [ ] Design prevents all known cross-tenant attack vectors
- [ ] Design enforces tenant isolation at adapter layer (not app layer)
- [ ] Error handling is clear and non-leaky
- [ ] Type safety prevents runtime tenant context being undefined
- [ ] Codex can implement middleware from design without ambiguity

---

### Review 2: Issue #13 - Env Types Source of Truth (IMPORTANT)

**Timing**: Begin after Issue #8 design approved, or in parallel if time allows  

**What Needs Design Validation**:

1. **Env Types Canonical Source**: packages/core/src/env.ts
   - Single file defining ALL Cloudflare binding types
   - Never falls out of sync with actual worker bindings
   - All consumers (worker-api, storage adapters, generators) import from here
   
2. **Current Status**:
   - @cloudflare/workers-types already in package.json (v4.20250404.0)
   - Need to create canonical wrapper (packages/core/src/env.ts)
   
3. **Design Questions** (Answer These):

   a) **Shape of env.ts**:
      ```typescript
      // Option A: Export Env interface directly
      export interface Env {
        KV: KVNamespace;
        SESSIONS: DurableObjectNamespace;
        VECTORIZE: Vectorize;
        AI: Ai;
        // ... etc
      }

      // Option B: Export per-binding getter functions
      export const getKV = (env: Env) => env.KV;
      export const getSessions = (env: Env) => env.SESSIONS;
      // ... etc

      // Option C: Re-export @cloudflare/workers-types types
      export type { Env } from '@cloudflare/workers-types';
      ```
      - [ ] Which approach prevents type drift best?
      - [ ] Which approach is easiest for Nx generators to consume?
      - [ ] Can we validate env at runtime (Zod validation of binding presence)?

   b) **Binding Inventory**:
      - [ ] What is the complete list of bindings for M0 (worker-api minimal set)?
      - [ ] Which bindings are optional vs. required?
      - [ ] Should we export types for M1+ bindings too (Sessions DO, rate limiter DO)?
      - [ ] How do tenant-specific bindings fit (per-tenant KV namespace)?

   c) **Consumer Integration**:
      - [ ] How do storage adapters import and use Env types?
      - [ ] How do generators (Nx plugin) consume this to validate scaffold?
      - [ ] Can we type-check generators against actual env.ts?

   d) **Testing**:
      - [ ] How do we test env.ts types (without actual Cloudflare account)?
      - [ ] Can Vitest mock Cloudflare bindings for type validation?
      - [ ] Should we include runtime validation (Zod)?

**Deliverable for Codex Phase 3**:
- Approved env.ts structure (shape, binding inventory, validation approach)
- Strategy for keeping env.ts in sync with wrangler.jsonc bindings
- Type validation tests (if applicable)

**Acceptance Criteria**:
- [ ] env.ts prevents all known binding type drift scenarios
- [ ] env.ts types are consumable by storage adapters + generators
- [ ] env.ts can be validated at runtime (Zod or TypeScript types)
- [ ] Consumer code (worker-api, adapters) can be type-checked against env.ts

---

## Critical Constraints You MUST Enforce

### Tenant Isolation (Non-Negotiable)
✅ Middleware resolves tenant BEFORE any storage call  
✅ All storage adapters receive tenant ID as required parameter  
✅ All KV keys, DO IDs, Vectorize queries include tenant prefix/filter  
✅ App layer CANNOT bypass tenant scoping (enforced at adapter layer)  

### Security Defaults (Non-Negotiable)
✅ Tenant resolution cannot be spoofed (validate JWT, check hostname)  
✅ Error messages don't leak tenant resolution attempts  
✅ All bindings must be explicitly declared in env.ts (no implicit bindings)  

### Type Safety (Non-Negotiable)
✅ Env types never fall out of sync with wrangler.jsonc  
✅ Tenant context always present at handler layer (TypeScript types enforce this)  
✅ Storage adapters require tenant as parameter (compile-time check)  

---

## Parallel Activities (While Codex Builds Phase 1)

### What Codex Is Doing (Issues #3-6, #9, #14)
- Creating directory structure
- Setting up TypeScript (ES2022, strict mode)
- Configuring ESLint + Prettier + Vitest
- Creating tenant.config.json schema with Zod
- Documenting runtime decisions

### What You Should Do
- Review tenancy.md + architecture.md (30 min)
- Answer design questions for Issues #8 + #13
- Prepare approval/feedback for Codex Phase 3
- Escalate any conflicts with existing architecture docs

### What Claude Will Do
- Monitor Phase 1 progress
- Gate Phase 2 start (Nx project.json generation)
- Prepare Phase 2 execution

---

## Timeline & Dependencies

```
NOW (2026-01-26):
  ├─ Codex: Phase 1 (2 hours, Issues #3-6, #9, #14)
  └─ Gemini: Design review (Issues #8, #13) - parallel

AFTER Phase 1 (est. 2 hours):
  ├─ Codex: Phase 2 (1 hour, Issue #7) - Nx project.json
  └─ Gemini: Approve Issue #8 design or request changes

AFTER Phase 2:
  └─ Codex: Phase 3 (2 hours, Issues #8, #13) - Middleware implementation
     └─ USES Gemini's approved design from Issue #8

AFTER Phase 3:
  ├─ Codex: Phase 4 (2 hours, Issues #10-12)
  └─ Claude: Phase 5 validation
```

**CRITICAL**: Issue #8 design approval blocks Codex Phase 3. Get this right.

---

## Reference Documents (READ IN THIS ORDER)

### Essential (30 min)
1. [tenancy.md](../docs/tenancy.md) - Tenant isolation rules + validation gates
2. [architecture.md](../docs/architecture.md) - System design + multi-tenant flow
3. [plan.md](../docs/plan.md) section 1.1 - Hard constraints

### Important (20 min)
4. [API Contracts](../docs/api-contracts.md) - Request/response shapes
5. [plan.md](../docs/plan.md) section 4.5 - Runtime decisions (TypeScript, ESM, etc.)

### Reference
6. [2026-01-26-M0-infrastructure-ready.md](./2026-01-26-M0-infrastructure-ready.md) - Full Phase 1-5 plan
7. [GitHub Project](https://github.com/users/rainbowkillah/projects/12) - Issues #8, #13

---

## Your Deliverables

### Deliverable 1: Issue #8 Design Approval
**Format**: Comment on GitHub Issue #8 or design doc with:
- [ ] Approved middleware architecture (pseudocode or diagram)
- [ ] Tenant context shape (TypeScript interface)
- [ ] Error handling strategy (all scenarios)
- [ ] Security validation checklist
- [ ] Type safety enforcement approach
- [ ] Status: ✅ APPROVED or 🔄 NEEDS REVISION

**Timing**: Before Codex Phase 3 starts (ideally within 4 hours)

### Deliverable 2: Issue #13 Design Approval
**Format**: Comment on GitHub Issue #13 or design doc with:
- [ ] Approved env.ts structure
- [ ] Binding inventory (complete list for M0 + future-proofing notes)
- [ ] Type validation approach (Zod, TypeScript, runtime checks)
- [ ] Strategy for sync with wrangler.jsonc
- [ ] Consumer integration examples (storage adapters, generators)
- [ ] Status: ✅ APPROVED or 🔄 NEEDS REVISION

**Timing**: Before Codex Phase 3 starts (can follow Issue #8 approval)

### Deliverable 3: Risk Assessment
**If any design questions remain unanswered**:
- Flag as "RISK" with severity (HIGH, MEDIUM, LOW)
- Propose mitigation
- Escalate to Claude if needed

---

## Success Definition

🎯 **Design Review Success**:
- Issue #8 middleware design is approved and unambiguous
- Issue #13 env types strategy is decided
- Codex can implement Phase 3 (middleware + env types) without design ambiguity
- No cross-tenant vulnerabilities in approved design
- All type safety constraints enforced

---

## Questions or Need Clarification?

- **Middleware architecture**: Review tenancy.md section "Tenant Resolution Strategy"
- **Type safety**: Review plan.md section 4.5 + package.json for @cloudflare/workers-types
- **Binding strategy**: Review architecture.md section "Binding Types Mapping"
- **GitHub issues**: See Issues #8, #13 for acceptance criteria
- **Ask Codex**: If they have questions during Phase 1 that affect your design
- **Ask Claude**: If there's a conflict between your design and existing constraints

---

**Your role is critical. Get these designs right so Codex can implement cleanly.** ✅

---

*Created: 2026-01-26 by Claude*  
*For: Gemini (Design review for Phase 3)*  
*Status: READY TO REVIEW*  
*Parallel with: Codex Phase 1 execution*
