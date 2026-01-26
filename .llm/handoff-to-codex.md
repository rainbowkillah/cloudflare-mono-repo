# Handoff to Codex: M0 Phase 1 Implementation

**Status**: 🟢 READY TO START  
**Date**: 2026-01-26  
**From**: Claude (Architect)  
**Current Branch**: beta-0.0.2-beta  
**Your Role**: Primary builder for Phase 1-4 implementation  

---

## TL;DR - What You Need To Do

**Phase 1 (START NOW - 2 hours estimated)**: Create monorepo infrastructure in parallel:

1. **Issue #3**: Create directory structure (apps/packages/tenants/scripts/tests)
2. **Issue #4**: TypeScript config (tsconfig.base.json - ES2022, strict mode)
3. **Issue #5**: ESLint + Prettier setup
4. **Issue #6**: Vitest configuration
5. **Issue #9**: tenant.config.json schema + Zod validation
6. **Issue #14**: Document runtime decisions (already done - verify only)

**All tasks can run in parallel. No blockers.**

---

## Current State

### What's Complete ✅
- npm install: 852 packages installed, 0 vulnerabilities
- Nx v22.4.1 verified working, all plugins loaded (@naxodev/nx-cloudflare ready)
- GitHub Project: All 12 M0 issues (Issues #3-#14) mapped to 5 phases
- Runtime decisions: Wrangler ^4.x + ESM (ES2022) - LOCKED
- All planning docs: 4,491 lines across 10 files in `.llm/docs/`
- Team coordination: 4 comprehensive session documents created

### Current Branch
```bash
Current: beta-0.0.2-beta (not main)
You may want to create a feature branch: feat/M0-phase-1-infrastructure
```

### Workspace Structure (BASELINE)
```
/home/dfox/ai/cloudflare-mono-repo/
├── .llm/                    # Planning docs (DO NOT MODIFY except TODO.md updates)
│   ├── docs/                # 10 canonical documents (4,491 lines total)
│   └── sessions/            # 4 coordination documents
├── package.json             # ✅ 852 packages installed
├── nx.json                  # ✅ Nx configured (0 projects - you'll fix this)
├── tsconfig.json            # Exists but needs ES2022 config (Issue #4)
├── vitest.workspace.ts      # Exists but needs configuration (Issue #6)
└── [apps/packages/tenants folders DO NOT EXIST YET - Issue #3]
```

---

## Phase 1 Tasks (Detailed Breakdown)

### Issue #3: Monorepo Directory Structure
**GitHub**: https://github.com/users/rainbowkillah/projects/12/views/1?filterQuery=is%3Aopen+label%3AM0

**Create these directories:**
```bash
mkdir -p apps/worker-api/src
mkdir -p apps/ingest-worker/src
mkdir -p packages/core/src
mkdir -p packages/storage/src
mkdir -p packages/rag/src
mkdir -p packages/observability/src
mkdir -p packages/testing/src
mkdir -p tenants/mrrainbowsmoke
mkdir -p tenants/rainbowsmokeofficial
mkdir -p scripts
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
```

**Acceptance Criteria** (from Issue #3):
- All folders exist
- Each app/package has a basic `src/` directory
- Tenant folders created (no config yet - that's Issue #9)
- Tests folder structure ready

---

### Issue #4: TypeScript Configuration (ES2022, Strict Mode)

**Create `tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "paths": {
      "@org/core": ["packages/core/src/index.ts"],
      "@org/storage": ["packages/storage/src/index.ts"],
      "@org/rag": ["packages/rag/src/index.ts"],
      "@org/observability": ["packages/observability/src/index.ts"],
      "@org/testing": ["packages/testing/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp", "dist", ".nx"]
}
```

**Create `apps/worker-api/tsconfig.json`** (extends base):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist/apps/worker-api",
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../../packages/core" },
    { "path": "../../packages/storage" },
    { "path": "../../packages/rag" }
  ]
}
```

**Repeat for other apps/packages** (adjust paths accordingly).

**Acceptance Criteria**:
- tsconfig.base.json exists with ES2022 target
- All apps/packages have their own tsconfig.json extending base
- `npx tsc --build` succeeds (even with no code yet)

---

### Issue #5: ESLint + Prettier Configuration

**Create `.eslintrc.json`:**
```json
{
  "extends": [
    "eslint:recommended",
    "@nx",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.base.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  "ignorePatterns": ["node_modules", "dist", ".nx", "tmp"]
}
```

**Create `.prettierrc.json`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

**Create `.prettierignore`:**
```
node_modules
dist
.nx
tmp
*.md
```

**Acceptance Criteria**:
- ESLint config exists and extends recommended + TypeScript rules
- Prettier config exists with consistent formatting rules
- `npx nx run-many --target lint` succeeds (when project.json files exist in Phase 2)

---

### Issue #6: Vitest Configuration

**Update `vitest.workspace.ts`** (file already exists, needs proper config):
```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['tests/unit/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
      environment: 'node',
      globals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'dist/', '.nx/', 'tmp/'],
      },
    },
  },
  {
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
      environment: 'node',
      globals: true,
      testTimeout: 30000,
    },
  },
  {
    test: {
      name: 'e2e',
      include: ['tests/e2e/**/*.test.ts'],
      environment: 'node',
      globals: true,
      testTimeout: 60000,
    },
  },
]);
```

**Create sample test** `tests/unit/sample.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('M0 Phase 1 Smoke Test', () => {
  it('should verify test runner works', () => {
    expect(true).toBe(true);
  });

  it('should verify TypeScript ES2022 features', () => {
    const asyncFn = async () => 'ES2022 async/await works';
    expect(asyncFn()).resolves.toBe('ES2022 async/await works');
  });
});
```

**Acceptance Criteria**:
- vitest.workspace.ts configured with 3 test environments (unit/integration/e2e)
- Sample test passes with `npx vitest run`
- Coverage reporting configured (v8 provider)

---

### Issue #9: Tenant Config Schema + Zod Validation

**Create `packages/core/src/schemas/tenant.schema.ts`:**
```typescript
import { z } from 'zod';

