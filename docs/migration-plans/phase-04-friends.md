# Phase 04 好友关系模块执行计划

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

迁移 ByYouSide 好友关系模块，覆盖好友申请、互相同意、拒绝、删除、拉黑、备注、列表查询和亲密好友绑定。新后端继续使用 NestJS、Prisma 和 Swagger/OpenAPI，保留旧业务语义中 App 依赖的好友状态流转，但接口命名改为 REST 风格。

## Scope

In scope:

- 好友申请、同意、拒绝、删除。
- 拉黑与取消拉黑。
- 修改好友备注。
- 查询我的好友和请求我的好友。
- 绑定当前用户的唯一亲密好友。
- 好友 DTO、Swagger 文档、单元测试、e2e 测试和真实 Swagger 示例捕获。

Out of scope:

- 设备与位置推送完整迁移。
- 回忆录、瞬间的创建和查询接口。
- VIP 绑定名额相关逻辑。
- 真实友盟推送生产配置。

## Legacy Evidence

Files read:

- `src/main/kotlin/com/lyl/byyouside/controller/api/FriendController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/friend/Friend.kt`
- `src/main/kotlin/com/lyl/byyouside/model/friend/FriendRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/memoirs/MemoirsRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/moment/MomentsRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/push/PushApi.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `.codex/skills/byyouside-node-migration/references/legacy-reading-checklist.md`
- `.codex/skills/byyouside-node-migration/references/node-project-standards.md`
- `.codex/skills/byyouside-node-migration/references/api-documentation-standard.md`

Legacy behavior summary:

- Routes:
  - `POST /api/friend/request`
  - `POST /api/friend/agreeRequest`
  - `POST /api/friend/rejectRequest`
  - `POST /api/friend/delete`
  - `POST /api/friend/block`
  - `POST /api/friend/update`
  - `POST /api/friend/getMyFriend`
  - `POST /api/friend/getRequestMeFriend`
  - `POST /api/friend/bindBestFriend`
- Auth/current user:
  - 全部依赖旧 `UserTokenInterceptor` 写入的 `ContextHolder.userId`。
  - 新系统映射为 `JwtAuthGuard` 和 `CurrentUser`。
- Request fields:
  - 请求好友：`toId`。
  - 同意请求：`friendId`。
  - 拒绝请求：`friendId`、`isPermanentRefusal`。
  - 删除好友：`friendId`。
  - 拉黑好友：`friendId`、`isBlock`。
  - 修改备注：`friendId`、`friendAlias`。
  - 列表：`status`、`page`、`size`。
  - 绑定亲密好友：`friendId`。
- Response shape:
  - 旧系统返回 `BaseCallBack(code, message, data)`；分页旧响应在顶层追加 `totalPages/currentPage/totalElements/size/isListLast`。
  - 新系统继续由全局响应拦截器返回 `{ code, message, data }`，分页统一使用 `pagination`。
- Validation:
  - 不能重复请求已存在的 `PENDING` 关系。
  - 已是好友不能重复申请或同意。
  - 对方永久拒绝后不能再次申请。
  - 同意、拒绝、删除、拉黑、备注都必须操作当前用户有权操作的关系记录。
  - 备注不能为空且长度不能超过 8。
- Data reads/writes:
  - 旧系统用双向记录表达好友关系。
  - 当 A 请求 B 时创建 `A -> B` 的 `PENDING` 记录。
  - 如果 B 已请求 A，则把 `B -> A` 改为 `ACCEPTED`，并创建 `A -> B` 的 `ACCEPTED` 记录。
  - 同意请求时把对方发来的 `PENDING` 记录改为 `ACCEPTED`，再创建当前用户指向对方的 `ACCEPTED` 记录。
  - 拒绝请求将请求记录改为 `REJECTED` 或 `REJECTED_BLOCKED`。
  - 删除好友会删除双方记录，并按双方关系 ID 删除回忆录和瞬间。
  - 拉黑会把自己的记录改为“我拉黑对方”，把对方记录改为“对方拉黑我”。
  - 绑定亲密好友会先取消当前用户已有的亲密好友，再设置新的亲密好友。
- External side effects:
  - 请求好友会向被请求者发送 `requestAddFriend` 友盟推送。
  - 同意好友会向请求者发送 `agreeAddFriend` 友盟推送。
  - 新系统本阶段只接入 mock/log push provider，不发送真实推送。
- Error codes:
  - `16001` 用户信息异常，请重新登陆。
  - `16003` 你们已经是密友关系，无法重复操作。
  - `16005` 已经请求过了。
  - `16006` 对方永久拒绝您的请求。
  - `16007` 账户信息出错，请重新登录账号。
  - `16008` 好友关系不存在。
  - `16009` 你们已经是好友，无法重复操作。
  - `1610` 伴友关系异常，请重新登录后再次尝试。
  - `10003` 昵称为 1-8 个字。
- Initialization/default data:
  - 好友模块无 seed 数据。

## Intentional Changes

- 新接口使用 REST 风格和 `/api/v1` 版本前缀，旧字段名映射为更清晰的 DTO 字段名。
- 新系统继续沿用 Prisma schema 中的双向 `FriendRelation` 记录，降低对后续回忆录、瞬间和 App 列表逻辑的迁移风险。
- 推送改为抽象 `PushService`，默认 mock/log，生产真实友盟接入留到 Phase 9。
- 分页响应改为统一 `pagination` 对象。

## New API Design

Routes:

| Method | Path | Auth | Description | Old reference |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/friends/requests` | 是 | 请求添加好友 | `POST /api/friend/request` |
| POST | `/api/v1/friends/requests/:id/accept` | 是 | 同意好友请求 | `POST /api/friend/agreeRequest` |
| POST | `/api/v1/friends/requests/:id/reject` | 是 | 拒绝好友请求 | `POST /api/friend/rejectRequest` |
| DELETE | `/api/v1/friends/:id` | 是 | 删除好友关系并清理双方内容 | `POST /api/friend/delete` |
| PATCH | `/api/v1/friends/:id/block` | 是 | 拉黑或取消拉黑好友 | `POST /api/friend/block` |
| PATCH | `/api/v1/friends/:id/alias` | 是 | 修改好友备注 | `POST /api/friend/update` |
| GET | `/api/v1/friends` | 是 | 查询我的好友 | `POST /api/friend/getMyFriend` |
| GET | `/api/v1/friends/requests/incoming` | 是 | 查询请求我的好友 | `POST /api/friend/getRequestMeFriend` |
| POST | `/api/v1/friends/:id/best` | 是 | 绑定亲密好友 | `POST /api/friend/bindBestFriend` |

