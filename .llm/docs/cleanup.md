# Cleanup (Pre-M0)

Purpose: capture repo cleanup candidates before starting M0. This is a checklist only; no files were deleted.

## Safe-to-delete / regenerate

These are rebuildable artifacts or caches that can be removed any time.

- `node_modules/`
- `.nx/cache/`
- `.nx/workspace-data/`
- `dist/`, `build/`, `coverage/`, `tmp/` (not present now, but safe to remove if created)

## Local-only configs (already gitignored)

Keep if you actively use them; otherwise safe to delete locally.

- `.env`
- `.dev.vars`
- `.claude/settings.local.json`

## Tool-specific config folders (optional)

Delete if you are not using these tools in this repo.

- `.claude/`
- `.codex/`
- `.gemini/`
- `.vscode/`

## Empty placeholders

Remove if you do not need placeholder folders yet.

- `packages/.gitkeep` (packages/ is empty)
- `tenants/mrrainbowsmoke/.gitignore` (tenant folder empty)
- `tenants/rainbowsmokeofficial/.gitignore` (tenant folder empty)

## LLM workspace scratch

Archive or delete after the information is captured elsewhere.

- `.llm/sessions/*.md`
- `.llm/scratch/*`

## Decisions needed

Resolved 2026-01-26:

- Placeholder tenant folders removed (recreate later if needed).
- Tool config folders stay in repo.
- Scratchpad archived under `.llm/archives/2026-01-26-scratch/`.
