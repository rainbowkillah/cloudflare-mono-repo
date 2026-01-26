# Prompt for Codex: M0 Phase 1 Implementation

**Date**: 2026-01-26  
**Mission**: Execute M0 Phase 1 infrastructure scaffolding (2 hours, 6 parallel tasks)  
**Status**: 🟢 READY TO START NOW  

---

## What You're Picking Up

✅ **Team coordination complete** - All planning, GitHub verification, runtime decisions locked  
✅ **Runtime decisions finalized** - Wrangler ^4.x, ESM (ES2022), strict TypeScript  
✅ **npm install complete** - 852 packages ready, 0 vulnerabilities  
✅ **Nx verified working** - v22.4.1 with all 8 plugins loaded  

**Your role**: Build Phase 1 infrastructure so Phase 2-5 can execute sequentially.

---

## Phase 1: Infrastructure Scaffolding (6 Parallel Tasks)

### Task 1: Issue #3 - Monorepo Directory Structure
**Acceptance Criteria**:
- [ ] Create `/apps/worker-api/` directory
- [ ] Create `/apps/ingest-worker/` directory (optional separation)
- [ ] Create `/packages/core/src/` directory
- [ ] Create `/packages/storage/src/` directory
- [ ] Create `/packages/rag/src/` directory
- [ ] Create `/packages/observability/src/` directory
- [ ] Create `/packages/testing/src/` directory
- [ ] Create `/tenants/mrrainbowsmoke/` and `/tenants/rainbowsmokeofficial/` (already exist in workspace config)
- [ ] Create `/scripts/` directory
- [ ] Create `/tests/unit/`, `/tests/integration/`, `/tests/e2e/` directories
- [ ] Verify all directories are in .llm/docs/plan.md section 3.1 "Proposed folder structure"

**Reference**: See [plan.md](../docs/plan.md) section 3.1 for target structure  
**Owner**: You (Codex)  
**Time Est.**: 15 min

---