Response notes:

- 好友关系 ID 以字符串返回，避免 BigInt JSON 序列化问题。
- 列表返回 `data` 数组和 `pagination`。
- 删除、拉黑等旧接口的提示文案可以保留为字符串响应。

Error codes:

- Friends 模块沿用旧 `160xx` 语义，并在新错误常量中集中维护。

Swagger/OpenAPI requirements:

- 所有接口标注 Bearer auth。
- 每个 DTO 字段提供说明和示例。
- 错误响应描述列出关键业务错误码。
- `npm run api:examples` 增加好友主链路的真实请求捕获，并脱敏 token。

## Data Model Design

Prisma models or model changes:

- 复用 Phase 2 `FriendRelation`、`Memoir`、`Moment`。
- 不新增 schema 字段。

Indexes/constraints:

- 复用 `@@unique([requesterId, receiverId])`。
- 复用 `requesterId/status/updatedAt` 和 `receiverId/status/updatedAt` 索引。

Seed data:

- 无。

## 实现任务

- [x] DTO 和校验
- [x] Controller 路由
- [x] Service 业务逻辑
- [x] Push provider mock/log 抽象
- [x] Swagger/OpenAPI 文档
- [x] Swagger 真实示例捕获
- [x] 单元测试
- [x] E2E 测试
- [x] 迁移文档更新

## Verification Plan

Commands to run:

```text
npm run format
npm run lint
npm run test
npm run test:e2e
npm run build
npm run api:examples
```

Manual checks:

- Swagger JSON 包含好友模块所有新接口。
- A 请求 B、B 同意、双方列表均可看到 `ACCEPTED` 关系。
- 删除好友后双方关系和关联内容被清理。
- 备注长度、重复请求、权限错误都有稳定业务错误。

## Risks And Open Questions

- 旧错误码 `ERROR_16010` 实际数值为 `1610`，本阶段保留旧数值以避免语义漂移，但在文档中说明。
- 旧系统拉黑时如果 `friendId` 不存在会静默成功；新系统将返回好友关系不存在，避免前端误判。
- 好友申请推送需要 Phase 9 再接入真实友盟密钥，本阶段只记录 mock/log。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [x] 没有未解决的阻塞问题

审阅备注：

- 可以开始实现 Phase 4，优先保障好友请求、同意、列表、删除和权限校验闭环。

## Progress Log

| Date | Status | Notes |
| --- | --- | --- |
| 2026-05-17 | 批准实现 | 阅读迁移总计划、旧好友 Controller/Entity/Repository、内容仓库、推送和错误码后创建计划 |
| 2026-05-17 | 实现中 | 实现好友 DTO、Controller、Service、mock/log PushService 和 AppModule 接入 |
| 2026-05-17 | 已验证 | format、lint、unit test、e2e test、build 和 api:examples 均通过 |

## Completion Record

Completed code:

- `server-node/src/modules/friends/`
- `server-node/src/integrations/push/`
- `server-node/src/common/errors/error-codes.ts`
- `server-node/src/app.module.ts`
- `server-node/scripts/capture-api-examples.ts`
- `server-node/test/app.e2e-spec.ts`

Completed docs:

- 本计划。
- `docs/NODE_MIGRATION_PLAN.md`
- `server-node/docs/swagger/openapi-examples.json`

Verification results:

- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test -- --runInBand`：通过，3 个测试套件、6 个测试通过。
- `npm run test:e2e -- --runInBand`：通过，1 个测试套件、4 个测试通过。
- `npm run build`：通过。
- `npm run api:examples`：通过，已捕获好友模块真实 Swagger 示例并通过敏感内容检查。

Known follow-ups:

- Phase 9 接入真实友盟 push provider。
