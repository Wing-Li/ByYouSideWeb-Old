# Phase 11 生产就绪与切换准备计划

状态：阻塞

## 目标

在不涉及 App 客户端改造的前提下，整理 Node.js 后端上线前仍需要确认、配置、联调和记录的事项，形成可执行的生产就绪计划。该计划用于承接 Phase 10 已完成的服务端验收结果，继续推进部署环境、生产配置、外部服务联调、数据库安全和旧后端停用准备。

## 范围

范围内：

- 生产部署方式确认。
- 生产环境变量与密钥交付清单。
- Neon 数据库分支、备份和回滚策略确认。
- SMTP 真实发送联调。
- 友盟真实设备推送联调。
- 生产启动、健康检查、Swagger 文档访问和日志检查。
- 旧 Kotlin/Spring Boot 后端停用前检查清单。
- 迁移文档和运维交接记录更新。

范围外：

- App 客户端接口改造。
- 新增业务接口。
- 重新设计已完成的数据模型。
- 支付、文件上传、短信、对象存储等未迁移范围外能力。
- 把真实密钥写入仓库。

## 当前依据

已阅读文件：

- `docs/NODE_MIGRATION_PLAN.md`
- `docs/migration-plans/README.md`
- `docs/migration-plans/phase-09-external-services-production-config.md`
- `docs/migration-plans/phase-10-acceptance-cutover.md`
- `server-node/.env.example`
- `server-node/package.json`
- `server-node/prisma/seed.ts`
- `server-node/src/integrations/mail/mail.service.ts`
- `server-node/src/integrations/push/push.service.ts`

当前已知事实：

- Node.js 后端业务模块、Swagger 文档、真实示例捕获和自动化测试已经完成服务端验收。
- `server-node/.env`、`server-node/.env.production`、`server-node/.env.test` 属于本地忽略文件，已记录为真实配置的落点，不能提交真实密钥。
- Neon `local` 分支用于本地开发，Neon `main` 分支当前作为线上测试环境数据库。
- 邮件 provider 支持 `MAIL_MODE=log|smtp`。
- 推送 provider 支持 `PUSH_MODE=log|umeng`。
- 真实 SMTP、友盟、JWT、数据库连接串需要通过本地忽略环境文件或部署平台环境变量提供。
- Phase 10 已确认 Swagger JSON 50 条路由与 50 条示例完全覆盖，示例安全扫描通过。

## 需要维护或补充的文档

建议本阶段至少维护以下文档内容。为减少文档分散，本计划先承载完整清单；执行过程中如内容变长，再拆成独立文档。

| 文档内容 | 建议位置 | 目的 | 当前状态 |
| --- | --- | --- | --- |
| 生产就绪与切换准备计划 | `docs/migration-plans/phase-11-production-readiness.md` | 记录任务、阻塞项、执行顺序和验收标准 | 已创建 |
| 生产环境变量清单 | 本计划的“环境变量交付清单”章节；必要时拆到 `docs/deployment/env-checklist.md` | 明确部署需要哪些变量、由谁提供、是否已落地 | 待确认 |
| 生产部署运行手册 | 本计划的“部署运行手册草案”章节；必要时拆到 `docs/deployment/runbook.md` | 记录构建、启动、健康检查、日志和回滚步骤 | 待确认 |
| 外部服务联调记录 | 本计划的“外部服务联调清单”章节；必要时拆到 `docs/deployment/external-services-checklist.md` | 记录 SMTP 和友盟真实联调结果 | 待确认 |
| 数据库上线与回滚记录 | 本计划的“数据库与回滚清单”章节；必要时拆到 `docs/deployment/database-cutover.md` | 记录 Neon 分支、备份、migration 和回滚策略 | 待确认 |
| 旧后端停用检查清单 | 本计划的“旧后端停用清单”章节；必要时拆到 `docs/deployment/legacy-shutdown.md` | 避免切换后遗漏旧服务依赖 | 待确认 |

## 需要用户确认或提供的信息

当前计划阻塞在以下输入，拿到这些信息后才能继续执行真实部署和联调。

| 编号 | 需要确认的信息 | 用途 | 建议提供方式 |
| --- | --- | --- | --- |
| 1 | 生产部署目标机器或平台 | 确定启动方式、环境变量配置方式、端口和日志路径 | 服务器信息或平台名称 |
| 2 | 生产域名和 HTTPS/反向代理方案 | 确定 API 访问地址、Swagger 地址和 App 接入地址 | 域名、证书或代理方案 |
| 3 | 生产运行端口 | 确认是否继续沿用旧 prod 端口 `38020` | 明确端口 |
| 4 | 生产 Node.js 版本 | 确保构建和运行环境一致 | 建议 Node.js 20 LTS 或 22 LTS |
| 5 | 进程守护方式 | 确认使用 systemd、PM2、Docker、平台托管等 | 选择一种 |
| 6 | Neon 生产数据库策略 | 确认直接使用 `main/dev`，还是新建正式生产分支或数据库 | 分支/数据库决策 |
| 7 | 数据库备份和回滚要求 | 确认上线前备份点、回滚窗口和责任人 | 备份策略 |
| 8 | 部署环境变量注入方式 | 确认密钥进入平台变量、服务器 `.env.production`，还是其他密钥系统 | 配置方式 |
| 9 | 真实 SMTP 联调收件邮箱 | 用于发送一封验证码邮件确认 SMTP 可用 | 测试邮箱 |
| 10 | 真实友盟设备 alias | 用于验证四类推送：请求位置、好友申请、同意好友、绑定 VIP | Android/iOS 设备 alias |
| 11 | 旧后端停用时机 | 确认是否保留回滚窗口和旧服务保留天数 | 日期和策略 |

