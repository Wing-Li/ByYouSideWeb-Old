# Phase 02 Prisma 数据库执行计划

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

## 目标

为 `server-node/` 接入 Prisma 和 PostgreSQL，建立第一版长期维护数据模型，并提供默认管理员、App 配置和 VIP 套餐的 seed 脚本。本阶段只建立持久化基础，不实现注册、登录、会员开通等业务接口。

## 范围

范围内：

- 添加 Prisma CLI、Prisma Client 和 PostgreSQL datasource 配置。
- 创建第一版 `schema.prisma`。
- 创建数据库模块和 `PrismaService`，供后续 NestJS 模块复用。
- 添加 seed 脚本，初始化管理员、默认配置和旧系统中的 10 个 VIP 套餐。
- 更新 `.env.example` 和 npm 脚本。
- 更新迁移文档状态。

范围外：

- 实现 Auth/User/VIP/Config 等业务接口。
- 连接真实生产数据库或提交真实 `.env`。
- 迁移旧 H2 数据。
- 兼容旧 Token。
- 重新接入网易云信 IM。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfoRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/friend/Friend.kt`
- `src/main/kotlin/com/lyl/byyouside/model/device/DeviceInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/model/memoirs/Memoirs.kt`
- `src/main/kotlin/com/lyl/byyouside/model/moment/Moments.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/Vip.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/VipRecharge.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/VipRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/VipRechargeRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/config/ConfigInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/ConfigInfoController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/announcement/Announcement.kt`
- `src/main/kotlin/com/lyl/byyouside/model/feedback/Feedback.kt`
- `src/main/kotlin/com/lyl/byyouside/model/version/Version.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/init/InitLogic.kt`
- `.codex/skills/byyouside-node-migration/references/legacy-reading-checklist.md`
- `.codex/skills/byyouside-node-migration/references/node-project-standards.md`

旧行为摘要：

- 路由：本阶段不新增业务路由；旧业务路由后续分模块迁移。
- 鉴权/当前用户：旧系统通过 `ContextHolder.userId` 和用户表 `status == "admin"` 判断管理员；新 schema 改为 `UserRole` enum。
- 请求字段：本阶段无请求 DTO。
- 响应结构：本阶段无新增响应。
- 校验：数据库层使用唯一约束、枚举和非空字段承载基础约束；业务校验留到后续模块。
- 数据读写：旧 `InitLogic` 初始化 VIP 套餐和默认配置；新 seed 负责同类默认数据，并新增默认管理员。
- 外部副作用：本阶段无邮件、推送或 IM 调用。
- 错误码：本阶段不新增业务错误码。
- 初始化/默认数据：旧系统初始化 App 名称 `伴你左右`、`unCheckModel=false`，以及单人和双人 10 个 VIP 套餐。

## 有意变化

- 用户密码字段从旧 `password` 改为 `passwordHash`，seed 管理员只保存 hash。
- 用户管理员身份从旧字符串 `status == "admin"` 改为 `role: USER | ADMIN`。
- 旧 `code/codeDate` 拆为独立 `VerificationCode` 模型，验证码只保存 hash。
- 旧 `imAccountId` 不进入新 schema。
- VIP `status` 数字含义改为枚举：`DISABLED`、`ACTIVE`、`DUET`、`TEST`。
- 旧 `bindCount` 字符串拆为 `vipBindQuotaTotal` 和 `vipBindQuotaUsed`，避免后续业务解析字符串。
- 旧 `ConfigInfo.unCheckModel` 保留为 `unCheckMode`，语义仍按旧注释记录：`false` 为审核模式，`true` 为正常模式。

## 新 API 设计

本阶段不新增公开 API。

Swagger/OpenAPI 要求：

- 本阶段只接入数据库基础设施，无新增 Controller。
- 后续业务模块使用本阶段 schema 时，必须补齐 Swagger DTO 和响应示例。

## 数据模型设计

Prisma models 或 model 变化：

- `User`：账号、资料、角色、VIP 状态、推送别名、最近位置和注销信息。
- `VerificationCode`：邮箱验证码和密码重置验证码。
- `FriendRelation`：延续旧双向关系可表达的信息，同时用单表关系为后续 API 简化留空间。
- `DeviceSnapshot`：设备与位置快照。
- `Memoir`、`Moment`：回忆录和瞬间内容。
- `VipPlan`、`VipOrder`：会员套餐和充值记录。
- `AppConfig`、`Announcement`、`Feedback`、`AppVersion`：配置、公告、反馈、版本。

索引/约束：

- `User.username`、`User.email` 唯一。
- `VipPlan.productCode` 唯一。
- 常用查询字段添加索引：用户、好友关系状态、设备时间、内容时间、订单时间、配置环境、版本发布时间。

种子数据：

- 默认管理员：由 `ADMIN_USERNAME`、`ADMIN_EMAIL`、`ADMIN_PASSWORD` 读取，缺省使用开发占位值。
- 默认配置：`APP_NAME=伴你左右`，`APP_UNCHECK_MODE=false`。
- 默认 VIP 套餐：来自旧 `InitLogic` 的 10 个套餐。

## 实现任务

- [x] 创建 Phase 2 计划。
- [x] 添加 Prisma schema。
- [x] 添加 PrismaService 和 DatabaseModule。
- [x] 添加 seed 脚本。
- [x] 更新 `.env.example` 和 npm 脚本。
- [x] 生成 Prisma Client。
- [x] 运行格式化、lint、测试、构建和 Prisma 校验。
- [x] 添加首个 Prisma migration SQL。
- [x] 更新迁移文档状态。

## 验证计划

需要运行的命令：

```text
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run format
npm run lint
npm run test
npm run test:e2e
npm run build
```

手动检查：

- 确认 `.env` 未进入版本控制。
- 确认 schema 不包含 `imAccountId`。
- 确认 seed 不写死真实密钥或真实生产密码。

## 风险与开放问题

- Neon Postgres `main` 分支已创建 `dev` 数据库，并作为线上测试环境数据库。
- Neon Postgres 已从 `main` 创建 `local` 分支，作为本地开发数据库；Branch ID 为 `br-restless-feather-aj3rh3dm`。
- Prisma 迁移需要使用 Neon 直连 host，不使用 pooled host。
- 本地 `.env` 已切换为 `local/dev` 直连 host；`.env.test` 和线上测试环境继续指向 `main/dev` 直连 host。
- Prisma 7 seed 命令配置在 `prisma.config.ts` 的 `migrations.seed` 中。
- 管理员账号目前只能 seed，登录接口要等 Phase 3 实现后验收。

## 审阅记录

计划审阅结果：

- [x] 旧实体和初始化行为已覆盖第一版 schema。
- [x] 本阶段无新增 API，文档计划清晰。
- [x] 数据模型计划覆盖后续模块所需基础表。
- [x] 验证计划包含 Prisma 校验、生成、lint、测试和构建。
- [x] 没有阻塞实现的问题。

审阅备注：

- 可以执行 Phase 2 基础设施实现。
- Neon `main/dev` 数据库已完成 migration 和 seed；Neon `local/dev` 分支已创建并配置为本地开发数据库。管理员登录验收仍需等待 Phase 3。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-17 | 实现中 | 阅读迁移文档、Skill 规则、旧实体和初始化逻辑后创建计划 |
| 2026-05-17 | 已实现 | 添加 Prisma schema、数据库模块、seed 脚本、首个 migration SQL 和环境变量模板 |
| 2026-05-17 | 已验证 | Prisma format/validate/generate、format、lint、unit test、e2e test、build 均通过；因本机未确认 PostgreSQL，未执行 `prisma migrate dev` 和 `prisma db seed` |
| 2026-05-17 | 已验证 | 创建 Neon Postgres 项目 `byyouside-dev` 和数据库 `dev`，完成 migration 与 seed；数据库核对结果为 users=1、app_configs=1、vip_plans=10、migrations=1 |
| 2026-05-17 | 已验证 | 从 Neon `main` 创建 `local` 分支用于本地开发，并将本地 `.env` 切换到 `local/dev` 直连 host |

## 完成记录

已完成代码：

- `server-node/prisma/schema.prisma`
- `server-node/prisma/migrations/20260517010000_init/migration.sql`
- `server-node/prisma/seed.ts`
- `server-node/prisma.config.ts`
- `server-node/src/database/database.module.ts`
- `server-node/src/database/prisma.service.ts`
- `server-node/.env.example`
- `server-node/package.json`

已完成文档：

- 本计划。
- `docs/NODE_MIGRATION_PLAN.md`
- `docs/migration-plans/README.md`
- `server-node/README.md`

验证结果：

- `npm run prisma:format`：通过。
- `npm run prisma:validate`：通过。
- `npm run prisma:generate`：通过。
- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test`：通过。
- `npm run test:e2e`：通过。
- `npm run build`：通过。
- `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/20260517010000_init/migration.sql`：通过。
- `npm run prisma:migrate -- --name init_neon_dev`：通过，已应用到 Neon `dev` 数据库。
- `npm run prisma:seed`：通过，已写入默认管理员、App 配置和 10 个 VIP 套餐。
- Neon SQL 核对：`users=1`、`app_configs=1`、`vip_plans=10`、`_prisma_migrations=1`。
- Neon 分支创建：`local` / `br-restless-feather-aj3rh3dm`，父分支 `main` / `br-odd-smoke-ajcku34s`。

已知后续：

- Phase 3 需要基于本 schema 实现 Auth/User 接口和管理员登录验收。
- Phase 3 完成登录接口后，需要验证 seed 管理员账号可登录。
- 后续本地开发默认使用 `local/dev`，发布测试环境时使用 `main/dev`。
