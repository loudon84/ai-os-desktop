# Current Agent Task — v6.5 GeneHub Hermes Skill Sync

## Goal
Implement `v6.5_genehub-hermes-skill-sync`: GeneHub connection, device/profile register, Bundle install pipeline, Skill Center UI, tests, docs.

## Stages
1. [done] shared-contract — genehub-contract.ts + genehub-errors.ts
2. [done] connection-layer — descriptor + connection + get-connection IPC
3. [done] main-infra — device-identity, profile-resolver, http, client, config
4. [done] install-pipeline — validator, writer, restart, worker, logs
5. [done] scheduler-lifecycle — scheduler + auth hooks + auto-init
6. [done] ipc-preload — genehub IPC + window.genehubRuntime
7. [done] renderer-skill-center — GeneHub Skill Center page + nav + i18n
8. [done] tests-docs — vitest + AGENTS/INDEX/API_CONTRACTS
