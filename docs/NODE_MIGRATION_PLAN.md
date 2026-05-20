# ByYouSide Node.js 迁移实施文档

本文档记录 ByYouSide 后端从当前 Kotlin/Spring Boot 项目迁移到 Node.js 的长期实施方案、架构决策、阶段计划、验收标准与完成状态。

迁移不是一次性短任务。后续每完成一个阶段，都应更新本文档中的状态、决策记录和遗留问题，保证项目有连续、准确、可追溯的工程记录。

## 当前状态

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 迁移方向确认 | 已完成 | 新建 Node.js 后端目录，长期维护型重构 |
| 技术栈确认 | 已完成 | NestJS + TypeScript + Prisma + PostgreSQL |
| 旧项目留存策略 | 已完成 | 迁移期间保留旧代码用于业务参考，迁移完成后可不再考虑旧项目 |
| API 策略确认 | 已完成 | 新 API 可以统一设计，但必须提供准确、完整、可执行的 API 文档 |
| Token 策略确认 | 已完成 | 不兼容旧 Token，改用标准 JWT |
| 数据库策略确认 | 已完成 | 不兼容旧 H2 数据，使用 PostgreSQL 和新规范模型 |
| 管理员策略确认 | 已完成 | 使用通用、可维护的初始化/种子方式创建管理员 |
| 网易云信 IM | 已完成 | 从新系统中移除，不再接入 |
| 邮件和推送 | 已完成 | 已补齐 SMTP 邮件 provider 与友盟推送 provider，运行环境已从旧项目回填真实 SMTP 与友盟参数，真实密钥只写入本地/部署环境变量 |
| 迁移实施文档 | 已完成 | 已创建本文档，后续按阶段持续更新 |
| 迁移作业 Skill | 已完成 | 已创建 `.codex/skills/byyouside-node-migration/`，后续迁移任务应优先使用 |
| Node 项目初始化 | 已完成 | `server-node/` NestJS 基础骨架、Swagger、统一响应、异常处理、健康检查和基础测试已完成 |
| 数据模型设计 | 已完成 | Phase 2 已完成第一版 Prisma schema、migration SQL、Neon main/dev 数据库 migration 和 seed；已创建 Neon local 分支用于本地开发 |
| API 文档编写 | 已完成 | Phase 1 已建立 Swagger/OpenAPI；Phase 3-8 已补齐各业务模块接口文档和真实响应示例捕获；Phase 9 不新增公开 API；Phase 10 已补齐全量 50 条 Swagger 路由真实示例并通过敏感内容扫描。后续仅在 App 联调或生产验收发现差异时维护 |
| 业务模块迁移 | 进行中 | 服务端业务模块、外部服务 provider、生产配置模板和后端验收准备已完成；App 接入、生产部署切换和旧后端停用仍待执行 |
| 测试与验收 | 进行中 | Phase 1-10 已完成自动化测试、构建、Swagger 示例捕获和覆盖对照；Phase 11 生产就绪计划已创建，等待生产部署信息、SMTP 联调邮箱和真实友盟设备 alias |
| 生产就绪与切换准备 | 阻塞 | 已创建 `docs/migration-plans/phase-11-production-readiness.md`，当前阻塞于部署平台、域名端口、进程守护、Neon 生产数据库策略、真实 SMTP 收件邮箱、真实友盟设备 alias 和旧后端停用时机 |

## 已确认决策

### 1. 项目形态

新后端使用独立目录承载，建议目录名：

```text
server-node/
```

旧 Spring Boot 项目在迁移期间保留，作用是：

- 作为业务逻辑参考。
- 作为旧接口行为参考。
- 作为错误码、返回结构、字段语义参考。

新项目完成并稳定后，可以停止维护旧项目。

### 2. 技术栈

推荐并已确认的技术栈：

- Runtime：Node.js LTS
- Language：TypeScript
- Framework：NestJS
- Database：PostgreSQL
- ORM：Prisma
- Auth：标准 JWT，Access Token 优先，后续可扩展 Refresh Token
- API 文档：OpenAPI/Swagger，由代码装饰器或 schema 自动生成
- Validation：class-validator + class-transformer，或 NestJS 标准 ValidationPipe
- Config：`@nestjs/config` + `.env`
- Test：Jest + Supertest
- Password Hash：bcrypt 或 argon2
- Mail：Nodemailer 或等价可维护邮件 provider
- Push：独立友盟推送 provider

### 3. API 策略

用户确认：新 API 可以统一设计，不要求完全复刻旧接口路径、HTTP 方法和参数名。

但必须满足以下约束：

- API 文档必须准确。
- API 文档必须与实际代码保持同步。
- App 后续开发应能只依赖 API 文档完成接入。
- 每个接口必须说明认证要求、请求参数、响应结构、错误码和业务语义。

建议使用 Swagger/OpenAPI 作为正式 API 文档来源。

### 4. Token 策略

不兼容旧 Token。

新系统使用标准 JWT：

- JWT payload 中保存标准字段，如 `sub`、`iat`、`exp`。
- `sub` 表示用户 ID。
- 不再把业务字段放到 JWT header。
- 后端统一从 JWT payload 解析当前用户。
- 后续如需要长登录，可增加 Refresh Token 表和刷新流程。

### 5. 数据库策略

不迁移旧 H2 数据。

新系统使用 PostgreSQL，并以长期维护为目标重新设计数据模型：

