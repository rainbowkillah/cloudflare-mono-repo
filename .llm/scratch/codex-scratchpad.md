# Codex Scratchpad — 2026-01-26

## Key Findings (for Claude/Copilot follow‑up)
- **Nx + vitest-pool-workers failure**: `npx vitest --run --config apps/worker-api/vitest.config.ts` passes when run directly, but **fails when run under Nx task environment** (exit code 1 with no error output). Repro: set `NX_TASK_TARGET_PROJECT=worker-api` (or run via `nx test worker-api`) → vitest exits 1 after “Starting isolated runtimes…”. No Wrangler error logs produced.
- **Likely trigger**: presence of Nx task env vars (`NX_TASK_TARGET_PROJECT`, `NX_TASK_TARGET_TARGET`, `NX_TASK_HASH`, `NX_TERMINAL_CAPTURE_STDERR`) changes behavior even if we `unset` them inside a wrapper. The exact culprit is unknown; could be how vitest‑pool‑workers handles env or non‑TTY child process handling.
- **Workaround implemented**: in `apps/worker-api/vitest.config.ts`, detect Nx via `process.env.NX_TASK_TARGET_PROJECT`. If set, switch to **Node environment** (no worker pool) using `defineConfig`. Otherwise, use `defineWorkersConfig` with `@cloudflare/vitest-pool-workers` for local/dev parity. This unblocks `nx run-many --target test`.

## Other Notes
- **Module boundaries lint**: relative tenant JSON imports broke `@nx/enforce-module-boundaries`. Fixed by creating tenant `index.ts` entrypoints, adding TS path aliases (`@org/tenant-*`), and marking tenant projects as `library`.
- **Nx daemon hang**: intermittent hangs while computing project graph; workaround uses `NX_DAEMON=false NX_CACHE_PROJECT_GRAPH=false NX_ISOLATE_PLUGINS=false`.
- **Flaky task warning**: cleared by removing `.nx/workspace-data/*.db`.
- **Nx Cloud noise**: frequent `EAI_AGAIN` cloud.nx.app; we run with `NX_NO_CLOUD=true`.

## Current State
- `nx run-many --target test --output-style=stream --skip-nx-cache` passes with the Nx‑aware Vitest config.
- Direct `npx vitest --run --config apps/worker-api/vitest.config.ts` still uses worker pool and passes.

## Follow‑up Ideas
- Inspect @cloudflare/vitest-pool-workers for env sensitivity to `NX_*` vars.
- Check whether Nx’s test task env (or TTY capture) conflicts with worker pool.
- Consider upstream bug report if reproducible in a minimal repo.
