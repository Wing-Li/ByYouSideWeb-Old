# Module Execution Plan Standard

Use this standard before implementing any large ByYouSide migration task.

## Purpose

Module execution plans prevent context loss during long migrations. They force Codex to read legacy code first, write down the real behavior, review the intended design, then implement in controlled steps.

## When a Plan Is Required

Create or update a plan before coding when the task involves:

- A full business module, such as auth/users, friends, devices/location, memoirs, moments, VIP, config, announcements, feedback, or versions.
- A cross-cutting system, such as Prisma schema, auth/JWT, response envelope, exception handling, API docs, seed scripts, tests, mail, or push.
- More than one module.
- Database schema changes.
- Public API design or route changes.
- Security, permissions, or external integrations.
- Any task likely to span more than one work session.

For tiny fixes within an already planned module, update the existing plan rather than creating a new one.

## File Location

Store plans in:

```text
docs/migration-plans/
```

Suggested names:

```text
docs/migration-plans/phase-01-node-foundation.md
docs/migration-plans/phase-02-prisma-schema.md
docs/migration-plans/phase-03-auth-users.md
docs/migration-plans/phase-04-friends.md
docs/migration-plans/phase-05-devices-location.md
docs/migration-plans/phase-06-memoirs-moments.md
docs/migration-plans/phase-07-vip.md
docs/migration-plans/phase-08-config-content-version.md
```

## Required Workflow

1. **Read legacy code** using `legacy-reading-checklist.md`.
2. **Create or update the plan** before writing Node code.
3. **Self-review the plan** against legacy evidence.
4. **Resolve gaps** by reading more code or asking the user.
5. **Implement in phases**.
6. **Update the plan after each meaningful subtask**.
7. **Close the plan** only after code, docs, tests, and migration status are updated.

## Review Rules

Before implementation, the plan must answer:

- What old code was read?
- What exact behavior was observed?
- What behavior will intentionally change?
- What API will App developers use?
- What data model changes are needed?
- What tests prove the behavior?
- What remains uncertain?

If any answer is missing, do not start coding the module.

## Template

```markdown
# <Module Or Phase Name> Execution Plan

Status: Draft

Allowed statuses:

- Draft
- In Review
- Approved For Implementation
- In Progress
- Implemented
- Verified
- Closed
- Blocked

## Goal

Describe the module or feature being migrated and the intended outcome.

## Scope

In scope:

- 

Out of scope:

- 

## Legacy Evidence

Files read:

- `src/main/kotlin/...`

Legacy behavior summary:

- Routes:
- Auth/current user:
- Request fields:
- Response shape:
- Validation:
- Data reads/writes:
- External side effects:
- Error codes:
- Initialization/default data:

## Intentional Changes

List differences from the old backend and why they are acceptable.

- 

## New API Design

Routes:

| Method | Path | Auth | Description | Old reference |
| --- | --- | --- | --- | --- |
| | | | | |

Response notes:

- 

Error codes:

- 

Swagger/OpenAPI requirements:

- 

## Data Model Design

Prisma models or model changes:

- 

Indexes/constraints:

- 

Seed data:

- 

## Implementation Tasks

- [ ] DTOs and validation
- [ ] Controller routes
- [ ] Service business logic
- [ ] Prisma schema/migration
- [ ] Seed updates
- [ ] Auth/role guards
- [ ] Swagger/OpenAPI docs
- [ ] Unit tests
- [ ] E2E tests
- [ ] Migration documentation updates

## Verification Plan

Commands to run:

```text

```

Manual checks:

- 

## Risks And Open Questions

- 

## Review Notes

Plan review result:

- [ ] Legacy behavior fully covered
- [ ] API docs plan is clear
- [ ] Data model plan is clear
- [ ] Tests are adequate
- [ ] No unresolved blocker remains

Reviewer notes:

- 

## Progress Log

| Date | Status | Notes |
| --- | --- | --- |
| YYYY-MM-DD | Draft | Initial plan |

## Completion Record

Completed code:

- 

Completed docs:

- 

Verification results:

- 

Known follow-ups:

- 
```

## Status Rules

- Use `Draft` while gathering legacy evidence.
- Use `In Review` while checking the plan against old code and project standards.
- Use `Approved For Implementation` only when no blocking uncertainty remains.
- Use `In Progress` during implementation.
- Use `Implemented` when code is written but verification is not complete.
- Use `Verified` when tests/checks have passed.
- Use `Closed` when the migration plan, API docs, and global migration status are all updated.
- Use `Blocked` when user input or a technical decision is required.