- 表名使用统一命名规范。
- 字段名使用一致风格，建议数据库使用 `snake_case`，TypeScript 使用 `camelCase`。
- 使用 Prisma migration 管理 schema 演进。
- 使用 seed 初始化基础数据，例如默认配置、会员套餐、管理员账号。

### 6. 管理员策略

旧系统通过 `UserInfo.status == "admin"` 判断管理员。

新系统建议改为标准角色模型：

- 用户表保留基础身份字段。
- 角色使用 enum 或独立 role 表。
- 第一版可以简化为 `role: USER | ADMIN`。
- 使用 seed 脚本创建管理员。
- 管理员初始账号、邮箱、密码来自 `.env`，不写死在源码中。

### 7. 网易云信 IM 策略

新系统移除网易云信 IM 接入。

迁移时需要删除或不实现以下旧逻辑：

- 会员开通后创建 IM 账号。
- 用户资料变更后同步 IM 用户资料。
- `imAccountId` 相关业务字段。
- `ChatYxImApi` 等外部调用封装。

如果 App 仍存在 IM 入口，需要 App 侧同步移除或改为新方案。

### 8. 邮件与推送策略

邮件验证码和友盟推送保留。

建议：

- 抽象成独立 provider。
- 开发环境默认使用 mock/log 模式，避免误发邮件和推送。
- 生产环境通过 `.env` 启用真实服务。
- 所有密钥从环境变量读取，不提交真实密钥。

### 9. Swagger 真实接口示例策略

新后端继续使用 Swagger UI 作为接口文档入口。

- 示例生成使用显式命令 `npm run api:examples`。
- 示例必须来自本地服务真实 HTTP 请求，不使用凭空编写的响应数据冒充真实结果。
- Swagger 启动时只读取 `server-node/docs/swagger/openapi-examples.json` 并注入 OpenAPI examples，不自动请求接口、不自动更新示例。
- 生成文件可以提交到仓库，供前端直接浏览最近一次捕获的真实示例。
- JWT、验证码、数据库连接串、真实服务密钥必须脱敏或禁止写入生成文件。
- 后续每个公开 API 模块迁移时，都必须把新增接口纳入 `api:examples` 捕获范围，或在模块计划中说明暂不捕获的原因。

## 目标架构

建议新项目结构：

