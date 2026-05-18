# Phase 7 VIP 模块执行计划

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

迁移旧后端 VIP 套餐、充值订单、管理员套餐维护、我的订单列表和双人会员绑定能力。新后端继续使用 NestJS、Prisma、Swagger/OpenAPI 和真实示例捕获，移除旧云信 IM 副作用，保留开发环境 mock/log 推送。

## 范围

范围内：

- VIP 套餐查询。
- 管理员创建和更新 VIP 套餐。
- 当前用户或管理员为指定用户开通 VIP。
- 当前用户查询自己的 VIP 订单。
- 管理员查询全部订单或指定用户订单。
- 双人会员绑定给其他用户，并扣减绑定名额。
- Swagger DTO、真实示例捕获、单元测试、e2e 主链路测试和迁移文档更新。

范围外：

- 真实 iOS/Android 支付验签。
- 自动续费回调。
- 真实友盟推送接入。
- 会员过期定时任务。
- 云信 IM 账号创建。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/controller/api/VipRechargeController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/Vip.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/VipRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/VipRecharge.kt`
- `src/main/kotlin/com/lyl/byyouside/model/vip/VipRechargeRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/init/InitLogic.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/filter/UserTokenInterceptor.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`

旧行为摘要：

- 路由：`POST /api/vip/addRecharge`、`POST /api/vip/bindVip`、`POST /api/vip/create`、`POST /api/vip/update`、`GET /api/vip/getRechargeAll`、`GET /api/vip/getRechargeByUserId`、`GET /api/vip/getMyRecharge`、`GET /api/vip/getType`。
- 鉴权/当前用户：VIP 路由不在旧 `SAFE_URL_LIST` 中，默认需要 Token；管理员操作通过 `UserInfo.status == "admin"` 判断。
- 请求字段：充值使用 `toUserId`、`vipId`、`money`、`from`、`bindFromUserId`；绑定使用 `toUserId`；套餐创建/更新使用 `title`、`description`、`level`、`duration`、`price`、`status`。
- 响应结构：普通成功返回 `BaseCallBack(200, "请求成功", data)`；分页返回 `data` 加分页字段。新系统继续使用统一响应拦截器的 `code/message/data/pagination`。
- 校验规则：用户不存在返回 `15001`；非管理员且金额小于 0 返回 `15002`；充值套餐不存在返回 `15003`；更新套餐不存在返回 `15004`；无绑定名额返回 `15005`；名额用完返回 `15006`；绑定给自己返回 `15007`；没有最近购买记录返回 `15008`；非管理员返回 `10013`。
- 数据读写：充值先创建 `VipRecharge`，再更新用户 `vipLevel`、`vipFrom`、`bindCount` 和 `vipLimitDate`。到期时间未过期时在原到期时间上加套餐月数，否则从当前时间加套餐月数。
- 双人绑定：从当前用户最新订单取套餐，为目标用户创建 `bind` 来源、金额 0 的订单；目标用户绑定名额重置为 0；当前用户剩余名额减 1。
- 默认数据：`InitLogic` 初始化 10 个 VIP 套餐，单人套餐 status 为 `0`，双人套餐 status 为 `2`，13 个月套餐表示包年加三天免费。
- 外部副作用：充值会创建云信 IM 账号并写入 `imAccountId`；绑定成功会发送友盟推送。

## 有意变化

- 新系统不再创建云信 IM 账号，也不保存 `imAccountId`，符合总迁移决策。
- 新 API 使用 REST 风格和标准 JWT payload，不兼容旧 Token。
- 套餐状态使用 Prisma enum `VipPlanStatus`，订单来源使用 `VipOrderSource`，不继续暴露旧数字和小写字符串作为内部状态。
- 普通用户只能为自己开通 VIP；管理员可以为指定用户开通或赠送。旧接口没有显式限制普通用户传 `toUserId`，新系统收紧为权限边界。
- 用户绑定给自己时沿用旧错误码 `15007`，但消息修正为“不能绑定给自己”，避免旧文案和实际条件不一致。
- 绑定推送仍为 mock/log，真实友盟留到 Phase 9。

## 新 API 设计

路由：

| 方法 | 路径 | 鉴权 | 说明 | 旧接口参考 |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/vip/plans` | JWT | 查询 VIP 套餐列表 | `GET /api/vip/getType` |
| POST | `/api/v1/vip/plans` | JWT + ADMIN | 创建 VIP 套餐 | `POST /api/vip/create` |
| PATCH | `/api/v1/vip/plans/:id` | JWT + ADMIN | 更新 VIP 套餐 | `POST /api/vip/update` |
| POST | `/api/v1/vip/orders` | JWT | 开通 VIP；管理员可指定目标用户和 ADMIN 来源 | `POST /api/vip/addRecharge` |
| GET | `/api/v1/vip/orders/me` | JWT | 查询我的 VIP 订单 | `GET /api/vip/getMyRecharge` |
| GET | `/api/v1/vip/orders` | JWT + ADMIN | 查询全部或指定用户 VIP 订单 | `GET /api/vip/getRechargeAll`、`GET /api/vip/getRechargeByUserId` |
| POST | `/api/v1/vip/bindings` | JWT | 使用双人会员名额给其他用户开通 VIP | `POST /api/vip/bindVip` |

