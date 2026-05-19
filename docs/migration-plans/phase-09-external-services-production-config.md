# Phase 9 外部服务与生产配置执行计划

状态：已关闭

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

补齐新 Node.js 后端的真实外部服务接入与生产配置基础，包括 SMTP 邮件、友盟推送、环境变量示例和日志脱敏。开发环境默认继续使用 log/mock 模式，生产环境只有在显式配置后才会调用真实外部服务。

## 范围

范围内：

- 密码重置验证码邮件的 SMTP provider。
- 好友申请、同意好友、请求位置、绑定 VIP 的友盟推送 provider。
- `.env.example` 外部服务配置项补齐。
- 邮件和推送集成单元测试。
- 迁移状态文档更新。

范围外：

- 新增公开 API。
- 支付、短信、文件上传等外部服务。
- 重新引入网易云信 IM。
- 生产真实密钥配置，真实密钥只应写入部署环境变量或本地未提交的 `.env`。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/utils/EmailUtils.kt`
- `src/main/resources/templates/EmailVerificationCode.html`
- `src/main/kotlin/com/lyl/byyouside/push/PushApi.kt`
- `src/main/kotlin/com/lyl/byyouside/push/AndroidNotificationFactory.kt`
- `src/main/kotlin/com/lyl/byyouside/push/IOSNotificationFactory.kt`
- `src/main/kotlin/com/lyl/byyouside/push/CustomMessage.kt`
- `src/main/kotlin/com/lyl/byyouside/push/DisplayType.kt`
- `server-node/src/integrations/mail/mail.service.ts`
- `server-node/src/integrations/push/push.service.ts`
- `server-node/.env.example`

旧行为摘要：

- 邮件：旧 `EmailUtils` 使用 Hutool `MailUtil` 发送邮件，SMTP host 为 `smtp.163.com`，SSL 端口 `465`，from/user/pass 硬编码在源码中；验证码邮件使用 `EmailVerificationCode.html` 模板，主题为「【伴你左右】验证码」。
- 推送：旧 `PushApi` 提供 `requestLocation`、`requestAddFriend`、`agreeAddFriend`、`bindVip` 四类业务推送。消息体包含 `fromUserId`、`fromUserNickName`、`fromUserIcon`、`type`。
- 友盟签名：旧代码把 JSON body 与 master secret 拼成 `POST{url}{body}{secret}` 后取 MD5，并请求 `https://msgapi.umeng.com/api/send?sign=...`。
- Android：旧工厂使用 Android appKey，构造 `display_type` 为 `notification` 或 `message` 的 payload，`type=customizedcast`，使用 `alias_type` 与 `alias` 定向发送；`production_mode` 由 alias 是否以 `push_prod` 开头决定。
- iOS：旧工厂使用 iOS appKey，payload 使用 `aps.alert.title/subtitle`、`badge=+1`、`custom/extra`；同样使用 `customizedcast`、alias 和 `production_mode`。
- 旧风险：SMTP 密码、友盟 appKey/masterSecret 均硬编码在源码中；新系统必须迁移到环境变量，且日志不能输出验证码、token、密码或服务密钥。

## 有意变化

- 不再硬编码 SMTP 和友盟密钥，全部从环境变量读取。
- 默认 `MAIL_MODE=log`、`PUSH_MODE=log`，避免开发和测试环境误发真实邮件/推送。
- log 模式不输出验证码明文；推送日志只输出脱敏后的 alias。
- 真实 provider 配置缺失时抛出明确配置错误，避免静默失败或半配置发送。
- 友盟发送失败时记录状态码和有限响应文本，不记录 app secret。

## 新 API 设计

本阶段不新增公开 API。

受影响的既有内部调用：

| 内部能力 | 调用方 | 说明 |
| --- | --- | --- |
| `MailService.sendPasswordResetCode` | Auth 模块 | `MAIL_MODE=smtp` 时发送真实 HTML 验证码邮件 |
| `PushService.sendRequestAddFriend` | Friends 模块 | `PUSH_MODE=umeng` 时发送好友申请推送 |
| `PushService.sendAgreeAddFriend` | Friends 模块 | `PUSH_MODE=umeng` 时发送同意好友推送 |
| `PushService.sendRequestLocation` | Devices 模块 | `PUSH_MODE=umeng` 时发送请求位置推送 |
| `PushService.sendBindVip` | VIP 模块 | `PUSH_MODE=umeng` 时发送绑定 VIP 推送 |