```text
server-node/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── auth/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── response/
│   │   └── utils/
│   ├── config/
│   ├── database/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── friends/
│   │   ├── devices/
│   │   ├── memoirs/
│   │   ├── moments/
│   │   ├── vip/
│   │   ├── app-config/
│   │   ├── announcements/
│   │   ├── feedback/
│   │   └── versions/
│   └── integrations/
│       ├── mail/
│       └── umeng-push/
├── test/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### 分层原则

- Controller 只处理路由、参数、认证上下文和响应声明。
- Service 承载业务流程和业务规则。
- Repository 或 Prisma Service 负责数据访问。
- DTO 定义请求、响应和校验规则。
- Guard 负责鉴权和权限。
- Filter 负责异常到统一响应的转换。
- Interceptor 负责统一响应包装、日志或审计。
- Integration provider 只负责外部服务调用，不直接写业务规则。

## 统一响应与错误码

新系统可以优化 API 设计，但建议保留稳定的响应外壳，方便 App 处理：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应建议统一为：

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

错误响应建议统一为：

```json
{
  "code": 10001,
  "message": "用户名格式不正确",
  "data": null
}
```

建议建立新的错误码规范：

| 范围 | 模块 |
| --- | --- |
| 10000-10999 | 通用错误 |
| 11000-11999 | 认证与账号 |
| 12000-12999 | 用户资料 |
| 13000-13999 | 好友关系 |
| 14000-14999 | 设备与位置 |
| 15000-15999 | 回忆录 |
| 16000-16999 | 瞬间 |
| 17000-17999 | 会员 |
| 18000-18999 | 配置 |
| 19000-19999 | 公告、反馈、版本 |
| 20000-20999 | 外部服务 |

## API 文档要求

每个接口必须在 Swagger/OpenAPI 中提供：

- 接口标题和说明。
- HTTP 方法。
- 路径。
- 是否需要认证。
- 请求参数位置：body、query、path、headers。
- 请求 DTO schema。
- 成功响应 schema。
- 错误响应 schema。
- 业务错误码。
- 示例请求。
- 示例响应。

接口合并或改名时，必须在迁移文档中记录映射关系。

建议维护一份接口索引：

| 新模块 | 新接口 | 旧接口参考 | 状态 |
| --- | --- | --- | --- |
| Auth | `POST /api/v1/auth/register` | `POST /api/user/register` | 已完成 |
| Auth | `POST /api/v1/auth/login` | `POST /api/user/login` | 已完成 |
| Auth | `POST /api/v1/auth/password-reset/code` | `POST /api/user/resetPassSendEmailCode` | 已完成 |
| Auth | `POST /api/v1/auth/password-reset/confirm` | `POST /api/user/resetPassVerifyCode` | 已完成 |
| Users | `GET /api/v1/users/me` | `POST /api/user/getMyInfo` | 已完成 |
| Users | `PATCH /api/v1/users/me` | `POST /api/user/update` | 已完成 |
| Friends | `POST /api/v1/friends/requests` | `POST /api/friend/request` | 已完成 |
| Friends | `POST /api/v1/friends/requests/:id/accept` | `POST /api/friend/agreeRequest` | 已完成 |
| Friends | `POST /api/v1/friends/requests/:id/reject` | `POST /api/friend/rejectRequest` | 已完成 |
| Friends | `DELETE /api/v1/friends/:id` | `POST /api/friend/delete` | 已完成 |
| Friends | `PATCH /api/v1/friends/:id/block` | `POST /api/friend/block` | 已完成 |
| Friends | `PATCH /api/v1/friends/:id/alias` | `POST /api/friend/update` | 已完成 |
| Friends | `GET /api/v1/friends` | `POST /api/friend/getMyFriend` | 已完成 |
| Friends | `GET /api/v1/friends/requests/incoming` | `POST /api/friend/getRequestMeFriend` | 已完成 |
| Friends | `POST /api/v1/friends/:id/best` | `POST /api/friend/bindBestFriend` | 已完成 |
| Devices | `POST /api/v1/devices/snapshots` | `POST /api/device/add` | 已完成 |
| Devices | `GET /api/v1/devices/me/snapshots` | `GET /api/device/myInfoList` | 已完成 |
| Devices | `GET /api/v1/devices/me/snapshots/latest` | `GET /api/device/getMyLast` | 已完成 |
| Devices | `GET /api/v1/devices/users/:userId/snapshots` | `GET /api/device/getByUserId` | 已完成 |
| Devices | `GET /api/v1/devices/users/:userId/snapshots/latest` | `GET /api/device/getLastByUserId` | 已完成 |
| Devices | `POST /api/v1/devices/users/:userId/location-request` | `POST /api/user/requestLocation` | 已完成 |
| Memoirs | `POST /api/v1/memoirs` | `POST /api/memoirs/create` | 已完成 |
| Memoirs | `PATCH /api/v1/memoirs/:id` | `POST /api/memoirs/update` | 已完成 |
| Memoirs | `DELETE /api/v1/memoirs/:id` | `POST /api/memoirs/delete` | 已完成 |
| Memoirs | `GET /api/v1/memoirs/:id` | `GET /api/memoirs/get` | 已完成 |
| Memoirs | `GET /api/v1/memoirs` | `GET /api/memoirs/list` | 已完成 |
| Moments | `POST /api/v1/moments` | `POST /api/moments/create` | 已完成 |
| Moments | `PATCH /api/v1/moments/:id` | `POST /api/moments/update` | 已完成 |
| Moments | `DELETE /api/v1/moments/:id` | `POST /api/moments/delete` | 已完成 |
| Moments | `GET /api/v1/moments/:id` | `GET /api/moments/get` | 已完成 |
| Moments | `GET /api/v1/moments` | `GET /api/moments/list` | 已完成 |
| VIP | `GET /api/v1/vip/plans` | `GET /api/vip/getType` | 已完成 |
| VIP | `POST /api/v1/vip/plans` | `POST /api/vip/create` | 已完成 |
| VIP | `PATCH /api/v1/vip/plans/:id` | `POST /api/vip/update` | 已完成 |
| VIP | `POST /api/v1/vip/orders` | `POST /api/vip/addRecharge` | 已完成 |
| VIP | `GET /api/v1/vip/orders/me` | `GET /api/vip/getMyRecharge` | 已完成 |
| VIP | `GET /api/v1/vip/orders` | `GET /api/vip/getRechargeAll`、`GET /api/vip/getRechargeByUserId` | 已完成 |
| VIP | `POST /api/v1/vip/bindings` | `POST /api/vip/bindVip` | 已完成 |
| Config | `GET /api/v1/app-config/app` | `GET /config/app` | 已完成 |
| Config | `PATCH /api/v1/app-config/app` | `POST /config/create` | 已完成 |
| Announcements | `POST /api/v1/announcements` | `POST /announcement/add` | 已完成 |
| Announcements | `GET /api/v1/announcements` | `GET /announcement/getAll` | 已完成 |
| Announcements | `GET /api/v1/announcements/latest` | `GET /announcement/getLast` | 已完成 |
| Feedback | `POST /api/v1/feedback` | `POST /feedback/add` | 已完成 |
| Feedback | `GET /api/v1/feedback` | `GET /feedback/get` | 已完成 |
| Versions | `POST /api/v1/versions` | `POST /version/add` | 已完成 |
| Versions | `GET /api/v1/versions/latest` | `GET /version/getLast` | 已完成 |

## 初步数据模型规划

最终以 Prisma schema 为准。下面是迁移前的领域模型草案。

### User

建议字段：

- `id`
- `username`
- `email`
- `passwordHash`
- `nickname`
- `avatarUrl`
- `gender`
- `bio`
- `birthday`
- `role`
- `status`
- `uploadIntervalSeconds`
- `vipLevel`
- `vipSource`
- `vipExpiresAt`
- `vipBindQuotaTotal`
- `vipBindQuotaUsed`
- `destroyRequestedAt`
- `destroyReason`
- `lastLocationAddress`
- `lastLocationLongitude`
- `lastLocationLatitude`
- `lastLocationAt`
- `pushDeviceType`
- `pushAliasType`
- `pushAlias`
- `createdAt`
- `updatedAt`

不再保留：

- `imAccountId`
- 邮箱验证码直接放在用户表中的旧方式可重构为独立 `VerificationCode` 表。

### 验证码 VerificationCode

用于密码重置、邮箱验证等：

- `id`
- `userId`
- `email`
- `codeHash`
- `purpose`
- `expiresAt`
- `consumedAt`
- `createdAt`

验证码建议保存 hash，不保存明文。

### FriendRelation

建议保留双向关系或改为单条关系模型，需要在设计阶段确认。

为了业务清晰，长期建议使用单条关系模型：

- `id`
- `requesterId`
- `receiverId`
- `status`
- `requesterAlias`
- `receiverAlias`
- `bestFriendOfUserId`
- `blockedByUserId`
- `createdAt`
- `updatedAt`

但如果 App 查询强依赖“我的关系 ID”，第一版也可以保留双向记录。迁移时需要权衡 API 简洁性与业务兼容性。

### DeviceSnapshot

- `id`
- `userId`
- `deviceName`
- `screenStatus`
- `screenLevel`
- `batteryStatus`
- `batteryLevel`
- `volumeLevel`
- `bluetoothStatus`
- `bluetoothName`
- `wifiStatus`
- `wifiName`
- `gpsStatus`
- `locationSource`
- `locationAddress`
- `locationLongitude`
- `locationLatitude`
- `createdAt`

### Memoir

- `id`
- `friendRelationId`
- `authorId`
- `title`
- `content`
- `happenedAt`
- `createdAt`
- `updatedAt`

### Moment

- `id`
- `friendRelationId`
- `authorId`
- `content`
- `happenedAt`
- `createdAt`
- `updatedAt`

### VipPlan

- `id`
- `name`
- `description`
- `level`
- `durationMonths`
- `price`
- `productCode`
- `type`
- `status`
- `createdAt`
- `updatedAt`

### VipOrder

- `id`
- `userId`
- `planId`
- `source`
- `bindFromUserId`
- `amount`
- `createdAt`

### AppConfig

- `id`
- `environment`
- `appName`
- `reviewMode`
- `createdAt`
- `updatedAt`

### Announcement

- `id`
- `authorId`
- `title`
- `authorName`
- `content`
- `createdAt`
- `updatedAt`

### Feedback

- `id`
- `userId`
- `content`
- `createdAt`

### Version

- `id`
- `title`
- `description`
- `androidVersionName`
- `iosVersionName`
- `androidDownloadUrl`
- `iosDownloadUrl`
- `forceUpdate`
- `releasedAt`

## 分阶段迁移计划

### Phase 0：迁移准备

状态：已完成

目标：

- 完成迁移实施文档。
- 确认技术栈和边界。
- 明确不迁移旧数据、不兼容旧 token、不接入网易云信。

完成标准：

- 本文档已创建。
- 所有关键决策已记录。
- 后续阶段有明确任务列表。

### Phase 1：Node 项目骨架

状态：已完成

任务：

- 创建 `server-node/`。
- 初始化 NestJS + TypeScript。
- 接入 ESLint、Prettier、Jest。
- 配置 `.env.example`。
- 接入 `@nestjs/config`。
- 接入 Swagger/OpenAPI。
- 建立统一响应、异常过滤器、日志基础设施。

完成标准：

- `npm run start:dev` 可以启动。
- Swagger 页面可以访问。
- 健康检查接口可用。
- 基础测试可运行。

### Phase 2：数据库与 Prisma

状态：已完成

任务：

- 添加 Prisma。
- 配置 PostgreSQL。
- 设计第一版 `schema.prisma`。
- 添加 migration。
- 添加 seed 脚本。
- 初始化默认管理员、App 配置、VIP 套餐。

完成标准：

- `prisma migrate dev` 可成功执行。
- `prisma db seed` 可成功执行。
- 管理员账号可登录。

当前进展：

- 已创建 Neon Postgres 项目 `byyouside-dev`，并将数据库命名为 `dev`。
- Neon `main` 分支作为线上测试环境数据库，Branch ID 为 `br-odd-smoke-ajcku34s`。
- Neon `local` 分支作为本地开发数据库，Branch ID 为 `br-restless-feather-aj3rh3dm`。
- 两个分支都保留数据库名 `dev`；本地 `.env` 应指向 `local/dev`，测试环境 `.env.test` 或部署环境变量应指向 `main/dev`。
- 已添加 Prisma 7、PostgreSQL datasource、`@prisma/adapter-pg` 和 `PrismaService`。
- 已设计第一版 `schema.prisma`，覆盖用户、验证码、好友关系、设备快照、回忆录、瞬间、VIP、配置、公告、反馈和版本。
- 已添加首个 migration SQL：`server-node/prisma/migrations/20260517010000_init/migration.sql`。
- 已添加 seed 脚本，初始化默认管理员、App 配置和旧系统 `InitLogic` 中的 10 个 VIP 套餐。
- 已通过 Prisma format/validate/generate、format、lint、unit test、e2e test 和 build。
- 已执行 `npm run prisma:migrate -- --name init_neon_dev` 和 `npm run prisma:seed`。
- Neon SQL 核对结果：`users=1`、`app_configs=1`、`vip_plans=10`、`_prisma_migrations=1`。
- 2026-05-17 已创建 Neon `local` 分支，并已将本地 `.env` 的 `DATABASE_URL` 替换为 `local` 分支直连 host；`.env.test` 和线上测试环境继续指向 `main` 分支直连 host。

### Phase 3：认证与用户模块

状态：已完成

任务：

- 注册。
- 登录。
- 标准 JWT 鉴权。
- 当前用户信息。
- 用户资料更新。
- 密码重置验证码。
- 账号注销/取消注销。
- 角色与管理员权限。

完成标准：

- API 文档完整。
- 单元测试和 e2e 测试覆盖主要成功/失败场景。
- 密码 hash、验证码 hash、JWT 过期逻辑正确。

当前进展：

- 已创建并验证 `docs/migration-plans/phase-03-auth-users.md`。
- 已实现 Auth/User DTO、Swagger 文档、标准 JWT 签发与校验、JWT guard、当前用户 decorator、mock/log 邮件 provider。
- 已实现注册、登录、密码重置验证码发送、密码重置确认、获取当前用户、更新当前用户、申请注销和取消注销接口。
- 新系统使用标准 JWT payload `sub/iat/exp`，不兼容旧 token。
- 验证码写入 `VerificationCode` 并只保存 hash。
- 用户更新不再同步网易云信 IM。
- 已通过 `npm run format`、`npm run lint`、`npm run test`、`npm run test:e2e` 和 `npm run build`。
- 已确认 Swagger JSON 包含 Auth/User 新接口，且本地 seed 管理员账号可以登录。

### Phase 4：好友关系模块

状态：已完成

任务：

- 好友申请。
- 同意申请。
- 拒绝申请。
- 删除好友。
- 拉黑/取消拉黑。
- 修改备注。
- 查询我的好友。
- 查询请求我的好友。
- 绑定亲密好友。

完成标准：

- 明确新关系模型是单条记录还是双向记录。
- 所有状态流转有测试。
- 删除好友时关联内容处理策略明确。

当前进展：

- 已创建并验证 `docs/migration-plans/phase-04-friends.md`。
- 新系统第一版继续采用双向 `FriendRelation` 记录，保留旧系统对“我的关系 ID”、双方列表、回忆录和瞬间关联清理的业务语义。
- 已实现请求好友、同意请求、拒绝请求、删除好友、拉黑/取消拉黑、修改备注、查询我的好友、查询请求我的好友和绑定亲密好友接口。
- 删除好友会删除双方关系记录，并清理双方关系 ID 下的回忆录和瞬间。
- 已添加 mock/log `PushService`，好友申请和同意请求只记录开发推送，不发送真实友盟消息；真实友盟接入留到 Phase 9。
- 已补充 Friends Swagger DTO、真实响应示例捕获、单元测试和 e2e 主链路测试。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand`、`npm run build` 和 `npm run api:examples`。

