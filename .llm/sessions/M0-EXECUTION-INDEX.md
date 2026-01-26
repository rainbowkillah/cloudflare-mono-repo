# M0 Execution Index — Where to Start

**Date**: 2026-01-26  
**Status**: ✅ **READY TO EXECUTE**  
**Audience**: Codex, Gemini, Claude (and future team members)

---

## Quick Start (5 Minutes)

### If You're **Codex** (Builder)
1. **Read this first**: [PROMPT-FOR-CODEX-PHASE-1.md](./PROMPT-FOR-CODEX-PHASE-1.md)
2. **Then**: Start Phase 1 (6 parallel tasks, 2 hours)
3. **GitHub**: Create branch `feat/M0-phase-1-infrastructure`
4. **Link**: All Phase 1 issues (#3-6, #9, #14)

### If You're **Gemini** (Designer)
1. **Read this first**: [PROMPT-FOR-GEMINI-DESIGN-REVIEW.md](./PROMPT-FOR-GEMINI-DESIGN-REVIEW.md)
2. **Then**: Review Issue #8 (middleware) + Issue #13 (env types)
3. **Approve**: Design before Codex Phase 3 starts
4. **GitHub**: Comment on Issues #8, #13 with approved design

### If You're **Claude** (Monitor)
1. **Read this first**: [TEAM-HANDOFF-CODEX-GEMINI.md](./TEAM-HANDOFF-CODEX-GEMINI.md)
2. **Then**: Monitor Phase 1 progress + gate Phase 2
3. **Decide**: Issue #14 decisions locked (Wrangler ^4.x, ESM)
4. **Escalate**: Any deviations from constraints in [plan.md](../docs/plan.md) section 1

---

## Document Map (What's Where)

### Your Execution Prompts
| File | Audience | Purpose | Action |
|------|----------|---------|--------|
| [PROMPT-FOR-CODEX-PHASE-1.md](./PROMPT-FOR-CODEX-PHASE-1.md) | Codex | 6 Phase 1 tasks with acceptance criteria | **START HERE** |
| [PROMPT-FOR-GEMINI-DESIGN-REVIEW.md](./PROMPT-FOR-GEMINI-DESIGN-REVIEW.md) | Gemini | Design review for Issues #8, #13 | **START HERE** |
| [TEAM-HANDOFF-CODEX-GEMINI.md](./TEAM-HANDOFF-CODEX-GEMINI.md) | All | Overview + coordination checklist | **READ THIS** |

### Reference Materials (Coordination)
| File | Purpose | Read Time |
|------|---------|-----------|
| [2026-01-26-M0-team-kickoff.md](./2026-01-26-M0-team-kickoff.md) | Full team briefing + context (3,600+ lines) | 30 min |
| [2026-01-26-M0-github-project-verification.md](./2026-01-26-M0-github-project-verification.md) | GitHub Project verification + phase mapping | 20 min |
| [2026-01-26-M0-infrastructure-ready.md](./2026-01-26-M0-infrastructure-ready.md) | Infrastructure verification + readiness status | 15 min |
| [2026-01-26-issue-14-decision.md](./2026-01-26-issue-14-decision.md) | Issue #14 runtime decisions (Wrangler, ESM) | 10 min |
| [2026-01-26-PHASE-1-UNBLOCKED.md](./2026-01-26-PHASE-1-UNBLOCKED.md) | Status: Phase 1 execution unblocked | 5 min |

### Canonical Planning Documents
| File | Purpose | Audience |
|------|---------|----------|
| [plan.md](../docs/plan.md) | Executive summary + 8 milestones (M0-M8) | Everyone |
| [tenancy.md](../docs/tenancy.md) | Tenant isolation rules + validation gates | Codex (Phase 3), Gemini (design review) |
| [architecture.md](../docs/architecture.md) | System design + multi-tenant flow | Codex (Phase 3+), Gemini (design) |
| [api-contracts.md](../docs/api-contracts.md) | API specs (/chat, /search, /tools/execute) | Codex (Phase 3+) |
| [testing.md](../docs/testing.md) | Vitest + Miniflare strategy | Codex (Phase 1 onwards) |
| [security.md](../docs/security.md) | Secrets, isolation, data classification | Codex (Phase 1+), Gemini (design) |

### Coordination Tracking
| File | Purpose |
|------|---------|
| [TODO.md](../TODO.md) | 10-item task list (3 complete, 7 in-progress) |
| [CHANGELOG.md](../CHANGELOG.md) | Change history (updated per milestone) |
| [GitHub Project](https://github.com/users/rainbowkillah/projects/12) | Single source of truth (122 issues, 12 for M0) |

---

## Execution Timeline (M0 Master Schedule)

```
2026-01-26 (NOW):
├─ Codex Phase 1: Infrastructure scaffolding (2 hours)
│  └─ Issues #3, #4, #5, #6, #9, #14 (parallel)
│
└─ Gemini: Design review (parallel, 1 hour)
   └─ Issues #8, #13 (tenant middleware + env types)

+2 hours:
├─ Codex Phase 2: Nx project.json registration (1 hour)
│  └─ Issue #7
│
└─ Gemini: Issue #8 design approval needed

+3 hours:
├─ Codex Phase 3: Tenant middleware + env types (2 hours)
│  └─ Issues #8, #13 (using Gemini's approved design)
│
└─ Claude: Phase 2 gate (confirm project.json working)

+5 hours:
├─ Codex Phase 4: Local dev setup + error handling (2 hours)
│  └─ Issues #10, #11, #12
│
└─ Claude: Phase 3 gate (confirm middleware working)

+7 hours:
└─ Claude Phase 5: M0 validation (1 hour)
   └─ Verify: npm, Nx, tests, tenant isolation

TOTAL M0 TIME: ~8 hours wall clock (some parallel work)
CRITICAL PATH: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

---

## Critical Dependencies

```
PHASE 1 (Issues #3-6, #9, #14)
    ↓ (unblocked: npm install done, Nx verified)
PHASE 2 (Issue #7 - Nx projects)
    ↓ (blocked until Phase 1 complete)
PHASE 3 (Issues #8, #13 - Middleware)
    ↓ (blocked until Phase 2 + Gemini approval)
PHASE 4 (Issues #10-12 - Local dev)
    ↓ (blocked until Phase 3 complete)
PHASE 5 (Validation)
    ↓ (blocked until Phase 4 complete)
M0 COMPLETE ✅
```

**CRITICAL BLOCKERS**:
- 🔴 Issue #7: Nx must register projects before Phase 3-5 work
- 🔴 Issue #8: Middleware design must be approved before implementation
- 🔴 Issue #13: Env types strategy must be decided before Phase 3

---

## Hard Constraints (Read These)

### Tenant Isolation (Non-Negotiable)
From [tenancy.md](../docs/tenancy.md):
- Middleware resolves tenant **BEFORE** any storage call
- All storage adapters receive tenant as required parameter
- All KV keys, DO IDs, Vectorize queries include tenant prefix
- App layer **CANNOT** bypass tenant scoping

### Security Defaults (Non-Negotiable)
From [plan.md](../docs/plan.md) section 1.2:
- No secrets in repository (.env in .gitignore)
- Strict request validation on every endpoint
- CORS locked down per tenant

### Type Safety (Non-Negotiable)
From [2026-01-26-issue-14-decision.md](./2026-01-26-issue-14-decision.md):
- Strict TypeScript (no `any`, strict null checking)
- ESM modules only (no CommonJS)
- env.ts is single source of truth

---

## Git Workflow

### Branch Strategy
```
main (default branch)
  └─ feat/M0-phase-1-infrastructure
     ├─ feat(M0): Issue #3 - Monorepo skeleton
     ├─ feat(M0): Issue #4 - TypeScript config
     ├─ feat(M0): Issue #5 - ESLint + Prettier
     ├─ feat(M0): Issue #6 - Vitest setup
     ├─ feat(M0): Issue #9 - Tenant config schema
     └─ feat(M0): Issue #14 - Runtime decisions (already done)
     
     → PR to main when Phase 1 complete
```

### Commit Message Format
```
feat(M0): Issue #X - [short description]

- Acceptance criterion 1
- Acceptance criterion 2
- Acceptance criterion 3
```

---

## Success Criteria (Phase-by-Phase)

### Phase 1 ✅
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] All 6 task directories/configs exist

### Phase 2 ✅
- [ ] `npx nx show projects` lists apps + packages
- [ ] Blocked until Phase 1 complete

### Phase 3 ✅
- [ ] Tenant context resolved per request
- [ ] env.ts is canonical source of binding types
- [ ] Blocked until Phase 2 + Gemini approval

### Phase 4 ✅
- [ ] `wrangler dev` runs locally with hot reload
- [ ] `/health` endpoint returns tenant + build info
- [ ] Error responses have correct envelope format

### Phase 5 ✅
- [ ] All tests pass: `nx run-many --target test`
- [ ] Tenant isolation verified (code audit + tests)
- [ ] No secrets in repo (scan for .env files)

---

## How to Use This Index

### First Time (Codex)
1. Read [PROMPT-FOR-CODEX-PHASE-1.md](./PROMPT-FOR-CODEX-PHASE-1.md)
2. Skim [plan.md](../docs/plan.md) sections 0-3.2 (executive summary + layout)
3. Glance at [2026-01-26-issue-14-decision.md](./2026-01-26-issue-14-decision.md) (runtime decisions)
4. Start Phase 1 (6 tasks, 2 hours)

### First Time (Gemini)
1. Read [PROMPT-FOR-GEMINI-DESIGN-REVIEW.md](./PROMPT-FOR-GEMINI-DESIGN-REVIEW.md)
2. Deep dive [tenancy.md](../docs/tenancy.md) + [architecture.md](../docs/architecture.md)
3. Answer design questions for Issues #8, #13
4. Ready for Phase 3 approval

### Future Reference
- **Lost context?** → Read [TEAM-HANDOFF-CODEX-GEMINI.md](./TEAM-HANDOFF-CODEX-GEMINI.md)
- **Planning question?** → Check [plan.md](../docs/plan.md)
- **Tenant isolation?** → See [tenancy.md](../docs/tenancy.md)
- **GitHub issues?** → https://github.com/users/rainbowkillah/projects/12
- **What's done?** → Check [TODO.md](../TODO.md)
- **What changed?** → Check [CHANGELOG.md](../CHANGELOG.md)

---

## Escalation Path

| Issue Type | Owner | Escalate To |
|-----------|-------|-------------|
| Phase 1 build error | Codex | Claude (blocker) |
| Phase 2 project.json issue | Codex | Claude (blocker) |
| Design question (Issue #8) | Codex | Gemini (owner) |
| Design question (Issue #13) | Codex | Gemini (owner) |
| Design conflict | Either | Claude (mediator) |
| Constraint deviation | Any | Claude (enforce) |
| Milestone delay | Any | Claude (replan) |

---

## Quick Sanity Checks

### Before Phase 1 Start
```bash
npm --version          # Should be 10+
node --version         # Should be 20+
npx nx --version       # Should be 22.4.1
npx tsc --version      # Should be 5.9.2
git --version          # Should be 2.x+
```

### After Phase 1 Complete
```bash
npx tsc --noEmit       # TypeScript check
npm run lint           # ESLint check
npm test               # Vitest tests
npm run format         # Prettier format
git status             # Clean state
```

### Before Phase 2
```bash
npx nx show projects   # Should show 0 projects (expected)
git branch -a          # Should see feat/M0-phase-1-infrastructure
git log --oneline | head -10  # Should see Phase 1 commits
```

---

## Resources & Support

### Documentation Hub
- **Planning**: [plan.md](../docs/plan.md) — 498 lines covering M0-M8 + NX-1 to NX-4
- **Tenancy**: [tenancy.md](../docs/tenancy.md) — 458 lines on isolation strategy
- **Architecture**: [architecture.md](../docs/architecture.md) — System design
- **Decisions**: [2026-01-26-issue-14-decision.md](./2026-01-26-issue-14-decision.md) — Runtime choices

### GitHub Resources
- **Project Board**: https://github.com/users/rainbowkillah/projects/12
- **M0 Issues**: #3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14
- **Total Issues**: 122 (across 8 milestones + Nx plugin)

### Team Communication
- **Daily Standup**: TBD (recommend 09:00 UTC during M0)
- **Async Updates**: GitHub issues + comments
- **Blockers**: Escalate to Claude immediately

---

## FAQ

**Q: Can Phase 1 tasks run in parallel?**  
A: Yes! Tasks 1-5 are independent. Do Task 1 (directories) first, then 2-5 in parallel.

**Q: What if I don't understand a constraint?**  
A: Check [plan.md](../docs/plan.md) section 1 (Non-Negotiable Constraints) + reference docs.

**Q: Can I skip a task?**  
A: No. All Phase 1 tasks are required for Phase 2-5 to work. Use prompts for acceptance criteria.

**Q: What if Phase 1 takes longer than 2 hours?**  
A: Update [TODO.md](../TODO.md) with blocker + time estimate. Claude will adjust plan.

**Q: Where do I ask questions?**  
A: GitHub issues (for design/architecture) or direct message (for quick questions).

**Q: What's the current git branch?**  
A: `main` (default). Create `feat/M0-phase-1-infrastructure` for Phase 1 work.

---

## Success Definition

🎯 **M0 Complete When**:
- All 5 phases executed (Phase 1-5)
- All 12 GitHub issues (M0) completed
- `npm install && npm run lint && npm test` all pass
- Tenant isolation enforced + verified
- No secrets in repo
- Team ready for M1 (Streaming Chat)

---

**You have everything you need. Start with your prompt. Go build.** 🚀

---

*Index Created: 2026-01-26 by Claude*  
*For: Codex, Gemini, Claude + Future Team Members*  
*Status: CURRENT & MAINTAINED*