### Task 2: Issue #4 - TypeScript Configuration + tsconfig.base.json
**Acceptance Criteria**:
- [ ] Create `tsconfig.base.json` at repo root with:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ES2022",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "strict": true,
      "esModuleInterop": false,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "declaration": true,
      "sourceMap": true,
      "paths": {
        "@org/core/*": ["packages/core/src/*"],
        "@org/storage/*": ["packages/storage/src/*"],
        "@org/rag/*": ["packages/rag/src/*"],
        "@org/observability/*": ["packages/observability/src/*"],
        "@org/testing/*": ["packages/testing/src/*"]
      }
    }
  }
  ```
- [ ] Create `tsconfig.json` (extends tsconfig.base.json) at repo root
- [ ] Each app (worker-api, ingest-worker) has its own tsconfig.json extending base
- [ ] Each package (core, storage, rag, observability, testing) has its own tsconfig.json extending base
- [ ] `npx tsc --noEmit` passes (type checking only, no build)

**Decision Reference**: See [2026-01-26-issue-14-decision.md](./2026-01-26-issue-14-decision.md) for TypeScript config details  
**Owner**: You (Codex)  
**Time Est.**: 20 min

---

### Task 3: Issue #5 - ESLint + Prettier Configuration
**Acceptance Criteria**:
- [ ] Create `.eslintrc.json` with:
  - TypeScript plugin enabled (@typescript-eslint)
  - Nx recommended rules
  - Prettier integration (eslint-config-prettier at end of extends)
  - Rules: no-unused-vars (TypeScript variant), no-implicit-any, etc.
- [ ] Create `.prettierrc.json` with:
  - printWidth: 100
  - semi: true
  - singleQuote: true
  - trailingComma: 'es5'
- [ ] `npm run lint` passes (linting only, no fixes)
- [ ] `npm run format` runs prettier (add script to package.json)
- [ ] Update package.json scripts:
  - `"lint": "nx lint"`
  - `"format": "prettier --write ."`
  - `"lint:fix": "nx lint --fix"`

**Reference**: ESLint + TypeScript best practices  
**Owner**: You (Codex)  
**Time Est.**: 15 min

---

### Task 4: Issue #6 - Vitest Configuration
**Acceptance Criteria**:
- [ ] Create `vitest.workspace.ts` at repo root (partially exists, verify)
- [ ] Configure Vitest with:
  - Environment: `node` (no jsdom, workers don't have browser globals)
  - Include: `['packages/**/*.test.ts', 'apps/**/*.test.ts']`
  - Parallel: enabled
  - Coverage: enabled (v8 provider already in package.json)
  - Pool: 'threads'
- [ ] Create sample test file `packages/core/src/__tests__/example.test.ts` with passing test
- [ ] `npm test` runs all tests and passes
- [ ] Coverage reports generated to `coverage/` directory

**Reference**: Vitest docs + @cloudflare/vitest-pool-workers in package.json  
**Owner**: You (Codex)  
**Time Est.**: 20 min

---

### Task 5: Issue #9 - tenant.config.json Schema + Zod Validation
**Acceptance Criteria**:
- [ ] Create `packages/core/src/tenant-config.ts` with Zod schema:
  ```typescript
  import { z } from 'zod';

  export const TenantConfigSchema = z.object({
    tenantId: z.string().min(1),
    accountId: z.string().optional(),
    hostnameMapping: z.record(z.string()).optional(),
    ai: z.object({
      models: z.array(z.string()),
      gatewayRoutes: z.record(z.string()).optional(),
      budgets: z.object({
        tokensPerDay: z.number().optional(),
        requestsPerMinute: z.number().optional()
      }).optional()
    }).optional(),
    vectorize: z.object({
      indexNames: z.array(z.string()).optional()
    }).optional(),
    kv: z.object({
      namespaceMappings: z.record(z.string()).optional()
    }).optional(),
    durable_objects: z.object({
      classBindings: z.record(z.string()).optional()
    }).optional(),
    cors: z.object({
      origins: z.array(z.string()).optional(),
      allowCredentials: z.boolean().optional()
    }).optional(),
    featureFlags: z.record(z.boolean()).optional()
  });

  export type TenantConfig = z.infer<typeof TenantConfigSchema>;
  ```
- [ ] Create `tenants/mrrainbowsmoke/tenant.config.json` with sample valid config
- [ ] Create `tenants/rainbowsmokeofficial/tenant.config.json` with sample valid config
- [ ] Write unit test: `packages/core/src/__tests__/tenant-config.test.ts`
  - Test: valid config passes validation
  - Test: invalid config fails validation with clear error
- [ ] `npm test` passes for tenant config tests

**Reference**: Zod is already in package.json, plan.md section 3.2 for minimum fields  
**Owner**: You (Codex)  
**Time Est.**: 25 min

---

### Task 6: Issue #14 - Document Runtime Decisions (Already Completed by Claude)
**Status**: ✅ Already done by Claude  
- [x] plan.md section 4.5 added with full runtime decisions
- [x] 2026-01-26-issue-14-decision.md created with decision rationale
- [x] Wrangler ^4.x locked (v4.26.0 in package.json)
- [x] ESM (ES2022) locked as module format

**Your action**: Verify these are in place and reference them when creating TypeScript/build configs.

---

## Critical Dependencies & Sequencing

### No Build Blockers
- All 6 tasks are **parallel** - work on them simultaneously
- Task 1 (directories) is prerequisite for Tasks 2-5 (create dir structure first)
- Task 6 (runtime decisions) is informational only - already done

### Execution Order Recommendation
1. Task 1 (directories) - 15 min, unblocks 2-5
2. Start Tasks 2-5 in parallel once Task 1 done
3. Task 6 verification (5 min, after everything)

### Total Time: 2 hours (parallel execution)

---

## What Phase 1 Enables (Phase 2+)

✅ **Phase 2 (Issue #7)**: Nx project.json generation - blocked until Phase 1 complete  
✅ **Phase 3 (Issues #8, #13)**: Tenant middleware - blocked until Phase 2 complete  
✅ **Phase 4 (Issues #10-12)**: Local dev + error handling - blocked until Phase 3 complete  
✅ **Phase 5**: Validation - blocked until Phase 4 complete  

**Critical path**: Phase 1 → Phase 2 → Phase 3 (tenant middleware is blocker for Phase 4+)

---

## Acceptance Criteria for Phase 1 Complete

Phase 1 is COMPLETE when **ALL of the following pass**:

1. **Directory Structure**: All directories from plan.md section 3.1 exist
2. **TypeScript**: 
   - `tsconfig.base.json` at repo root with ES2022 target/module, strict mode
   - Each app/package has tsconfig.json extending base
   - `npx tsc --noEmit` passes
3. **ESLint + Prettier**:
   - `.eslintrc.json` and `.prettierrc.json` exist
   - `npm run lint` passes
   - `npm run format` runs successfully
4. **Vitest**:
   - `vitest.workspace.ts` configured
   - Sample test in packages/core runs and passes
   - `npm test` succeeds
5. **Tenant Config**:
   - Zod schema in `packages/core/src/tenant-config.ts`
   - Sample configs in both tenant folders
   - Unit tests pass
6. **Build Verification**:
   - No TypeScript errors: `npx tsc --noEmit`
   - Linting passes: `npm run lint`
   - Tests pass: `npm test`

---

## GitHub Integration

### Before You Start
1. Create branch: `git checkout -b feat/M0-phase-1-infrastructure`
2. Link all 6 issues in branch description
3. Mark issues as "In Progress" on GitHub Project

### As You Complete Each Task
1. Commit with message: `feat(M0): Issue #X - [task name]`
2. Update GitHub issue with implementation notes
3. Link commits to issue