### Phase 5：设备与位置模块

状态：已完成

任务：

- 上报设备状态。
- 查询当前用户设备历史。
- 查询指定用户设备历史。
- 查询最新设备状态。
- 同步用户最近位置。
- 请求位置推送。

完成标准：

- 推送 provider 支持 mock/log 和真实调用。
- 位置相关接口有权限控制。
- API 文档说明清楚隐私边界。

当前进展：

- 已创建并验证 `docs/migration-plans/phase-05-devices-location.md`。
- 已实现设备状态上报、当前用户设备历史、当前用户最新设备、指定好友设备历史、指定好友最新设备和请求好友位置接口。
- 上报设备快照时会同步 `User.lastLocationAddress`、`lastLocationLongitude`、`lastLocationLatitude` 和 `lastLocationAt`。
- 指定用户设备查询和请求位置已收紧为仅允许已接受好友关系访问；这是相对旧接口的有意隐私保护变化。
- 已扩展 mock/log `PushService`，请求位置阶段只记录开发推送，真实友盟接入仍留到 Phase 9。
- 已补充 Devices Swagger DTO、真实响应示例捕获、单元测试和 e2e 主链路测试。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand`、`npm run build` 和 `npm run api:examples`。

### Phase 6：回忆录与瞬间模块

状态：已完成

任务：

- 创建、更新、删除、详情、列表。
- 限制只能在有效好友关系中创建内容。
- 限制只能删除自己的内容。
- 支持按发生时间倒序分页。

完成标准：

- Memoir 和 Moment 逻辑独立但风格一致。
- 列表查询能正确返回双方内容。
- 删除好友后的内容处理策略已实现并测试。

当前进展：

- 已创建并验证 `docs/migration-plans/phase-06-memoirs-moments.md`。
- 已实现回忆录创建、更新、删除、详情和分页列表接口。
- 已实现瞬间创建、更新、删除、详情和分页列表接口。
- 新接口继续使用 Phase 4 的双向 `FriendRelation` 模型，列表会同时读取双方好友关系 ID 下的内容。
- 创建和列表要求使用当前用户拥有的已接受好友关系 ID；详情要求当前用户属于该内容所在的已接受好友关系。
- 更新和删除已收紧为仅作者本人可操作；这是相对旧更新接口的有意内容安全修正。
- 详情接口已收紧好友关系成员访问；这是相对旧详情接口的有意越权防护修正。
- 已复用 Phase 2 的 `Memoir` 和 `Moment` Prisma model，本阶段无需新增 migration。
- 已补充 Memoirs/Moments Swagger DTO、真实响应示例捕获、单元测试和 e2e 主链路测试。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand`、`npm run build` 和 `npm run api:examples`。