## 环境变量交付清单

生产环境必须提供以下变量。真实值不得写入仓库，只能进入部署平台环境变量、本地忽略 `.env.production` 或受控密钥系统。

| 变量 | 用途 | 来源建议 | 状态 |
| --- | --- | --- | --- |
| `NODE_ENV` | 运行环境 | 固定为 `production` | 待部署确认 |
| `PORT` | 服务端口 | 生产端口，当前文档建议旧 prod 端口 `38020` | 待确认 |
| `DATABASE_URL` | PostgreSQL 连接 | Neon 生产分支直连或连接池地址 | 待确认 |
| `JWT_SECRET` | JWT 签名密钥 | 部署密钥变量 | 待确认 |
| `JWT_EXPIRES_IN` | JWT 有效期 | 运营安全策略 | 待确认 |
| `APP_ENVIRONMENT` | App 配置环境名 | 生产环境标识 | 待确认 |
| `APP_NAME` | 默认 App 名称 | 业务配置 | 待确认 |
| `APP_UNCHECK_MODE` | 默认审核模式 | 业务配置 | 待确认 |
| `ADMIN_USERNAME` | seed 管理员用户名 | 部署密钥变量或一次性初始化变量 | 待确认 |
| `ADMIN_EMAIL` | seed 管理员邮箱 | 部署密钥变量或一次性初始化变量 | 待确认 |
| `ADMIN_PASSWORD` | seed 管理员初始密码 | 部署密钥变量或一次性初始化变量 | 待确认 |
| `MAIL_MODE` | 邮件模式 | 生产应为 `smtp` | 待联调 |
| `SMTP_HOST` | SMTP 主机 | 邮件服务商 | 待联调 |
| `SMTP_PORT` | SMTP 端口 | 邮件服务商 | 待联调 |
| `SMTP_SECURE` | SMTP SSL/TLS | 邮件服务商 | 待联调 |
| `SMTP_USER` | SMTP 用户 | 邮件服务商 | 待联调 |
| `SMTP_PASS` | SMTP 密码或授权码 | 邮件服务商密钥 | 待联调 |
| `SMTP_FROM` | 发件人 | 邮件服务商 | 待联调 |
| `PUSH_MODE` | 推送模式 | 生产应为 `umeng` | 待联调 |
| `UMENG_ANDROID_APP_KEY` | Android 友盟 appKey | 友盟控制台 | 待联调 |
| `UMENG_ANDROID_APP_MASTER_SECRET` | Android 友盟 master secret | 友盟控制台密钥 | 待联调 |
| `UMENG_IOS_APP_KEY` | iOS 友盟 appKey | 友盟控制台 | 待联调 |
| `UMENG_IOS_APP_MASTER_SECRET` | iOS 友盟 master secret | 友盟控制台密钥 | 待联调 |
| `UMENG_SEND_URL` | 友盟发送地址 | 默认可用官方地址 | 待联调 |
| `UMENG_TIMEOUT_MS` | 友盟请求超时 | 默认 30000 | 待联调 |
| `SWAGGER_ADMIN_EMAIL` | 示例捕获管理员邮箱 | 仅本地或验收环境需要 | 可选 |
| `SWAGGER_ADMIN_PASSWORD` | 示例捕获管理员密码 | 仅本地或验收环境需要 | 可选 |
| `SWAGGER_DEMO_EMAIL` | 示例捕获普通用户邮箱 | 仅本地或验收环境需要 | 可选 |
| `SWAGGER_DEMO_PASSWORD` | 示例捕获普通用户密码 | 仅本地或验收环境需要 | 可选 |

## 部署运行手册草案

待部署平台确认后细化。当前建议流程：