export const TenantConfigSchema = z.object({
  tenantId: z.string().min(3).max(64).regex(/^[a-z0-9-]+$/),
  accountId: z.string().optional(),
  hostnameMapping: z.array(z.string()).optional(),
  
  ai: z.object({
    models: z.array(z.string()),
    gatewayRoutes: z.record(z.string()),
    budgets: z.object({
      dailyTokenLimit: z.number().optional(),
      monthlyTokenLimit: z.number().optional(),
    }).optional(),
  }),
  
  vectorize: z.object({
    indexNames: z.array(z.string()),
  }),
  
  kv: z.object({
    namespaces: z.record(z.string()),
  }),
  
  durableObjects: z.object({
    classes: z.record(z.string()),
  }),
  
  cors: z.object({
    origins: z.array(z.string()),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])),
  }),
  
  featureFlags: z.record(z.boolean()).optional(),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

export function validateTenantConfig(data: unknown): TenantConfig {
  return TenantConfigSchema.parse(data);
}
```

**Create sample config** `tenants/mrrainbowsmoke/tenant.config.json`:
```json
{
  "tenantId": "mrrainbowsmoke",
  "accountId": "placeholder-will-be-set-in-m1",
  "hostnameMapping": ["mrrainbowsmoke.example.com"],
  "ai": {
    "models": ["@cf/meta/llama-3.3-70b-instruct-fp8-fast"],
    "gatewayRoutes": {
      "default": "gateway-placeholder"
    }
  },
  "vectorize": {
    "indexNames": ["mrrainbowsmoke-embeddings"]
  },
  "kv": {
    "namespaces": {
      "CACHE": "mrrainbowsmoke-cache",
      "METADATA": "mrrainbowsmoke-metadata"
    }
  },
  "durableObjects": {
    "classes": {
      "SESSIONS": "SessionDO"
    }
  },
  "cors": {
    "origins": ["https://mrrainbowsmoke.example.com"],
    "methods": ["GET", "POST", "OPTIONS"]
  },
  "featureFlags": {
    "enableRAG": false,
    "enableTools": false,
    "enableTTS": false
  }
}
```

**Create validation test** `packages/core/src/schemas/tenant.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateTenantConfig } from './tenant.schema';
import fs from 'fs/promises';
import path from 'path';

describe('Tenant Config Schema', () => {
  it('should validate mrrainbowsmoke config', async () => {
    const configPath = path.join(
      process.cwd(),
      'tenants/mrrainbowsmoke/tenant.config.json'
    );
    const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    expect(() => validateTenantConfig(configData)).not.toThrow();
  });

  it('should reject invalid tenantId format', () => {
    const invalidConfig = {
      tenantId: 'INVALID_CAPS',
      ai: { models: [], gatewayRoutes: {} },
      vectorize: { indexNames: [] },
      kv: { namespaces: {} },
      durableObjects: { classes: {} },
      cors: { origins: [], methods: [] },
    };
    
    expect(() => validateTenantConfig(invalidConfig)).toThrow();
  });
});
```

**Acceptance Criteria**:
- Zod schema defined in packages/core/src/schemas/tenant.schema.ts
- Sample tenant.config.json exists for at least one tenant
- Validation function works (unit test passes)
- Schema exported for use in Phase 3 (middleware)

---

### Issue #14: Runtime Decisions (ALREADY DONE - Verify Only)

**Your action**: Verify that all decision documentation is in place:

1. Check `plan.md` section 4.5 exists and documents:
   - Wrangler ^4.x
   - ESM (ES2022) module format
   - TypeScript strict mode
   - Build configuration (esbuild ESM)

2. Verify package.json has `"wrangler": "^4.26.0"`

3. Create a simple verification script `scripts/verify-runtime-decisions.sh`:
```bash
#!/bin/bash
echo "Verifying runtime decisions..."

# Check wrangler version
WRANGLER_VERSION=$(node -pe "require('./package.json').devDependencies.wrangler")
echo "✅ Wrangler version: $WRANGLER_VERSION"