### Phase 7：VIP 模块

状态：已完成

任务：

- VIP 套餐管理。
- VIP 开通。
- VIP 订单记录。
- 双人会员名额。
- 会员绑定。
- 会员过期处理。

完成标准：

- 不再调用网易云信。
- 金额、套餐、会员到期时间计算准确。
- 双人会员名额不可超用。
- 管理接口需要管理员权限。

当前进展：

- 已创建并验证 `docs/migration-plans/phase-07-vip.md`。
- 已实现 VIP 套餐查询、管理员创建套餐、管理员更新套餐、开通 VIP、我的订单、管理员订单列表和双人会员绑定接口。
- 新系统复用 Phase 2 的 `VipPlan`、`VipOrder` 和用户 VIP 字段，本阶段无需新增 migration。
- 开通 VIP 会创建订单并更新用户 `vipLevel`、`vipSource`、`vipExpiresAt`、`vipBindQuotaTotal` 和 `vipBindQuotaUsed`。
- 到期时间规则延续旧系统：未过期时从原到期时间累加套餐月数，已过期或无到期时间时从当前时间累加套餐月数。
- 双人套餐会给购买者 1 个绑定名额；绑定来源开通给目标用户时目标用户无绑定名额，并扣减开通方已使用名额。
- 普通用户只能给自己开通 VIP；管理员可给指定用户开通或赠送，这是相对旧接口的有意权限收紧。
- 已移除旧云信 IM 副作用，不创建或同步 `imAccountId`。
- 已扩展 mock/log `PushService`，绑定 VIP 阶段只记录开发推送，真实友盟接入仍留到 Phase 9。
- 已补充 VIP Swagger DTO、真实响应示例捕获、单元测试和 e2e 主链路测试。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand`、`npm run build` 和 `npm run api:examples`。

### Phase 8：配置、公告、反馈、版本

状态：已完成

任务：

- App 配置。
- 公告。
- 反馈。
- 版本发布与最新版本查询。
- 管理员权限边界。

完成标准：

- 公共接口和管理接口权限分明。
- App 启动所需配置可一次性获取。
- Swagger 文档可直接指导 App 接入。

当前进展：

- 已创建并关闭 `docs/migration-plans/phase-08-config-content-version.md`。
- 已实现 App 配置查询与管理员更新接口，公开查询会附带 VIP 套餐列表。
- 已实现公告创建、公告分页列表和最新公告查询。
- 已实现反馈提交和管理员反馈分页列表。
- 已实现版本发布和最新版本查询。
- 公告创建、反馈列表、配置更新和版本发布均收敛为管理员权限；反馈提交需要登录；配置、公告列表、最新公告和最新版本为公开查询。
- 已补充 Phase 8 Swagger DTO、真实响应示例捕获、单元测试和 e2e 主链路测试。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand`、`npm run build` 和 `npm run api:examples`。