### When Phase 1 Complete
1. Create PR: `feat/M0-phase-1-infrastructure`
2. Description: Link all 6 completed issues
3. Ready for Gemini + Claude review before Phase 2

---

## Reference Documents (Read These First)

### Critical Reading (10 min)
1. [plan.md](../docs/plan.md) - Sections 0-3.2 (executive summary, architecture, layout)
2. [2026-01-26-issue-14-decision.md](./2026-01-26-issue-14-decision.md) - Runtime decisions (Wrangler, ESM, TS config)
3. [2026-01-26-M0-infrastructure-ready.md](./2026-01-26-M0-infrastructure-ready.md) - Full Phase 1-5 plan with dependencies

### For Deep Context (Optional)
- [tenancy.md](../docs/tenancy.md) - Tenant isolation rules (needed later in Phase 3)
- [architecture.md](../docs/architecture.md) - System design (context for middleware decisions)
- [GitHub Project](https://github.com/users/rainbowkillah/projects/12) - Issues #3-14 (M0 tasks)

---

## Constraints You MUST Enforce in Phase 1

1. **Strict TypeScript**: No `any` types, strict null checking enabled
2. **ESM Only**: No CommonJS in workers code (ESM modules only)
3. **ES2022 Target**: Use modern syntax (async/await, top-level await, etc.)
4. **No Secrets**: .env files should be in .gitignore (template them as .env.example)
5. **Type Safety**: All env/config types must be validated with Zod or TypeScript interfaces

---

## Tools & Commands at Your Disposal

```bash
# Verify tools are installed
npm --version          # Should show npm 10+
node --version         # Should show node 20+
npx nx --version       # Should show 22.4.1

# Nx commands to use
npx nx list            # Show all plugins and setup

# TypeScript
npx tsc --version      # Should show 5.9.2
npx tsc --noEmit       # Type check only

# Linting
npm run lint           # ESLint
npm run format         # Prettier

# Testing
npm test               # Vitest
npm run test:coverage  # With coverage

# Git
git checkout -b feat/M0-phase-1-infrastructure
git add .
git commit -m "feat(M0): [description]"
git push origin feat/M0-phase-1-infrastructure
```

---

## Success Definition

🎯 **Phase 1 Success**: 
- All 6 tasks completed and passing
- `npm install && npm run lint && npm test` all pass
- Nx ready for project.json generation (Phase 2)
- Team ready to proceed to Phase 2 (Issue #7)

---

## Questions or Blockers?

- **Build issues**: Check `.llm/docs/plan.md` section 4.4-4.5 (blockers & runtime decisions)
- **Type safety**: Refer to 2026-01-26-issue-14-decision.md (TypeScript config)
- **Tenant config**: Check .llm/docs/tenancy.md (tenant isolation rules)
- **Design questions**: Ask Gemini (they're reviewing middleware design in parallel)
- **Architecture decisions**: Ask Claude (they're gating Phase 2)

---

**You're all set. Phase 1 is unblocked. Let's build.** 🚀

---

*Created: 2026-01-26 by Claude*  
*For: Codex (Phase 1-4 execution)*  
*Status: READY TO EXECUTE*
