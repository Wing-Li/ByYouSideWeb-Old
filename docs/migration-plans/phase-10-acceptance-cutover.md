# Phase 10 验收与切换执行计划

状态：已验证

## 目标

对已迁移的 Node.js 后端做全量验收准备，确认 Swagger/OpenAPI 文档、真实示例、测试、构建、环境变量说明和迁移记录一致，为 App 接入与后续生产切换提供可执行依据。

## 范围

范围内：

- 全量 Swagger/OpenAPI 路由与真实示例覆盖复查。
- 运行格式化、lint、单元测试、e2e 测试、构建和 API 示例捕获。
- 梳理 App 接入新 API 的主要差异与手动验收脚本。
- 更新迁移总文档和计划索引。

范围外：

- 新增业务接口或重做既有 API 设计。
- 真实生产发布、域名切换、进程管理和服务器部署。
- 真实 SMTP/友盟在线端到端联调；该项需要线上密钥、网络环境和真实设备 alias。
- App 客户端代码改造。

## 旧代码证据

已阅读文件：

- `docs/NODE_MIGRATION_PLAN.md`
- `docs/migration-plans/README.md`
- `server-node/package.json`
- `server-node/scripts/capture-api-examples.ts`
- `server-node/src/setup-swagger.ts`
- `server-node/src/modules/*/*.controller.ts`
- Phase 1-9 执行计划中记录的旧 Kotlin/Spring Boot 控制器、实体、仓库、初始化逻辑和外部集成证据。

旧行为摘要：

- Phase 1-9 已分别完成旧行为阅读和迁移记录，本阶段不新增业务行为。
- 旧系统主要公开能力已经映射到新 REST API：认证/用户、好友、设备与位置、回忆录、瞬间、VIP、配置、公告、反馈和版本。
- 新系统保留统一响应外壳、邮件验证码、友盟推送、VIP 套餐初始化等必要行为。
- 新系统有意移除网易云信 IM、不兼容旧 Token、不迁移旧 H2 数据，并收紧若干旧接口权限边界。

## 有意变化

- 本阶段只做验收与文档收口，不改变业务逻辑。
- 如发现文档索引与已完成状态不一致，优先修正文档记录。
- 真实外部服务最终联调保留为生产切换前人工验收项，不在本地自动测试中触发真实发送。

## 新 API 设计

本阶段不新增 API。

验收的公开 API 范围：

- 健康检查：`GET /api/v1/health`
- 认证：注册、登录、密码重置验证码、密码重置确认。
- 用户：当前用户、资料更新、申请注销、取消注销。
- 好友：申请、同意、拒绝、删除、拉黑、备注、列表、请求列表、绑定亲密好友。
- 设备与位置：设备快照上报、本人/好友历史和最新快照、请求位置。
- 回忆录与瞬间：创建、更新、删除、详情、列表。
- VIP：套餐、开通、订单、绑定。
- App 配置、公告、反馈、版本。

Swagger/OpenAPI 要求：

- 每个 Controller 路由都出现在 Swagger 文档中。
- 公开 API 成功示例应由 `npm run api:examples` 捕获并注入 `openapi-examples.json`。
- 示例文件不得包含原始 JWT、验证码、数据库 URL、SMTP 密钥、友盟密钥或生产凭据。

## 数据模型设计

Prisma model 或 model 变化：

- 无。

索引/约束：

- 无。

种子数据：

- 复用 Phase 2 seed：默认管理员、App 配置和 VIP 套餐。

## 实现任务

- [x] 创建 Phase 10 验收计划。
- [x] 复查 Swagger 示例覆盖。
- [x] 修正文档索引中与实际状态不一致的记录。
- [x] 运行 format、lint、unit test、e2e test、build。
- [x] 运行 api:examples 并确认示例安全。
- [x] 更新 `docs/NODE_MIGRATION_PLAN.md`。
- [x] 更新本计划完成记录。

## 验证计划

需要运行的命令：

```text
npm run format
npm run lint
npm run test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run api:examples
```

手动检查：

- `server-node/docs/swagger/openapi-examples.json` 没有原始 token、验证码和服务密钥。
- `docs/migration-plans/README.md` 中 Phase 状态与各计划文件一致。
- `docs/NODE_MIGRATION_PLAN.md` 记录 Phase 10 的实际验收结果和仍需人工完成的切换事项。

## 风险与开放问题

- 真实 SMTP/友盟推送需要在部署环境和真实设备上最终联调，本地默认 log 模式不会触发真实发送。
- App 客户端接入需要按新 API 文档改造并做人工验收，本仓库当前只完成服务端验收准备。
- 生产切换还需要确认部署方式、域名、进程守护、日志采集和备份策略。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [x] 没有未解决的阻塞问题

审阅备注：

- Phase 10 是验收收口阶段，不新增数据模型或业务路由；主要风险在文档、示例和实际代码状态不一致。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-20 | 实现中 | 创建 Phase 10 验收计划，准备执行全量检查 |
| 2026-05-20 | 已验证 | 完成后端全量检查、Swagger 示例补齐、安全扫描和迁移文档更新 |

## 完成记录

已完成代码：

- `server-node/scripts/capture-api-examples.ts`：补齐健康检查、密码重置确认、好友拒绝、VIP 套餐创建/更新和管理员订单列表的真实 HTTP 示例捕获；验证码通过临时 hash 记录预置并由真实确认接口消费，示例文件只写入脱敏占位。

已完成文档：

- `docs/migration-plans/phase-10-acceptance-cutover.md`
- `docs/migration-plans/README.md`
- `docs/NODE_MIGRATION_PLAN.md`

验证结果：

- `npm run format` 通过。
- `npm run lint` 通过。
- `npm run test -- --runInBand` 通过：13 个测试套件，31 个测试通过。
- `npm run test:e2e -- --runInBand` 通过：1 个测试套件，8 个测试通过。
- `npm run build` 通过。
- `npm run api:examples` 通过，并刷新 `server-node/docs/swagger/openapi-examples.json`。
- Swagger JSON 对照结果：50 条路由、50 条示例，缺失 0，额外 0。
- 示例安全扫描结果：未发现原始 JWT、验证码、数据库连接串、SMTP 密钥、友盟密钥或演示密码。

已知后续：

- App 客户端仍需按 Swagger 文档完成新 API 接入与人工验收。
- 生产切换仍需确认部署方式、域名、进程守护、日志采集和备份策略。
- 真实 SMTP/友盟推送仍需在部署环境和真实设备 alias 下做最终联调。
