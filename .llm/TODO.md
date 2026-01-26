# TODO.md

> Track actionable tasks here. See [GitHub Project](https://github.com/users/rainbowkillah/projects/12) for full task board.

## Active Work

### Pre-M0 Checklist
- [ ] Run `npm install` to initialize node_modules
- [ ] Verify Nx installation works (`npx nx --version`)
- [ ] Final review of `.llm/docs/cleanup.md` for any remaining cleanups
- [ ] Verify toolchain: TypeScript, ESLint, Vitest, Wrangler

### Immediate Next Actions
- [x] Review `.llm/docs/cleanup.md` and decide deletions/archival before M0 - DONE 2026-01-26
- [x] Repository inspection complete - DONE 2026-01-26 (see sessions/2026-01-26-copilot-inspection.md)
- [ ] Implement M0 repo scaffolding + tenant middleware
- [x] Write `.llm/docs/architecture.md` (currently empty) - DONE 2026-01-26
- [x] Write `.llm/docs/tenancy.md` - DONE 2026-01-26
- [x] Write `.llm/docs/metrics.md` - DONE 2026-01-26
- [x] Write `.llm/docs/testing.md` - DONE 2026-01-26
- [x] Write `.llm/docs/api-contracts.md` - DONE 2026-01-26
- [x] Write `.llm/docs/security.md` - DONE 2026-01-26
- [x] Write `.llm/docs/failure-modes.md` - DONE 2026-01-26
- [ ] Start NX-1 plugin bootstrap in parallel

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

| Milestone | Issues |
|-----------|--------|
| M0: Foundation | 12 |
| M1: Chat+Sessions | 10 |
| M2: AI Gateway | 7 |
| M3: RAG | 14 |
| M4: Search UX | 8 |
| M5: Tools | 13 |
| M6: TTS | 7 |
| M7: Observability | 12 |
| M8: Deploy | 8 |
| NX-1: Bootstrap | 6 |
| NX-2: Worker Gen | 5 |
| NX-3: Tenant Gen | 5 |
| NX-4: Bindings | 8 |
| Review Feedback | 7 |
| **Total** | **122** |

---

*Last updated: 2026-01-26 by Claude (Architect)*