### Phase 9：外部服务与生产配置

状态：已完成

任务：

- 邮件 provider。
- 友盟推送 provider。
- 配置真实服务密钥。
- 配置日志脱敏。
- 生产环境 `.env.example` 完整。

完成标准：

- dev 环境不会误发真实邮件/推送。
- prod 环境配置完整即可启用真实服务。
- 密钥不进入源码。

当前进展：

- 已创建并关闭 `docs/migration-plans/phase-09-external-services-production-config.md`。
- 已实现 `MAIL_MODE=log|smtp`，默认 log 模式不发送真实邮件且不记录验证码明文；SMTP 模式从 `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM` 读取配置。
- 已实现 `PUSH_MODE=log|umeng`，默认 log 模式不请求友盟且会脱敏设备别名；友盟模式从 `UMENG_*` 环境变量读取 Android/iOS appKey 和 master secret。
- 友盟推送保留旧系统 `requestLocation`、`requestAddFriend`、`agreeAddFriend`、`bindVip` 四类消息类型，继续使用 `customizedcast`、alias/alias_type、`push_prod` 别名生产模式判断和旧 MD5 签名规则。
- 已补齐 `server-node/.env.example` 的 SMTP 与友盟配置占位，不包含真实密钥。
- 已补充 `MailService` 和 `PushService` 单元测试，覆盖 log 模式、配置缺失、SMTP 发送、友盟签名和 payload。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand` 和 `npm run build`。
- 2026-05-19 已按部署要求复查配置：`server-node/.env` 使用旧 dev 端口 `38080` 和 Neon local；`server-node/.env.production` 使用旧 prod 端口 `38020` 和 Neon main；SMTP、友盟、JWT 均从旧项目真实参数回填到本地忽略环境文件。
- 已移除数据库、JWT、PORT、seed 和 Swagger 示例捕获中的示例兜底值；缺少真实配置时会明确失败。
- 已生成初始管理员配置并写入本地忽略环境文件；Neon local 与 main 分支均已执行 seed，并通过登录接口验证 `ADMIN` 角色。

### Phase 10：验收与切换

状态：进行中

任务：

- 全量 API 文档复查。
- e2e 测试通过。
- 关键业务手动验收。
- App 根据新 API 文档完成接入。
- 旧项目停止维护。

完成标准：

- 新后端可独立支撑 App。
- 文档、代码、测试一致。
- 已知风险和未完成项有明确记录。

当前进展：

- 已创建并验证 `docs/migration-plans/phase-10-acceptance-cutover.md`。
- 已修正 `docs/migration-plans/README.md` 中 Phase 3-5 的过期状态，并加入 Phase 10 计划索引。
- 已补齐 `server-node/scripts/capture-api-examples.ts` 对健康检查、密码重置确认、好友拒绝、VIP 套餐创建/更新和管理员订单列表的真实 HTTP 示例捕获。
- 密码重置确认示例通过临时 hash 验证码预置并由真实接口消费，生成文件只保留脱敏验证码占位。
- 已刷新 `server-node/docs/swagger/openapi-examples.json`，Swagger JSON 对照结果为 50 条路由、50 条示例，缺失 0，额外 0。
- 已完成示例安全扫描，未发现原始 JWT、验证码、数据库连接串、SMTP 密钥、友盟密钥或演示密码。
- 已通过 `npm run format`、`npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e -- --runInBand`、`npm run build` 和 `npm run api:examples`。
- 本阶段仍需 App 客户端按新 API 文档接入并完成关键业务人工验收；生产切换、域名/进程/日志/备份方案和真实 SMTP/友盟在线联调仍待部署阶段完成。

### Phase 11：生产就绪与切换准备

状态：阻塞

任务：

- 整理不涉及 App 改造的服务端上线前待办。
- 确认生产部署平台、域名、端口、Node.js 版本和进程守护方式。
- 确认 Neon 生产数据库分支、备份和回滚策略。
- 确认生产环境变量交付方式，避免真实密钥进入源码。
- 完成 SMTP 真实发送联调。
- 完成友盟四类真实设备推送联调。
- 整理旧 Kotlin/Spring Boot 后端停用检查清单。

完成标准：

- 生产环境变量已完整落地到部署平台或受控忽略文件。
- 生产环境可构建、启动并通过健康检查。
- 管理员 seed、App 配置和 VIP 套餐已在生产数据库验证。
- SMTP 和友盟真实联调结果已记录。
- 旧后端停用和回滚策略已记录。

当前进展：

- 已创建 `docs/migration-plans/phase-11-production-readiness.md`。
- 已整理生产环境变量清单、部署运行手册草案、数据库与回滚清单、外部服务联调清单和旧后端停用清单。
- 当前阻塞于用户提供生产部署目标、域名端口、进程守护方式、Neon 生产数据库策略、真实 SMTP 联调收件邮箱、真实友盟设备 alias 和旧后端停用时机。

## 测试策略

建议至少包含三类测试：

### 1. 单元测试

覆盖：

- 密码 hash。
- JWT 签发与校验。
- 业务状态机，例如好友申请状态。
- 会员到期时间计算。
- 绑定名额计算。
- 验证码过期与消费逻辑。

### 2. e2e 测试

覆盖核心链路：

- 注册 -> 登录 -> 获取当前用户。
- 发送验证码 -> 重置密码 -> 新密码登录。
- A 请求 B -> B 同意 -> 双方成为好友。
- 设备上报 -> 查询最新设备。
- 创建回忆录/瞬间 -> 查询列表 -> 删除。
- 开通双人会员 -> 给对方绑定 -> 名额减少。

### 3. API 文档校验

要求：

- Swagger 文档可访问。
- DTO 与实际响应一致。
- 示例请求可执行。
- 错误码文档与代码一致。

## 安全与隐私要求

新系统必须重点处理：

- 所有密钥从环境变量读取。
- 不提交真实 `.env`。
- 密码只保存 hash。
- 验证码建议只保存 hash。
- JWT 必须有过期时间。
- 管理接口必须有角色校验。
- 设备与位置接口必须有明确权限控制。
- 日志不得输出密码、验证码、token、外部服务密钥。
- H2 Console 相关能力不再存在。

## 待确认问题

当前没有阻塞迁移文档创建的问题。

后续进入实现阶段前，建议再确认：

- Node.js 版本，例如 20 LTS 或 22 LTS。
- 包管理器：npm、pnpm 或 yarn。
- PostgreSQL 运行方式：本机安装、Docker Compose 或远程数据库。
- 新 API 的 URL 命名风格：REST 资源风格或保留 `/api` 统一前缀。
- 是否需要 Refresh Token。
- 是否需要文件上传能力，例如头像、图片、媒体内容。

## 文档维护规则

每次迁移推进后，应更新：

- “当前状态”表格。
- 对应 Phase 的状态。
- 已完成任务。
- 新增决策。
- 遗留问题。
- 风险与处理方式。

执行迁移任务时，应优先使用项目内 Skill：

```text
.codex/skills/byyouside-node-migration/
```

该 Skill 规定了迁移时的基本作业方式：先完整阅读旧代码，再设计和实现新 Node.js 模块，禁止凭空推测业务功能，并要求持续维护 API 文档、测试和迁移状态。

较大的模块或跨模块任务必须先创建模块执行计划，位置：

```text
docs/migration-plans/
```

计划文档应在编码前完成初稿和自审，执行过程中持续更新任务状态，完成后记录验证结果和遗留问题。没有计划文档的大模块不得标记为完成。

状态枚举建议使用：

- 未开始
- 进行中
- 已完成
- 暂停
- 废弃

## 2026-05-18 迁移进展补充

Phase 8 配置、公告、反馈、版本模块已完成并通过验证。

已完成内容：

- 创建并关闭 `docs/migration-plans/phase-08-config-content-version.md`。
- 完成 App 配置接口：`GET /api/v1/app-config/app`、`PATCH /api/v1/app-config/app`。
- 完成公告接口：`POST /api/v1/announcements`、`GET /api/v1/announcements`、`GET /api/v1/announcements/latest`。
- 完成反馈接口：`POST /api/v1/feedback`、`GET /api/v1/feedback`。
- 完成版本接口：`POST /api/v1/versions`、`GET /api/v1/versions/latest`。
- 公告创建、反馈列表、配置更新和版本发布均收敛为管理员权限；反馈提交需要登录；配置、公告列表、最新公告和最新版本为公开查询。
- 已把 Phase 8 接口加入 `server-node/scripts/capture-api-examples.ts` 的 Swagger 真实示例捕获范围。
- 已补齐 Phase 8 单元测试和 e2e 主链路测试。

验证结果：

- `npm run format` 通过。
- `npm run lint` 通过。
- `npm run test -- --runInBand` 通过，11 个测试套件、25 个测试通过。
- `npm run test:e2e -- --runInBand` 通过，1 个测试套件、8 个测试通过。
- `npm run build` 通过。
- `npm run api:examples` 通过，并刷新 `server-node/docs/swagger/openapi-examples.json`。

## 2026-05-18 Phase 9 迁移进展补充

Phase 9 外部服务与生产配置已完成并通过验证。

已完成内容：

- 创建并关闭 `docs/migration-plans/phase-09-external-services-production-config.md`。
- 完成 SMTP 邮件 provider：`MAIL_MODE=log|smtp`，默认 log 模式不发送真实邮件且不记录验证码明文。
- 完成友盟推送 provider：`PUSH_MODE=log|umeng`，保留旧系统四类业务推送和 MD5 签名规则，log 模式脱敏设备别名。
- 补齐 `server-node/.env.example` 的 SMTP 与友盟配置占位，未写入真实密钥。
- 外部服务调用改为异步等待，避免真实 provider 失败时业务层静默成功。
- 新增邮件与推送集成单元测试，覆盖 log 模式、配置缺失、SMTP 发送、友盟签名和 payload。
- 2026-05-19 复查运行环境：真实 SMTP、友盟、JWT、端口、Neon local/main 已写入本地忽略的 `.env` / `.env.production` / `.env.test`；仓库内只保留安全配置模板。
- 已生成初始管理员配置，写入本地忽略环境文件，并在 Neon local/main 分支完成 seed 与登录验证。

验证结果：

- `npm run format` 通过。
- `npm run lint` 通过。
- `npm run test -- --runInBand` 通过，13 个测试套件、31 个测试通过。
- `npm run test:e2e -- --runInBand` 通过，1 个测试套件、8 个测试通过。
- `npm run build` 通过。

## 2026-05-20 Phase 10 后端验收进展补充

Phase 10 的服务端验收准备已完成并通过验证，整体 Phase 10 仍保留 App 接入、生产部署和真实外部服务在线联调事项。

已完成内容：

- 创建并验证 `docs/migration-plans/phase-10-acceptance-cutover.md`。
- 修正 `docs/migration-plans/README.md` 中 Phase 3-5 的过期状态，并加入 Phase 10 计划索引。
- 补齐 `server-node/scripts/capture-api-examples.ts` 对健康检查、密码重置确认、好友拒绝、VIP 套餐创建/更新和管理员订单列表的真实 HTTP 示例捕获。
- 刷新 `server-node/docs/swagger/openapi-examples.json`，当前 Swagger JSON 对照结果为 50 条路由、50 条示例，缺失 0，额外 0。
- 完成示例安全扫描，未发现原始 JWT、验证码、数据库连接串、SMTP 密钥、友盟密钥或演示密码。

验证结果：

- `npm run format` 通过。
- `npm run lint` 通过。
- `npm run test -- --runInBand` 通过，13 个测试套件、31 个测试通过。
- `npm run test:e2e -- --runInBand` 通过，1 个测试套件、8 个测试通过。
- `npm run build` 通过。
- `npm run api:examples` 通过。

## 2026-05-21 Phase 11 生产就绪计划补充

已按“不涉及 App 改造”的边界创建生产就绪与切换准备计划。

已完成内容：

- 创建 `docs/migration-plans/phase-11-production-readiness.md`。
- 在计划中整理需要维护或补充的文档内容：生产环境变量清单、部署运行手册、外部服务联调记录、数据库上线与回滚记录、旧后端停用检查清单。
- 在计划中列出需要用户确认或提供的信息：部署平台、域名端口、Node.js 版本、进程守护方式、Neon 生产数据库策略、真实 SMTP 联调收件邮箱、真实友盟设备 alias、旧后端停用时机。
- 将 `API 文档编写` 状态调整为已完成；后续只在 App 联调或生产验收发现差异时继续维护。

当前阻塞：

- 生产部署目标和运行方式未确认。
- Neon 生产数据库策略和备份/回滚要求未确认。
- SMTP 真实发送联调收件邮箱未确认。
- 友盟真实设备 alias 未提供。
- 旧后端停用日期和回滚窗口未确认。

## 下一步建议

下一步建议先解除 Phase 11 的生产就绪阻塞项，再推进 App 接入和最终切换。

1. 提供或确认生产部署平台、域名、端口、Node.js 版本和进程守护方式。
2. 确认 Neon 生产数据库使用策略、备份点和回滚窗口。
3. 确认生产环境变量注入方式，保证真实密钥只进入部署变量或本地忽略文件。
4. 提供 SMTP 联调收件邮箱和真实友盟 Android/iOS 设备 alias。
5. 完成生产环境启动、SMTP/友盟联调和旧后端停用检查后，再推进 App 接入验收和最终切流。