Swagger/OpenAPI 要求：

- 本阶段不新增路由，不需要新增 Swagger 真实示例。
- 既有 Auth/Friends/Devices/VIP 示例捕获不应依赖真实外部服务，默认 log 模式继续可运行。

## 数据模型设计

Prisma model 变化：

- 无。

索引/约束：

- 无。

种子数据：

- 无。

## 实现任务

- [x] 创建 Phase 9 计划。
- [x] 安装 SMTP provider 依赖。
- [x] 实现 SMTP 邮件 provider。
- [x] 实现友盟推送 provider。
- [x] 补齐 `.env.example`。
- [x] 补充集成单元测试。
- [x] 运行 format、lint、test、build。
- [x] 更新 `docs/NODE_MIGRATION_PLAN.md` 和计划索引。

## 验证计划

需要运行的命令：

```text
npm run format
npm run lint
npm run test -- --runInBand
npm run build
```

手动检查：

- `.env.example` 不包含真实密钥。
- 日志文本不包含验证码、SMTP 密码、友盟 master secret 或完整设备 alias。
- `MAIL_MODE=log` 和 `PUSH_MODE=log` 下不会发真实外部请求。
- `MAIL_MODE=smtp` 和 `PUSH_MODE=umeng` 缺少必要环境变量时会给出明确错误。

## 风险与开放问题

- 友盟真实发送需要生产密钥和线上设备 alias 才能端到端验证，本阶段用单元测试覆盖签名、payload 和配置校验。
- SMTP 真实发送需要部署环境提供账号授权码；仓库只提供变量名和示例占位。
- 旧 HTML 模板存在历史编码问题，新系统会用代码内 HTML 模板重建验证码邮件，保留品牌和验证码展示语义。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [x] 没有未解决的阻塞问题

审阅备注：

- Phase 9 不新增公开 API，主要验收点是外部服务安全默认值、环境变量完整性和日志脱敏。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-18 | 实现中 | 创建 Phase 9 初始计划并完成实现前自审 |
| 2026-05-18 | 已关闭 | 完成 SMTP 邮件、友盟推送、配置示例、日志脱敏、测试与迁移状态更新 |
| 2026-05-19 | 阻塞 | 按商业部署要求复查配置，已从旧项目回填 SMTP、友盟、JWT、端口和 Neon 环境；默认管理员真实邮箱与初始密码在旧项目中无来源，待用户提供 |
| 2026-05-19 | 已关闭 | 生成初始管理员配置，写入本地忽略环境文件；Neon local/main 已执行 seed 并通过管理员登录验证 |

## 完成记录

已完成代码：

- `server-node/src/integrations/mail/mail.service.ts`：支持 `MAIL_MODE=log|smtp`，SMTP 模式从环境变量读取配置并发送 HTML 验证码邮件。
- `server-node/src/integrations/push/push.service.ts`：支持 `PUSH_MODE=log|umeng`，按旧友盟签名规则发送 Android/iOS 业务推送，并在 log 模式脱敏设备别名。
- `server-node/src/modules/auth/auth.service.ts`、`server-node/src/modules/friends/friends.service.ts`、`server-node/src/modules/devices/devices.service.ts`、`server-node/src/modules/vip/vip.service.ts`：外部服务调用改为等待异步发送结果。
- `server-node/src/integrations/mail/mail.service.spec.ts`、`server-node/src/integrations/push/push.service.spec.ts`：覆盖 log 模式、真实 provider 配置、签名、payload 和缺失配置错误。

已完成文档：

- `docs/migration-plans/phase-09-external-services-production-config.md`
- `docs/migration-plans/README.md`
- `docs/NODE_MIGRATION_PLAN.md`
- `server-node/.env.example`

验证结果：

- `npm run format` 通过。
- `npm run lint` 通过。
- `npm run test -- --runInBand` 通过：13 个测试套件，31 个测试通过。
- `npm run test:e2e -- --runInBand` 通过：1 个测试套件，8 个测试通过。
- `npm run build` 通过。

已知后续：

- 真实生产密钥配置由部署环境提供，不进入仓库。
- 默认管理员配置已生成并写入本地忽略环境文件；Neon local/main 均已 seed 并验证登录。
