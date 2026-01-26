# .llm/ Directory Guide

Purpose-built hub for AI agents in this repo. Keep it lean, logged, and aligned with PLAN.md and SECURITY.md.

## Operating Rules
- Respect tenant isolation; never mix secrets or configs between mrrainbowsmoke and rainbowsmokeofficial.
- Never store secrets or tokens in .llm files.
- Use request_id in logs and hand-offs; do not paste raw prompts unless explicitly needed for debugging.
- Record notable actions in CHANGELOG.md; keep tasks in TODO.md current.
- Use .llm/scratch/ for temporary drafts; prune when done. Store session transcripts in .llm/sessions/.

## File Map
- AGENTS.md: roles, hand-offs, expectations.
- PLAN-llm.md: concise, agent-focused plan aligned with PLAN.md.
- TODO.md: single source of truth for tasks and owners.
- CHANGELOG.md: dated log of agent activity.
- BINDINGS.md: tenant bindings reference.
- CLAUDE.md, COPILOT.md, GEMINI.md: per-agent guidance files.
- scripts/: automation for agent workflows.
- sessions/: saved conversations (archive/ for older sessions).
- scratch/: disposable notes/snippets.

## Utility Scripts

```bash
# Show TODO.md status summary
bash .llm/scripts/todo-status.sh

# Verify tenant implementations are identical
bash .llm/scripts/tenant-sync-check.sh

# Show today's changelog entries
bash .llm/scripts/changelog-today.sh

# Archive sessions older than N days (default: 7)
bash .llm/scripts/session-archive.sh [days]
```

## Working Rhythm
1) Check TODO.md before starting; claim or create tasks with owner and status.
2) Consult AGENTS.md for role boundaries and hand-off rules.
3) After work, update CHANGELOG.md and mark tasks in TODO.md.
4) Keep PLAN-llm.md synced with the main plan; reflect medium-level updates here, deeper details in code/docs.
