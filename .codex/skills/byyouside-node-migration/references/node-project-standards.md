# Node Project Standards

Use these standards for the new `server-node/` backend.

## Architecture

Default stack:

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Swagger/OpenAPI
- Jest + Supertest

Recommended structure:

```text
server-node/
  prisma/
    schema.prisma
    seed.ts
  src/
    main.ts
    app.module.ts
    common/
      auth/
      decorators/
      filters/
      guards/
      interceptors/
      response/
      utils/
    config/
    database/
    integrations/
      mail/
      umeng-push/
    modules/
      auth/
      users/
      friends/
      devices/
      memoirs/
      moments/
      vip/
      app-config/
      announcements/
      feedback/
      versions/
  test/
  .env.example
```

## Module Rules

- Keep one business domain per Nest module.
- Put route definitions in controllers only.
- Put business rules in services.
- Put database access behind Prisma service or small repository helpers.
- Keep DTOs near the module they describe.
- Keep cross-cutting auth, response, filters, and guards under `common/`.
- Keep external services under `integrations/`.

## TypeScript Rules

- Enable strict mode.
- Avoid `any` unless there is a narrow, documented reason.
- Use DTO classes for input validation.
- Use explicit return types for public service methods.
- Use enums for stable business states.
- Do not use magic strings for roles, statuses, push types, or order sources.

## Prisma Rules

- PostgreSQL is the source of truth.
- Use Prisma migrations for schema changes.
- Keep database names consistent, preferably `snake_case` through Prisma mapping where helpful.
- Use `createdAt` and `updatedAt` consistently.
- Use explicit relations and indexes for frequently queried fields.
- Do not rely on old H2 schema or old generated IDs.
- Seed default app config, VIP plans, and admin user.

## Auth Rules

- Use standard JWT payload fields:
  - `sub`: user ID
  - `iat`: issued at
  - `exp`: expiration
- Use guards for authenticated routes.
- Use role guards for admin routes.
- Do not store JWT secrets in source code.
- Prefer refresh-token support only if explicitly planned.

## Security Rules

- Store password hashes only.
- Prefer hashing verification codes.
- Do not log passwords, tokens, verification codes, or secrets.
- Read all secrets from environment variables.
- Keep `.env.example` complete but fake.
- Development mock providers must not accidentally send real mail or push.

## External Integration Rules

Mail:

- Provide a mail service interface.
- Support dev mock/log mode.
- Use real SMTP only when explicitly enabled by env.

Umeng push:

- Provide a push service interface.
- Keep Android and iOS payload builders isolated.
- Support dev mock/log mode.
- Keep push message types typed.

网易云信 IM:

- Do not implement.
- Remove old coupling from VIP and user update flows.

## Testing Rules

Every migrated module should include:

- Service unit tests for business rules.
- E2E tests for important API flows.
- Validation tests for bad inputs.
- Permission tests for authenticated/admin routes.

Run focused tests after module work. Run broader tests before marking a phase complete.

## Documentation Rules

- Every public endpoint must appear in Swagger/OpenAPI.
- Update `docs/NODE_MIGRATION_PLAN.md` when phase status changes.
- Add module notes when behavior intentionally differs from old code.
- Keep README files practical and current.

## Health Checks

Before finishing a meaningful code change, prefer running:

- formatter
- linter
- typecheck
- unit tests
- e2e tests for touched module
- Prisma generate/migrate validation when schema changed

If a check cannot run, record why.