1. 确认生产环境变量已经注入，且没有示例占位值。
2. 安装依赖：`npm ci`。
3. 校验 Prisma schema：`npm run prisma:validate`。
4. 生成 Prisma Client：`npm run prisma:generate`。
5. 如有新增 migration，执行受控 migration；当前第一版 schema 已完成，正式上线前仍需核对 `_prisma_migrations`。
6. 执行 seed：`npm run prisma:seed`，确认默认管理员、App 配置和 VIP 套餐存在。
7. 构建：`npm run build`。
8. 启动：`npm run start:prod`，或由进程守护工具执行 `node dist/src/main.js`。
9. 健康检查：访问 `GET /api/v1/health`。
10. Swagger 检查：访问 `/api/docs` 和 `/api/docs-json`。
11. 登录检查：使用管理员账号调用 `POST /api/v1/auth/login`，确认返回 `ADMIN` 角色。
12. 查看启动日志，确认没有数据库、JWT、SMTP、友盟配置缺失错误。

## 数据库与回滚清单

| 项目 | 检查内容 | 状态 |
| --- | --- | --- |
| 生产分支 | 确认使用 Neon `main/dev` 还是新生产分支 | 待确认 |
| migration 状态 | 核对 `_prisma_migrations` 包含当前 migration | 待执行 |
| seed 状态 | 核对默认管理员、App 配置、VIP 套餐数量 | 待执行 |
| 备份点 | 上线前创建 Neon restore point 或等价备份 | 待确认 |
| 回滚窗口 | 定义切换后保留旧后端多久 | 待确认 |
| 回滚步骤 | 记录如何把流量切回旧 Kotlin/Spring Boot 后端 | 待确认 |

## 外部服务联调清单

| 服务 | 联调动作 | 期望结果 | 状态 |
| --- | --- | --- | --- |
| SMTP | 使用 `MAIL_MODE=smtp` 发送密码重置验证码 | 测试邮箱收到「伴你左右」验证码邮件，服务端不记录验证码明文 | 待执行 |
| 友盟请求位置 | 使用真实设备 alias 触发 `requestLocation` | 目标设备收到请求位置推送 | 待执行 |
| 友盟好友申请 | 使用真实设备 alias 触发 `requestAddFriend` | 目标设备收到好友申请推送 | 待执行 |
| 友盟同意好友 | 使用真实设备 alias 触发 `agreeAddFriend` | 目标设备收到同意好友推送 | 待执行 |
| 友盟绑定 VIP | 使用真实设备 alias 触发 `bindVip` | 目标设备收到绑定 VIP 推送 | 待执行 |

## 旧后端停用清单

| 项目 | 检查内容 | 状态 |
| --- | --- | --- |
| 旧服务依赖 | 确认没有 App 或后台任务仍调用旧 Kotlin/Spring Boot API | 待确认 |
| 旧域名或端口 | 确认流量切到 Node.js 后端 | 待确认 |
| 回滚窗口 | 保留旧服务可回滚时间 | 待确认 |
| 数据留存 | 旧 H2 数据不迁移，但需确认是否保留备份归档 | 待确认 |
| 停用记录 | 在迁移文档记录停用日期、责任人和回滚策略 | 待确认 |

## 执行顺序建议

1. 确认部署平台、域名、端口、Node.js 版本和进程守护方式。
2. 确认 Neon 生产数据库策略和备份/回滚方式。
3. 将生产环境变量写入部署平台或受控 `.env.production`。
4. 在生产或预生产环境执行构建、Prisma 校验、seed 和健康检查。
5. 完成 SMTP 真实发送联调。
6. 完成友盟四类推送真实设备联调。
7. 记录部署运行手册和联调结果。
8. 等 App 接入验收通过后，执行旧后端停用流程。

## 验证计划

服务端部署前建议运行：

```text
npm run prisma:validate
npm run prisma:generate
npm run format
npm run lint
npm run test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

部署后建议检查：

```text
GET /api/v1/health
GET /api/docs-json
POST /api/v1/auth/login
```

如部署环境允许，也可在预生产环境运行：

```text
npm run api:examples
```

## 风险与开放问题

- 生产部署平台尚未确认，无法写死最终启动命令、进程守护方式和日志路径。
- Neon 生产数据库是否直接使用 `main/dev` 尚未确认；若新建生产分支，需要补充连接串、migration 和 seed 验证。
- 真实 SMTP 发送需要可用收件邮箱和生产邮件配置。
- 友盟真实联调需要 Android/iOS 设备 alias；没有真实设备无法确认端到端推送到达。
- 旧后端停用需要 App 接入完成后再执行，否则可能造成客户端不可用。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [ ] 没有未解决的阻塞问题

审阅备注：

- 本阶段不新增 API 和数据模型，阻塞点集中在生产部署决策、环境变量交付方式、真实外部服务联调材料和旧服务停用时机。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-21 | 阻塞 | 创建生产就绪与切换准备计划，等待生产部署和联调信息 |

## 完成记录

已完成代码：

- 暂无。

已完成文档：

- `docs/migration-plans/phase-11-production-readiness.md`

验证结果：

- 本阶段当前只新增文档，未运行代码验证命令。

已知后续：

- 用户提供部署目标、域名端口、数据库策略、测试邮箱和真实设备 alias 后，继续执行生产配置落地和真实联调。
