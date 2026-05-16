# API Documentation Standard

The new Node backend may redesign APIs, but App developers must be able to rely on the documentation completely.

## Required for Every Endpoint

Document:

- Summary.
- Detailed business description.
- Authentication requirement.
- Required role, if any.
- HTTP method and path.
- Request body schema.
- Query/path/header parameters.
- Success response schema.
- Error response schema.
- Business error codes.
- Example request.
- Example success response.
- Example failure response.
- Important side effects.

## Response Standard

Standard success:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

Standard paginated success:

```json
{
  "code": 200,
  "message": "success",
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "isLast": false
  }
}
```

Standard failure:

```json
{
  "code": 11001,
  "message": "invalid username or password",
  "data": null
}
```

## Naming Guidance

Prefer REST-style routes for the new API:

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PATCH /users/me`
- `POST /friends/requests`
- `POST /friends/requests/:id/accept`
- `POST /friends/requests/:id/reject`
- `GET /devices/me/snapshots`
- `POST /devices/snapshots`

Keep a mapping from old endpoints to new endpoints in migration notes.

## DTO Rules

- Use explicit DTO classes.
- Use validation decorators for all user input.
- Use Swagger decorators for all fields.
- Mark nullable fields clearly.
- Provide examples.
- Do not expose password hashes, verification code hashes, secrets, or internal-only fields.

## Error Code Rules

Use a stable module-based range:

| Range | Module |
| --- | --- |
| 10000-10999 | Common |
| 11000-11999 | Auth/account |
| 12000-12999 | Users |
| 13000-13999 | Friends |
| 14000-14999 | Devices/location |
| 15000-15999 | Memoirs |
| 16000-16999 | Moments |
| 17000-17999 | VIP |
| 18000-18999 | Config |
| 19000-19999 | Announcements/feedback/versions |
| 20000-20999 | External integrations |

Every business error used in code must be documented.

## Documentation Verification

Before marking an API complete:

- Open or generate Swagger/OpenAPI.
- Confirm documented DTO fields match runtime DTOs.
- Confirm auth requirements match guards.
- Confirm examples are valid.
- Confirm old-to-new mapping is recorded.
- Confirm tests cover at least one success and one failure path.
