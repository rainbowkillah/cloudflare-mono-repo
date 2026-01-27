# Issue #14 Decision: Wrangler + ESM Runtime Configuration

**Timestamp**: 2026-01-26  
**Owner**: Claude (Architecture/Decisions)  
**Status**: ✅ DECIDED & LOCKED  
**Blocking**: None (unblocks Phase 1 immediately)

---

## The Decision

### Wrangler Version: `^4.x` (Latest Stable)

- **Locked to**: wrangler ^4.26.0 (already in package.json)
- **Why**:
  - Stable, widely-tested production API
  - Full native ESM support without workarounds
  - Comprehensive local dev via `wrangler dev` with hot reload
  - Robust multi-account authentication for tenant deployments
  - Excellent Windows/Linux/macOS parity

### Module Format: ESM (ES2022)

- **TypeScript Target**: `ES2022`
- **Module Format**: ES modules only (no CommonJS fallback)
- **Why**:
  - Native async/await and top-level await support
  - Workers AI bindings built for ESM first
  - Cleaner streaming implementation for `/chat` endpoint
  - No transpilation overhead in build pipeline
  - Best practice for modern Cloudflare Workers runtime

---

## Configuration Details

### TypeScript (tsconfig.base.json - to be created in Phase 1, Issue #4)

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
    "sourceMap": true
  }
}
```

### Build Configuration (@nx/esbuild)

- **Target**: `es2022`
- **Format**: `esm`
- **Splitting**: disabled (single bundle per worker)
- **Minification**: enabled for production
- **Output**: `.js` ES modules

### wrangler.jsonc Template (per tenant, created in Phase 1)

```jsonc
{
  "name": "worker-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-12-01",
  "env": {
    "production": {
      "routes": [{ "pattern": "api.example.com/*", "zone_id": "..." }]
    },
    "staging": {
      "routes": [{ "pattern": "staging-api.example.com/*", "zone_id": "..." }]
    }
  },
  "kv_namespaces": [{ "binding": "KV", "id": "tenant-specific-id" }],
  "durable_objects": {
    "bindings": [{ "name": "SESSIONS", "class_name": "SessionDO" }]
  },
  "services": [{ "binding": "VECTORIZE", "service": "vectorize" }]
}
```

---

## Impact on Phase 1 Tasks

### Issue #3: Monorepo Directory Structure

- ✅ No ESM/wrangler impact (directory creation only)

### Issue #4: TypeScript Configuration

- **UNBLOCKED** by this decision
- Creates `tsconfig.base.json` with `target: ES2022`, `module: ES2022`, `strict: true`
- Creates TypeScript configuration references in each app's tsconfig.json

### Issue #5: ESLint + Prettier

- ✅ No ESM/wrangler impact (linting rules independent)

### Issue #6: Vitest Configuration

- ✅ ESM-compatible test runner
- Test environment: `node` (not browser/jsdom)
- Vitest handles ES modules natively

### Issue #9: Tenant Config Schema + Zod

- **Requires**: wrangler version documented for tenant setup
- Creates Zod schema validating tenant.config.json structure

### Issue #14: Runtime Decisions (THIS DECISION)

- ✅ Completed
- Unblocks all Phase 1 work
- Documentation added to plan.md section 4.5

---

## Downstream Impact on Later Milestones

### M1 (Streaming Chat + Sessions)

- ✅ ESM enables native async/await in streaming handler
- ✅ Durable Objects seamlessly integrate with ESM imports

### M2 (AI Gateway Integration)

- ✅ Workers AI bindings work natively with ESM
- ✅ No adapter translation layers needed

### M3+ (Vectorize, RAG, Tools)

- ✅ All Cloudflare bindings designed for ESM-first workers

### Nx Plugin (NX-1 to NX-4)

- **NX-1**: Bootstrap uses this wrangler version for tenant scaffolding
- **NX-2**: Worker generator creates ESM-compatible worker code
- **NX-3**: Tenant generator creates wrangler.jsonc with ESM assumption
- **NX-4**: Binding generator outputs ESM-compatible env types

---

## Risk Assessment

### Low Risk (Well-Established)

- ✅ Wrangler 4.x is stable and widely-used in production
- ✅ ESM is native to Cloudflare Workers runtime
- ✅ TypeScript ES2022 is standard for modern web development

### Mitigation (If Issues Arise)

- **Wrangler breaking change**: Freeze on v4.5.x if major issue found (6-month window)
- **ESM incompatibility**: Revert to service-worker format (requires rebuild, low probability)

---

## Approval & Sign-Off

| Component         | Decided By | Date       | Status    |
| ----------------- | ---------- | ---------- | --------- |
| Wrangler ^4.x     | Claude     | 2026-01-26 | ✅ Locked |
| ESM (ES2022)      | Claude     | 2026-01-26 | ✅ Locked |
| TypeScript Config | Claude     | 2026-01-26 | ✅ Locked |
| Build Config      | Claude     | 2026-01-26 | ✅ Locked |

### Team Notification

- [x] Updated plan.md section 4.5 with full runtime decisions
- [x] Updated TODO.md with Issue #14 completed status
- [x] Updated .llm/sessions/2026-01-26-M0-infrastructure-ready.md with decision
- [x] Created this decision document for reference

---

## Next Steps

### Immediate (For Codex)

1. Begin Phase 1 tasks with these runtime decisions locked in
2. Create TypeScript files with `"use strict"` (implicit in ES2022 modules)
3. Configure wrangler.jsonc per tenant following template above

### For Future Review

- Monitor wrangler release notes for breaking changes (current v4.26.0)
- Document any ESM-specific gotchas found during implementation

---

_Decision locked: 2026-01-26_  
_Unblocks: Phase 1 (all tasks)_  
_Review gate: Full team consensus required for any change to these decisions_
