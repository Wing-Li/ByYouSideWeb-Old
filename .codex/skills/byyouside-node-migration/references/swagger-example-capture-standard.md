# Swagger Real Example Capture Standard

Use this standard when adding or changing public APIs in `server-node/`.

## Goal

Swagger UI is the primary API documentation viewer. Request and response examples should come from real local HTTP requests so frontend developers can preview realistic results without manually executing every endpoint.

## Command

Run from `server-node/` after the local service is started:

```bash
npm run api:examples
```

Defaults:

- `API_BASE_URL=http://localhost:3000`
- `SWAGGER_DEMO_EMAIL=yyy101@yy.com`
- `SWAGGER_DEMO_PASSWORD=123123123`

The defaults are local/test-only values. They may be overridden with environment variables when needed.

## Files

- Capture script: `server-node/scripts/capture-api-examples.ts`
- Generated examples: `server-node/docs/swagger/openapi-examples.json`
- Swagger loader: `server-node/src/setup-swagger.ts`

The generated JSON may be committed. It must not contain raw tokens, verification codes, database URLs, real service secrets, or production credentials.

## Capture Rules

- Examples must be captured from real HTTP responses.
- Do not hand-write response examples to imitate real results.
- Swagger startup only reads the generated JSON and injects examples into OpenAPI. It must not send HTTP requests.
- Write examples atomically: generate to a temp file, validate safety, then replace the final file.
- If capture fails, fail loudly and do not leave a partial final example file.

## Redaction Rules

- Replace raw JWTs with `Bearer <captured-jwt-redacted>`.
- Replace request passwords with `<demo-password>`.
- Never write verification codes to generated examples.
- Never include `.env`, `DATABASE_URL`, SMTP credentials, push credentials, or production secrets.

## Module Migration Requirement

Each module execution plan must include an example capture section:

- Endpoints added to `npm run api:examples`.
- Success and important failure examples captured.
- Endpoints intentionally not captured and why.
- Verification that Swagger UI displays the captured examples.

Do not mark a public API module complete until its Swagger examples are either captured or explicitly documented as deferred.
