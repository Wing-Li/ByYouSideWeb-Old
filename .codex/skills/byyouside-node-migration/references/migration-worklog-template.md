# Migration Worklog Template

Use this template when adding module-level notes or updating migration progress.

## Module

Name:

Status:

- 未开始
- 进行中
- 已完成
- 暂停
- 废弃

## Legacy Evidence Read

Files read:

- `path/to/file.kt`

Important legacy behavior:

- Route:
- Auth:
- Request:
- Response:
- Validation:
- Data writes:
- Side effects:
- Error codes:

## New Design

New routes:

- `METHOD /path`

Data model changes:

- 

Intentional differences from legacy behavior:

- 

Reason:

- 

## Implementation Checklist

- [ ] DTOs
- [ ] Controller
- [ ] Service
- [ ] Prisma model/migration
- [ ] Seed data, if needed
- [ ] Auth/role guard
- [ ] Swagger/OpenAPI docs
- [ ] Unit tests
- [ ] E2E tests
- [ ] Migration status updated

## Verification

Commands run:

```text

```

Results:

- 

Unverified items:

- 

## Follow-ups

- 
