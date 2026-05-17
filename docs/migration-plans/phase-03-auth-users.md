# Phase 03 认证与用户模块执行计划

状态：已验证

允许状态：

- 草稿
- 审阅中
- 批准实现
- 实现中
- 已实现
- 已验证
- 已关闭
- 阻塞

## Goal

迁移 ByYouSide 的注册、登录、标准 JWT 鉴权、当前用户信息、用户资料更新、密码重置验证码、账号注销与取消注销能力。新后端不兼容旧 token，不复用旧 H2 数据，并移除旧网易云信 IM 同步。

## Scope

In scope:

- 注册与登录。
- 标准 JWT 签发、校验和当前用户解析。
- `GET /users/me` 与 `PATCH /users/me`。
- 密码重置验证码发送与确认。
- 账号注销申请与取消注销。
- 用户 DTO、Swagger/OpenAPI 文档、单元测试和 e2e 测试。
- 开发环境邮件 mock/log provider。

Out of scope:

- Refresh Token。
- 第三方登录。
- 真实 SMTP 生产配置。
- 文件上传、头像资源存储。
- 好友、设备、位置推送、VIP 业务的完整迁移。
- 网易云信 IM 集成。

## Legacy Evidence

Files read:

- `src/main/kotlin/com/lyl/byyouside/controller/api/UserController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfoRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/utils/JwtUtils.kt`
- `src/main/kotlin/com/lyl/byyouside/utils/EmailUtils.kt`
- `src/main/kotlin/com/lyl/byyouside/utils/MyUtils.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/config/Config.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/filter/UserTokenInterceptor.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `src/main/kotlin/com/lyl/byyouside/config/ContextHolder.kt`
- `.codex/skills/byyouside-node-migration/references/legacy-reading-checklist.md`
- `.codex/skills/byyouside-node-migration/references/node-project-standards.md`
- `.codex/skills/byyouside-node-migration/references/api-documentation-standard.md`

Legacy behavior summary:

- Routes:
  - `POST /api/user/register`
  - `POST /api/user/login`
  - `POST /api/user/resetPassSendEmailCode`
  - `POST /api/user/resetPassVerifyCode`
  - `POST /api/user/update`
  - `POST /api/user/getUser`
  - `POST /api/user/getMyInfo`
  - `POST /api/user/destroy`
  - `POST /api/user/cancelDestroy`
  - `POST /api/user/requestLocation`
- Auth/current user:
  - `UserTokenInterceptor` 从 `Authorization` 读取旧 token，解析 header 中的 `userId`，写入 `ContextHolder.userId`。
  - 注册、登录、重置密码、取消注销、配置和版本查询在旧系统中免 token。
- Request fields:
  - 注册使用 `userName`、`passWord`、`email`。
  - 登录使用 `userName` 和 `passWord`，其中 `userName` 可以是用户名或邮箱。
  - 密码重置发送验证码使用 `userName` 或 `email`。
  - 密码重置确认使用 `userName` 或 `email`、`passWord`、`verifyCode`。
  - 用户更新使用 `nickName`、`gender`、`icon`、`introduction`、`birthday`、`email`、`uploadIntervalTime`、`deviceType`、`deviceAlias`、`deviceAliasType`、`isVip`。
- Response shape:
  - 旧系统统一返回 `BaseCallBack(code, message, data)`。
  - 注册与登录成功返回用户对象，并在用户对象上附带 `token`。
- Validation:
  - 用户名必须匹配 `^[a-zA-Z0-9_]{4,20}$`。
  - 密码长度为 6 到 32。
  - 邮箱必须匹配旧 `Config.REGEX_EMAIL`。
  - 昵称最长 8 个字符。
  - 简介最长 200 个字符。
  - 验证码发送后 1 分钟内不可重复发送。
  - 验证码 5 分钟后过期。
- Data reads/writes:
  - 注册写入用户，用户名和邮箱均不可重复。
  - 登录按用户名或邮箱查询用户并校验 BCrypt 密码。
  - 旧验证码明文保存在用户表 `code/codeDate`；新系统改写入 `VerificationCode` 并保存 hash。
  - 注销设置 `isDestroy/destroyDate/destroyReason`；新系统映射为 `status=DESTROY_REQUESTED` 与 `destroyRequestedAt/destroyReason`。
- External side effects:
  - 密码重置发送邮件验证码。
  - 用户更新旧系统会同步网易云信 IM 信息；新系统明确移除。
  - 请求位置推送属于设备/位置阶段，不在本阶段实现。
- Error codes:
  - `10001` 用户名格式错误。
  - `10002` 密码长度错误。
  - `10003` 昵称长度错误。
  - `10004` 用户名已存在。
  - `10005` 邮箱格式错误。
  - `10006` 简介长度错误。
  - `10008` 邮箱格式错误。
  - `10009` 邮箱已存在。
  - `10010` 验证码已发送，需等待。
  - `10011` 验证码已过期。
  - `10012` 验证码错误。
  - `11001` 用户不存在。
  - `11002` 密码错误。
  - `11003` 用户名或密码为空。
  - `13001` 账号被限制登录。
  - `13002` 账号已申请注销，重新登录会取消申请。
  - `13003` 账号已注销。
  - `13004` 已申请注销。
- Initialization/default data:
  - Phase 2 seed 已创建默认管理员，Phase 3 完成后需验证管理员可以登录。

## Intentional Changes

- 新 token 改为标准 JWT payload：`sub`、`iat`、`exp`，不兼容旧 token。
- 新 API 使用 REST 风格和 `/api/v1` 版本前缀。
- 验证码只保存 hash，不保存明文。
- 邮件发送默认使用 mock/log provider，真实 SMTP 留到 Phase 9。
- 用户资料更新不再同步网易云信 IM。
- 用户返回 DTO 不暴露密码 hash、验证码 hash、内部 secret。
- 取消注销改为当前登录用户自助取消，不再允许免登录按任意 `userId` 取消。

## New API Design

Routes:

| Method | Path | Auth | Description | Old reference |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | 否 | 注册账号并返回用户与 token | `POST /api/user/register` |
| POST | `/api/v1/auth/login` | 否 | 使用用户名或邮箱登录 | `POST /api/user/login` |
| POST | `/api/v1/auth/password-reset/code` | 否 | 发送密码重置验证码 | `POST /api/user/resetPassSendEmailCode` |
| POST | `/api/v1/auth/password-reset/confirm` | 否 | 校验验证码并重置密码 | `POST /api/user/resetPassVerifyCode` |
| GET | `/api/v1/users/me` | 是 | 获取当前用户信息 | `POST /api/user/getMyInfo` |
| PATCH | `/api/v1/users/me` | 是 | 更新当前用户资料 | `POST /api/user/update` |
| POST | `/api/v1/users/me/destroy-request` | 是 | 申请注销当前账号 | `POST /api/user/destroy` |
| POST | `/api/v1/users/me/destroy-request/cancel` | 是 | 取消当前账号注销申请 | `POST /api/user/cancelDestroy` |

Response notes:

- 成功响应继续由全局拦截器包装为 `{ code: 200, message: "success", data }`。
- Auth 成功响应 `data` 包含 `token` 与 `user`。
- 用户响应使用 `id` 字符串表示 BigInt，避免 JSON 序列化问题。

Error codes:

- Auth/account 使用 `11000-11999` 范围。
- Users 使用 `12000-12999` 范围。
- 兼容旧业务语义时可保留旧错误码数字，并在 Swagger 中说明。

Swagger/OpenAPI requirements:

- 每个接口必须说明鉴权要求、请求 DTO、成功示例、错误示例和旧接口映射。
- Bearer auth 用于 `users` 模块接口。

## Data Model Design

Prisma models or model changes:

- 复用 Phase 2 已建立的 `User` 与 `VerificationCode`。

Indexes/constraints:

- 复用 `User.username`、`User.email` 唯一约束。
- 复用 `VerificationCode[email, purpose, createdAt]` 索引。

Seed data:

- 复用 Phase 2 默认管理员 seed。

## Implementation Tasks

- [x] 创建 Phase 3 计划。
- [x] 添加 Auth/User DTO 和 Swagger 文档。
- [x] 添加 JWT 签发与校验基础设施。
- [x] 添加当前用户 decorator 和 JWT guard。
- [x] 添加 AuthController/AuthService。
- [x] 添加 UsersController/UsersService。
- [x] 添加 mock/log Mail provider。
- [x] 添加单元测试。
- [x] 添加 e2e 测试。
- [x] 运行 format、lint、test、e2e、build。
- [x] 更新 `docs/NODE_MIGRATION_PLAN.md` 和计划完成记录。

## Verification Plan

Commands to run:

```text
npm run format
npm run lint
npm run test
npm run test:e2e
npm run build
```

Manual checks:

- Swagger JSON 包含 auth/users 新接口。
- seed 管理员可以通过登录接口登录。
- 注册后返回标准 JWT，携带 token 可访问 `GET /api/v1/users/me`。
- 密码重置验证码不会以明文写入数据库。

## Risks And Open Questions

- 旧系统取消注销接口免登录且允许传入任意 `userId`，新系统出于安全原因改为当前登录用户自助取消。
- 旧系统注销 14 天后视为已注销；新系统第一版保留状态判断，后续可增加定时任务转换为 `DESTROYED`。
- 真实邮件服务属于 Phase 9，本阶段只提供 mock/log 以避免误发。

## Review Notes

Plan review result:

- [x] Legacy behavior fully covered
- [x] API docs plan is clear
- [x] Data model plan is clear
- [x] Tests are adequate
- [x] No unresolved blocker remains

Reviewer notes:

- 可以开始实现 Phase 3 第一版，优先保证注册、登录、鉴权、当前用户和资料更新闭环。

## Progress Log

| Date | Status | Notes |
| --- | --- | --- |
| 2026-05-17 | 实现中 | 阅读迁移文档、旧用户/认证代码与项目规范后创建计划 |
| 2026-05-17 | 已实现 | 实现 Auth/User DTO、标准 JWT、JWT guard、当前用户 decorator、mock/log 邮件 provider、AuthController/AuthService、UsersController/UsersService |
| 2026-05-17 | 已验证 | format、lint、unit test、e2e test、build、Swagger JSON、健康检查和 seed 管理员登录验证通过 |

## Completion Record

Completed code:

- `server-node/src/common/auth/auth.types.ts`
- `server-node/src/common/auth/jwt-auth.guard.ts`
- `server-node/src/common/auth/jwt-token.service.ts`
- `server-node/src/common/decorators/current-user.decorator.ts`
- `server-node/src/common/errors/business-exception.ts`
- `server-node/src/common/errors/error-codes.ts`
- `server-node/src/integrations/mail/mail.module.ts`
- `server-node/src/integrations/mail/mail.service.ts`
- `server-node/src/modules/auth/`
- `server-node/src/modules/users/`
- `server-node/src/app.module.ts`
- `server-node/.env.example`
- `server-node/test/app.e2e-spec.ts`

Completed docs:

- 本计划。
- `docs/NODE_MIGRATION_PLAN.md`

Verification results:

- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test`：通过，2 个测试套件、3 个测试通过。
- `npm run test:e2e`：通过，1 个测试套件、3 个测试通过。
- `npm run build`：通过。
- `GET /api/v1/health`：返回 `code=200`。
- `GET /api/docs-json`：包含 auth/users 新接口。
- 使用本地 `.env` 中的 seed 管理员账号登录成功，返回 `role=ADMIN`。

Known follow-ups:

- Phase 5 迁移 `requestLocation` 和设备推送。
- Phase 9 接入真实邮件 provider。
- 可继续补充密码重置确认流程的更细粒度 e2e 测试。

## Swagger 真实示例捕获

- 已要求通过 `npm run api:examples` 真实请求本地服务生成 Swagger 示例。
- Phase 3 第一版捕获注册、登录、登录密码错误、获取当前用户、更新当前用户、申请注销、取消注销和发送密码重置验证码。
- `password-reset/confirm` 成功示例暂不捕获，因为验证码不应进入文档或仓库。
- 生成示例必须脱敏 JWT 和密码，并禁止写入验证码、数据库连接串或真实服务密钥。