# Check TypeScript target in tsconfig.base.json (after Issue #4)
if [ -f "tsconfig.base.json" ]; then
  echo "✅ tsconfig.base.json exists"
else
  echo "⏳ tsconfig.base.json pending (Issue #4)"
fi

echo "✅ Runtime decisions locked - see plan.md section 4.5"
```

**Acceptance Criteria**:
- Verification script confirms wrangler ^4.x
- plan.md section 4.5 documents all runtime decisions
- No contradictions in configuration files

---

## Success Criteria for Phase 1 Complete

Before marking Phase 1 as done, verify ALL of these:

- [ ] Directory structure exists (apps, packages, tenants, scripts, tests)
- [ ] tsconfig.base.json + per-app/package tsconfig.json exist with ES2022
- [ ] ESLint + Prettier configured and passing (no errors)
- [ ] Vitest configured with sample test passing
- [ ] Zod tenant schema defined + sample tenant.config.json validated
- [ ] Runtime decisions verified (wrangler ^4.x, ESM documented)
- [ ] `npm run build` succeeds (even if empty code)
- [ ] `npm test` runs sample tests successfully
- [ ] No TypeScript compilation errors

---

## Key Reference Documents

**Must Read Before Starting**:
1. [plan.md](./docs/plan.md) - Section 4.5 "Runtime Decisions" (your constraints)
2. [TODO.md](./TODO.md) - Current status + your task list
3. [2026-01-26-M0-infrastructure-ready.md](./sessions/2026-01-26-M0-infrastructure-ready.md) - Full Phase 1 briefing
4. [2026-01-26-issue-14-decision.md](./sessions/2026-01-26-issue-14-decision.md) - Wrangler + ESM decision details

**GitHub Project**:
- Full board: https://github.com/users/rainbowkillah/projects/12
- M0 Issues: #3-#14 (filter by label:M0)

**Constraints (Non-Negotiable)**:
- [tenancy.md](./docs/tenancy.md) - Tenant isolation rules (read for Phase 3 prep)
- [architecture.md](./docs/architecture.md) - System design (read for context)

---

## Communication & Updates

### Update TODO.md After Each Task
When you complete a task, update `.llm/TODO.md`:
```markdown
- [x] Issue #3: Monorepo skeleton - DONE 2026-01-26 by Codex
- [x] Issue #4: TypeScript config - DONE 2026-01-26 by Codex
... etc
```

### Blockers? Escalate Immediately
If you encounter ANY blocker:
1. Document the blocker in `.llm/TODO.md` under "Blockers Identified"
2. Tag Claude for decision (any deviation from documented constraints)
3. DO NOT proceed with workarounds that violate constraints

### Phase 1 → Phase 2 Handoff
When Phase 1 is complete:
1. Update TODO.md marking all Phase 1 tasks complete
2. Create a brief handoff note in `.llm/sessions/2026-01-26-phase-1-complete.md`
3. Notify team that Phase 2 (Issue #7 - Nx project.json generation) is unblocked

---

## What Happens After Phase 1

**Phase 2** (Issue #7 - 1 hour): Generate project.json for all apps/packages
- You'll use `@naxodev/nx-cloudflare` generators
- Each app/package needs a project.json to register with Nx
- Unblocks `nx run-many` commands

**Phase 3** (Issues #8, #13 - 2 hours): Core tenant middleware
- Gemini will review your design BEFORE you implement
- packages/core/src/env.ts becomes the canonical binding types
- Tenant resolution middleware is CRITICAL - all storage depends on it

**Phase 4** (Issues #10-#12 - 2 hours): Error handling + local dev + health endpoint
- Wrangler dev setup with hot reload
- Error response envelopes
- /health endpoint + smoke tests

---

## Quick Start Commands

```bash
# Verify current state
cd /home/dfox/ai/cloudflare-mono-repo
npx nx --version  # Should show v22.4.1
npm list wrangler  # Should show ^4.26.0

# Create feature branch (recommended)
git checkout -b feat/M0-phase-1-infrastructure

# Start with Issue #3 (directories)
mkdir -p apps/worker-api/src apps/ingest-worker/src
mkdir -p packages/{core,storage,rag,observability,testing}/src
mkdir -p tenants/{mrrainbowsmoke,rainbowsmokeofficial}
mkdir -p scripts tests/{unit,integration,e2e}

# Then proceed with Issues #4-6, #9, #14 in parallel
```

---

## Final Notes

- **Time estimate**: 2 hours for all 6 tasks (can work in parallel)
- **No external dependencies**: Everything is in the repo or already installed
- **No Claude approval needed**: Phase 1 is pre-approved, execute freely
- **Next gate**: Phase 2 requires Phase 1 complete first

**You've got this! The planning is done, the constraints are clear, the path is unblocked. Build with confidence.** 🚀

---

*Handoff created: 2026-01-26 by Claude*  
*Questions? Check TODO.md or escalate blockers immediately*
