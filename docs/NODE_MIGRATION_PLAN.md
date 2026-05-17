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
| 邮件和推送 | 已完成 | 保留并正常接入，开发环境支持 mock/log 模式 |
| 迁移实施文档 | 已完成 | 已创建本文档，后续按阶段持续更新 |
| 迁移作业 Skill | 已完成 | 已创建 `.codex/skills/byyouside-node-migration/`，后续迁移任务应优先使用 |
| Node 项目初始化 | 已完成 | `server-node/` NestJS 基础骨架、Swagger、统一响应、异常处理、健康检查和基础测试已完成 |
| 数据模型设计 | 已完成 | Phase 2 已完成第一版 Prisma schema、migration SQL、Neon main/dev 数据库 migration 和 seed；已创建 Neon local 分支用于本地开发 |
| API 文档编写 | 进行中 | Phase 1 已建立 Swagger/OpenAPI；Phase 3 已补充 Auth/User 接口文档和真实响应示例捕获；Phase 4 已补充 Friends 接口文档和真实响应示例捕获；Phase 5 已补充 Devices 接口文档和真实响应示例捕获 |
| 业务模块迁移 | 进行中 | Phase 5 设备与位置模块第一版已完成并通过验证 |
| 测试与验收 | 进行中 | Phase 1 已建立基础验证；Phase 3 已补充 Auth/User 测试；Phase 4 已补充 Friends 单元测试与 e2e 主链路测试；Phase 5 已补充 Devices 单元测试与 e2e 主链路测试 |

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
| Memoirs | 待设计 | `/api/memoirs/*` | 未开始 |
| Moments | 待设计 | `/api/moments/*` | 未开始 |
| VIP | 待设计 | `/api/vip/*` | 未开始 |
| Config | 待设计 | `/api/config/*` | 未开始 |
| Announcements | 待设计 | `/api/announcement/*` | 未开始 |
| Feedback | 待设计 | `/api/feedback/*` | 未开始 |
| Versions | 待设计 | `/api/version/*` | 未开始 |

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
- 已验证 Swagger JSON 包含 Auth/User 新接口，且本地 seed 管理员账号可以登录。

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

状态：未开始

任务：

- 创建、更新、删除、详情、列表。
- 限制只能在有效好友关系中创建内容。
- 限制只能删除自己的内容。
- 支持按发生时间倒序分页。

完成标准：

- Memoir 和 Moment 逻辑独立但风格一致。
- 列表查询能正确返回双方内容。
- 删除好友后的内容处理策略已实现并测试。

### Phase 7：VIP 模块

状态：未开始

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

### Phase 8：配置、公告、反馈、版本

状态：未开始

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

### Phase 9：外部服务与生产配置

状态：未开始

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

### Phase 10：验收与切换

状态：未开始

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

## 下一步建议

下一步建议执行 Phase 6：

1. 创建或更新 `docs/migration-plans/phase-06-memoirs-moments.md`。
2. 阅读旧 `MemoirsController.kt`、`Memoirs.kt`、`MemoirsRepository.kt`、`MomentsController.kt`、`Moments.kt`、`MomentsRepository.kt` 和 `FriendRepository.kt`。
3. 明确回忆录、瞬间与好友关系 ID 的权限边界，以及删除好友后的内容清理策略。
4. 实现回忆录与瞬间的创建、更新、删除、详情和分页列表接口。
5. 补齐 Swagger DTO、真实示例捕获、单元测试和 e2e 测试。