响应说明：

- 套餐返回 `VipPlanDto`。
- 订单返回 `VipOrderDto`，包含套餐摘要和可选绑定来源用户。
- 开通和绑定返回更新后的 `UserProfileDto`。
- 分页接口返回统一 `pagination`。

错误码：

- `10003`：管理员权限不足。
- `17001`：目标用户不存在。
- `17002`：金额不能小于 0。
- `17003`：购买的 VIP 套餐不存在。
- `17004`：VIP 类型不存在。
- `17005`：没有可绑定的名额。
- `17006`：绑定名额已用完。
- `17007`：不能绑定给自己。
- `17008`：购买信息有误。
- `17009`：普通用户不能给他人开通 VIP。

Swagger/OpenAPI 要求：

- 每个公开路由标注旧接口映射、鉴权和管理员权限要求。
- DTO 字段提供中文说明和示例。
- 真实示例捕获覆盖套餐列表、开通 VIP、我的订单、绑定 VIP、管理员创建/更新/列表。

## 数据模型设计

Prisma model 变化：

- 复用 Phase 2 已有 `VipPlan`、`VipOrder` 和 `User` VIP 字段。
- 本阶段无需新增 migration。

索引/约束：

- 复用 `VipPlan.productCode` 唯一约束。
- 复用 `VipOrder.userId/planId/bindFromUserId` 索引。

种子数据：

- 复用 Phase 2 `seed.ts` 中的 10 个套餐。

## 实现任务

- [x] DTO 和校验。
- [x] Controller 路由。
- [x] Service 业务逻辑。
- [x] PushService 增加绑定 VIP mock/log 方法。
- [x] Prisma schema/migration 复核。
- [x] Swagger/OpenAPI 文档。
- [x] Swagger 真实示例捕获。
- [x] 单元测试。
- [x] E2E 测试。
- [x] 迁移文档更新。

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

- Swagger JSON 包含 Phase 7 新增路由。
- 绑定 VIP 后开通方名额被扣减，接收方无绑定名额。
- 普通用户不能给其他用户直接开通 VIP。
- 管理员接口需要管理员角色。

## 风险与开放问题

- 旧系统未做真实支付验签，本阶段只迁移“服务端记录并开通”的能力，后续如接入真实支付需要补充验签和回调。
- 会员过期清理在旧代码中主要由用户更新逻辑局部处理，本阶段先准确写入 `vipExpiresAt`，定时过期处理后续单独规划。
- 旧 `ERROR_15007_TEXT` 文案与“绑定给自己”的判断不匹配，新系统修正文案并记录为有意变化。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [x] 没有未解决的阻塞问题

审阅备注：

- Phase 2 schema 已覆盖 VIP 数据需求，无需新增 migration。
- 可以开始实现 Phase 7 第一版，优先保证套餐、开通、订单、绑定和管理员权限闭环。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-18 | 批准实现 | 创建 Phase 7 初始计划并完成实现前自审 |
| 2026-05-18 | 已关闭 | 完成 VIP 模块第一版迁移、真实示例捕获和验证 |

## 完成记录

已完成代码：

- `server-node/src/modules/vip/`：新增 VIP DTO、mapper、controller、service、module 和 service 单元测试。
- `server-node/src/app.module.ts`：注册 `VipModule`。
- `server-node/src/common/errors/error-codes.ts`：新增 VIP 业务错误码。
- `server-node/src/integrations/push/push.service.ts`：新增绑定 VIP mock/log 推送方法。
- `server-node/scripts/capture-api-examples.ts`：补充 VIP 套餐、开通、我的订单和绑定示例捕获。
- `server-node/test/app.e2e-spec.ts`：补充 VIP HTTP 主链路 e2e。

已完成文档：

- `docs/migration-plans/phase-07-vip.md`：创建 Phase 7 执行计划。
- `docs/NODE_MIGRATION_PLAN.md`：更新 Phase 7 状态、接口映射和下一步建议。
- `docs/migration-plans/README.md`：更新 Phase 7 计划状态。
- `server-node/docs/swagger/openapi-examples.json`：通过真实 HTTP 捕获更新 Swagger 示例。

验证结果：

- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test -- --runInBand`：通过，7 个测试套件、17 个测试。
- `npm run test:e2e -- --runInBand`：通过，1 个测试套件、7 个测试。
- `npm run build`：通过。
- `npm run api:examples`：通过，使用临时 `PORT=3001` 服务捕获示例。

已知后续：

- Phase 8 迁移配置、公告、反馈和版本。
- Phase 9 接入真实友盟推送和生产外部服务配置。
- 管理员 VIP 接口已实现并有 e2e 覆盖；真实示例捕获当前覆盖普通用户可执行的套餐、开通、我的订单和绑定接口，管理员接口后续可在示例脚本配置稳定管理员演示账号后补充捕获。
