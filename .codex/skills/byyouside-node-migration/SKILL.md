---
name: byyouside-node-migration
description: Project-specific operating rules for migrating the ByYouSide backend from the existing Kotlin/Spring Boot codebase to a new Node.js/NestJS/TypeScript/Prisma/PostgreSQL backend. Use this skill whenever Codex works on server-node scaffolding, module migration, API design, Prisma schema, tests, documentation, or any task related to replacing the current ByYouSide backend. It enforces reading the legacy code before implementation, preserving documented behavior unless intentionally redesigned, maintaining accurate API documentation, and keeping the Node project healthy as it grows.
---

# ByYouSide Node Migration

## Core Rule

Never invent behavior for speed. Before implementing or changing any migrated feature, read the relevant legacy Kotlin/Spring Boot code and extract the actual behavior. If the old code is unclear, inspect adjacent modules and ask the user only after local evidence is exhausted.

## Required Start

At the start of every migration task:

1. Read `docs/NODE_MIGRATION_PLAN.md`.
2. Check `git status --short`.
3. Identify the target module and read its legacy Controller, Entity, Repository, utilities, filters, init logic, and external integrations as applicable.
4. Record what is known before coding: routes, request fields, response shape, auth requirements, validations, side effects, errors, and data writes.
5. For large work, create or update a module execution plan under `docs/migration-plans/` before coding.
6. Update the migration document or module notes when a decision or completion state changes.

Use `rg --files` and `rg` first when searching.

## Module Execution Plans

For any large module or cross-cutting task, create a plan document before implementation. This is required for auth/users, friends, devices/location, memoirs, moments, VIP, Prisma schema, API documentation system, auth infrastructure, external integrations, or any task touching multiple modules.

Use:

```text
docs/migration-plans/<phase-or-module-name>.md
```

The plan must include legacy evidence, scope, API design, data model design, step-by-step tasks, tests, risks, review notes, and completion status. Review and revise the plan before coding. During implementation, update the plan incrementally as tasks complete or change.

Do not mark a large module complete if it has no plan document.

## Migration Workflow

For each module or endpoint:

1. **Discover**: read the old source files and related models.
2. **Extract**: summarize behavior from code evidence, not assumptions.
3. **Plan**: for large work, write or update the module execution plan and self-review it before coding.
4. **Design**: map old behavior to the new Node API and data model.
5. **Document**: update OpenAPI/Swagger DTOs and any migration notes before considering the endpoint usable.
6. **Implement**: write NestJS module/service/controller code with Prisma-backed persistence.
7. **Verify**: run focused tests, lint/typecheck when available, and update completion status.
8. **Close**: update the module plan, worklog, and `docs/NODE_MIGRATION_PLAN.md` when scope or phase status changes.

If any step cannot be completed, leave the module marked incomplete with a clear reason.

## When to Read References

- Read `references/legacy-reading-checklist.md` before migrating a module or endpoint.
- Read `references/node-project-standards.md` before creating or changing Node project structure, module boundaries, Prisma schema, config, auth, tests, or external integrations.
- Read `references/api-documentation-standard.md` before designing or editing API routes, DTOs, Swagger docs, or response/error formats.
- Read `references/module-plan-standard.md` before starting a large module or cross-cutting task.
- Use `references/migration-worklog-template.md` when adding a module-level migration note or updating completion evidence.

## Hard Constraints

- Do not claim a module is migrated until code, API documentation, and verification are all complete.
- Do not start implementing a large module before creating and reviewing its module execution plan.
- Do not add external service keys, SMTP credentials, JWT secrets, database passwords, or push secrets to source files.
- Do not reintroduce网易云信 IM integration; the new backend intentionally removes it.
- Do not silently change business rules. If a new API intentionally differs from the old one, document the difference and reason.
- Do not rely on old H2 data or old token compatibility.
- Do not leave undocumented endpoints.
- Do not merge unrelated refactors into a migration task.

## Node Backend Defaults

Use these defaults unless the migration document or user says otherwise:

- Directory: `server-node/`
- Framework: NestJS
- Language: TypeScript
- ORM: Prisma
- Database: PostgreSQL
- API docs: Swagger/OpenAPI
- Auth: standard JWT payload using `sub`, `iat`, and `exp`
- Passwords: hash only, never plaintext
- Verification codes: prefer hashed codes with expiry and consumed state
- External integrations: provider abstraction with dev mock/log mode and prod real mode

## Completion Checklist

Before finishing a migration task, ensure:

- Legacy code was read and cited in the work notes or final summary.
- New code follows `references/node-project-standards.md`.
- API docs match implemented routes and DTOs.
- Relevant tests or verification commands ran, or the reason they could not run is recorded.
- `docs/NODE_MIGRATION_PLAN.md` reflects updated status when the task changes project progress.
