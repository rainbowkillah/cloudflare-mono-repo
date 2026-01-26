# TODO.md

> Track actionable tasks here. See [GitHub Project](https://github.com/users/rainbowkillah/projects/12) for full task board.

## M0 Status: 🟡 PHASE 1 IN PROGRESS

**GitHub Project Verification Complete** (2026-01-26)

- ✅ All 12 M0 issues (Issues #3-#14) mapped to 5-phase implementation sequence
- ✅ Critical path identified (Issues #8, #9 are dependency blockers)
- ✅ Team role assignments: Codex (Phase 1-4), Gemini (design review), Claude (decisions/blockers)
- ✅ Success criteria: 10 measurable exit conditions defined
- ✅ **Issue #14 DECIDED**: Wrangler ^4.x + ESM (ES2022) locked in (2026-01-26)
- 📋 See `.llm/sessions/2026-01-26-M0-github-project-verification.md` for full plan

**Runtime Decisions Locked (Issue #14)**

- ✅ Wrangler: `^4.x` (latest stable, v4.26.0 already in package.json)
- ✅ Module Format: ESM (ES2022 target, no service-worker transpilation)
- ✅ TypeScript: strict mode enabled, ES2022 target/lib
- ✅ Build: esbuild via @nx/esbuild, ESM format, single bundle per worker
- ✅ Testing: Vitest (unit) + miniflare (integration)
- ✅ Env Types: packages/core/src/env.ts as single source of truth
- 📋 See `plan.md` section 4.5 "Runtime Decisions" for full details

**Phase 1: Parallel Setup (Issues #3, #4, #5, #6, #9, #14)** - Est. 2 hours

- [x] Issue #3: Monorepo directory structure (apps, packages, tenants, scripts, tests)
- [x] Issue #4: TypeScript + tsconfig.base.json for Workers runtime (ES2022)
- [x] Issue #5: ESLint + Prettier configuration
- [x] Issue #6: Vitest + Miniflare test runner setup
- [x] Issue #9: tenant.config.json schema + Zod validation library
- [x] Issue #14: Runtime decisions documented (wrangler version, ESM format)

**Phase 2: Nx Projects Registration (Issue #7)** - Est. 1 hour

- [ ] Issue #7: Generate project.json for all apps/packages/tenants (unblocks nx run-many)

**Phase 3: Core Middleware (Issues #8, #13)** - Est. 2 hours

- [ ] Issue #8: Tenant resolution middleware (header → hostname → JWT claims)
- [ ] Issue #13: Env typings source of truth (packages/core/src/env.ts)

**Phase 4: Local Dev + Error Handling (Issues #10, #11, #12)** - Est. 2 hours

- [ ] Issue #10: Error handling + response envelopes
- [ ] Issue #11: wrangler dev local setup with hot reload
- [ ] Issue #12: /health endpoint + smoke tests

**Phase 5: Validation** - Est. 1 hour

- [ ] Verify npm install completes
- [ ] Verify Nx workspace detects all projects (`nx show projects`)
- [ ] Verify full test suite passes (`nx run-many --target test`)
- [ ] Verify tenant isolation constraints enforced at adapter layer

### Pre-M0 Infrastructure Checklist

- [ ] Run `npm install` to initialize node_modules (122 packages)
- [ ] Verify Nx installation works (`npx nx --version`)
- [ ] Verify @naxodev/nx-cloudflare plugin loads
- [ ] Final review of `.llm/docs/cleanup.md` for any remaining cleanups

## Review Feedback Summary (2026-01-26)

### Gemini (Planner) Recommendations

- [ ] Add explicit milestone dependency mapping to plan.md
- [ ] Quantify exit criteria (e.g., "P90 latency < X ms")
- [ ] Define logging schema earlier than M7
- [ ] Add E2E testing layer distinct from unit/integration
- [ ] Add dedicated security testing activities
- [ ] Create standardized failure mode template

### Codex (Builder) Recommendations

- [ ] Create `project.json` for each apps/packages target (Nx has no projects registered)
- [ ] Define concrete endpoint schemas for /chat, /search, /tools/execute, /ingest, /tts
- [ ] Specify wrangler version, ESM vs service-worker format decision
- [ ] Define test stack (Vitest/Jest, workerd/miniflare)
- [ ] Create tenant.config.json schema + Zod validation
- [ ] Define Env typings source of truth (packages/core/src/env.ts)
- [ ] Use `jsonc-parser` for JSONC edits in Nx plugin
- [ ] Define executor-to-wrangler mapping for Nx

### Blockers Identified

- [ ] AI Gateway routing details uncertain - need validation spike (M2)
- [ ] Vectorize local emulation limitations - need staging strategy
- [ ] Multi-account deployment credential strategy undefined

## GitHub Project Statistics

| Milestone         | Issues  |
| ----------------- | ------- |
| M0: Foundation    | 12      |
| M1: Chat+Sessions | 10      |
| M2: AI Gateway    | 7       |
| M3: RAG           | 14      |
| M4: Search UX     | 8       |
| M5: Tools         | 13      |
| M6: TTS           | 7       |
| M7: Observability | 12      |
| M8: Deploy        | 8       |
| NX-1: Bootstrap   | 6       |
| NX-2: Worker Gen  | 5       |
| NX-3: Tenant Gen  | 5       |
| NX-4: Bindings    | 8       |
| Review Feedback   | 7       |
| **Total**         | **122** |

---

_Last updated: 2026-01-26 by Claude (Architect)_
