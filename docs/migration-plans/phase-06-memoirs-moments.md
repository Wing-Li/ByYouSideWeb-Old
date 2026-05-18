# Phase 6 回忆录与瞬间模块执行计划

状态：已关闭

## 目标

迁移旧后端的回忆录和瞬间能力，在新 Node.js 后端中提供基于好友关系的内容创建、更新、删除、详情和分页列表接口，并补齐 Swagger 文档、真实示例捕获、单元测试和 e2e 测试。

## 范围

范围内：

- 回忆录创建、更新、删除、详情、分页列表。
- 瞬间创建、更新、删除、详情、分页列表。
- 仅允许当前用户在自己的已接受好友关系中创建和查看内容。
- 删除内容仅允许作者本人执行。
- 列表按发生时间倒序返回双方在双向好友关系下发布的内容。
- Swagger DTO、真实响应示例捕获、单元测试和 e2e 主链路测试。

范围外：

- 图片、视频、附件上传。
- 历史 H2 数据兼容。
- 好友删除时的内容清理，已在 Phase 4 通过好友模块完成。
- 内容审核、举报和管理后台能力。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/controller/api/MemoirsController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/memoirs/Memoirs.kt`
- `src/main/kotlin/com/lyl/byyouside/model/memoirs/MemoirsRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/MomentsController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/moment/Moments.kt`
- `src/main/kotlin/com/lyl/byyouside/model/moment/MomentsRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/model/friend/Friend.kt`
- `src/main/kotlin/com/lyl/byyouside/model/friend/FriendRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/FriendController.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`

旧行为摘要：

- 路由：回忆录使用 `POST /api/memoirs/create`、`POST /api/memoirs/update`、`POST /api/memoirs/delete`、`GET /api/memoirs/get`、`GET /api/memoirs/list`；瞬间使用同样结构的 `/api/moments/*`。
- 鉴权/当前用户：依赖 `UserTokenInterceptor` 写入的 `ContextHolder.userId`，控制器再读取当前用户。
- 请求字段：回忆录创建需要 `friendId`、`title`、`content`，可选 `date`；更新需要 `memoirsId`、`friendId`，可选 `title`、`content`、`date`。瞬间创建需要 `friendId`、`content`，可选 `date`；更新需要 `momentsId`、`friendId`，可选 `content`、`date`。
- 响应结构：普通成功通过 `successCallBack` 返回，列表通过 `successListCallBack` 返回分页信息，旧分页页码从 1 开始。
- 校验规则：旧代码主要校验当前用户有效、好友关系是否属于当前用户、内容是否存在、删除者是否作者。标题和内容没有在控制器显式校验空值，但 `StatusCode` 中存在通用标题/内容为空错误码。
- 数据读写：创建时写入 `Memoirs` 或 `Moments`，保存 `friendId`、作者用户、内容字段和发生时间；更新时只覆盖传入字段；删除时按 ID 删除。
- 外部副作用：回忆录和瞬间本身没有邮件或推送副作用。
- 错误码：回忆录不存在 `20000`、回忆录非本人删除 `20001`；瞬间不存在 `21000`、瞬间非本人删除 `21001`；好友关系异常使用旧 `ERROR_16010`，列表中双向关系缺失会抛出 `ERROR_16007_TEXT` 或 `ERROR_16008_TEXT`。
- 删除耦合：旧 `FriendController.delete` 会通过双向 friendId 删除相关回忆录和瞬间；新 Phase 4 已在好友删除中清理 `memoir` 和 `moment`。

## 有意变化

- 新 API 使用 `/api/v1/memoirs` 和 `/api/v1/moments` REST 风格，不保留旧路径。
- 新系统继续使用 Phase 4 的双向 `FriendRelation` 模型，创建内容时必须使用当前用户拥有的已接受关系 ID。
- 详情接口会要求当前用户处于该内容所属双方好友关系中；旧详情接口只按 ID 查询，未显式限制。新行为用于避免内容越权访问。
- 更新接口要求作者本人执行；旧代码只验证传入的 `friendId` 属于当前用户，没有显式校验作者。新行为用于避免一方通过自己的关系 ID 修改对方内容。
- 错误码按新规范映射到 `15000-15999` 回忆录和 `16000-16999` 瞬间范围，不沿用旧 `20000/21000`。
- `date` 字段在新 API 中命名为 `happenedAt`，与 Prisma schema 保持一致。

## 新 API 设计

路由：

| 方法 | 路径 | 鉴权 | 说明 | 旧接口参考 |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/memoirs` | JWT | 创建回忆录 | `POST /api/memoirs/create` |
| PATCH | `/api/v1/memoirs/:id` | JWT + 作者 | 更新回忆录 | `POST /api/memoirs/update` |
| DELETE | `/api/v1/memoirs/:id` | JWT + 作者 | 删除回忆录 | `POST /api/memoirs/delete` |
| GET | `/api/v1/memoirs/:id` | JWT + 好友关系成员 | 查询回忆录详情 | `GET /api/memoirs/get` |
| GET | `/api/v1/memoirs` | JWT | 查询指定好友关系下双方回忆录 | `GET /api/memoirs/list` |
| POST | `/api/v1/moments` | JWT | 创建瞬间 | `POST /api/moments/create` |
| PATCH | `/api/v1/moments/:id` | JWT + 作者 | 更新瞬间 | `POST /api/moments/update` |
| DELETE | `/api/v1/moments/:id` | JWT + 作者 | 删除瞬间 | `POST /api/moments/delete` |
| GET | `/api/v1/moments/:id` | JWT + 好友关系成员 | 查询瞬间详情 | `GET /api/moments/get` |
| GET | `/api/v1/moments` | JWT | 查询指定好友关系下双方瞬间 | `GET /api/moments/list` |

响应说明：

- ID、BigInt 和 Decimal 类型继续用字符串承载。
- 列表使用统一分页响应，按 `happenedAt` 倒序、`createdAt` 倒序稳定排序。
- 删除成功返回 `删除成功`。

错误码：

- `15001`：回忆录不存在。
- `15002`：此回忆不是您写的，无法修改。
- `15003`：此回忆不是您写的，无法删除。
- `15004`：只能查看好友关系内的回忆。
- `16011`：瞬间不存在。
- `16012`：此瞬间不是您写的，无法修改。
- `16013`：此瞬间不是您写的，无法删除。
- `16014`：只能查看好友关系内的瞬间。
- 复用好友错误码 `16008` 表示好友关系不存在，复用 `1610` 表示伴友关系异常。

Swagger/OpenAPI 要求：

- 所有接口声明 JWT 鉴权、请求 DTO、响应 DTO、分页响应和主要错误响应。
- 所有新增公开接口纳入 `npm run api:examples` 捕获。

## 数据模型设计

Prisma model 或 model 变化：

- 复用 Phase 2 已有 `Memoir` 与 `Moment`。

索引/约束：

- 复用 `friendRelationId + happenedAt` 与 `authorId + createdAt` 索引。

种子数据：

- 不需要新增 seed。

## 实现任务

- [x] DTO 和校验
- [x] Controller 路由
- [x] Service 业务逻辑
- [x] Prisma schema/migration
- [x] Seed 更新
- [x] 鉴权/角色 Guard
- [x] Swagger/OpenAPI 文档
- [x] Swagger 真实示例捕获
- [x] 单元测试
- [x] E2E 测试
- [x] 迁移文档更新

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

- Swagger JSON 包含 Phase 6 新增路由。
- 非好友或非关系成员无法查看详情和列表。
- 非作者无法更新或删除回忆录/瞬间。
- 好友删除后内容清理仍由 Phase 4 测试覆盖。

## 风险与开放问题

- 旧详情接口没有权限校验，新详情接口收紧访问边界，需要在 Swagger 和总迁移文档中明确。
- 旧更新接口未显式校验作者，新接口收紧为作者本人可更新，属于内容安全修正。
- Prisma schema 已有表结构，本阶段预计无需 migration。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [x] 没有未解决的阻塞问题

审阅备注：

- 已确认 Phase 2 schema 覆盖本阶段数据需求，无需新增 migration。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-18 | 批准实现 | 创建 Phase 6 初始计划并完成实现前自审 |
| 2026-05-18 | 已关闭 | 完成 Memoirs/Moments 代码、文档、示例捕获和验证 |

## 完成记录

已完成代码：

- `server-node/src/modules/memoirs/`：新增回忆录 controller、service、DTO、mapper 和 module。
- `server-node/src/modules/moments/`：新增瞬间 controller、service、DTO、mapper 和 module。
- `server-node/src/common/errors/error-codes.ts`：新增回忆录与瞬间业务错误码。
- `server-node/src/app.module.ts`：注册 `MemoirsModule` 和 `MomentsModule`。
- `server-node/scripts/capture-api-examples.ts`：纳入 Memoirs/Moments 接口真实示例捕获。
- `server-node/test/app.e2e-spec.ts`：补充回忆录与瞬间 e2e 主链路测试，并扩展内存 Prisma 假实现。
- `server-node/src/modules/memoirs/memoirs.service.spec.ts`：补充回忆录单元测试。
- `server-node/src/modules/moments/moments.service.spec.ts`：补充瞬间单元测试。

已完成文档：

- `docs/migration-plans/phase-06-memoirs-moments.md`
- `docs/NODE_MIGRATION_PLAN.md`

验证结果：

- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test -- --runInBand`：通过。
- `npm run test:e2e -- --runInBand`：通过。
- `npm run build`：通过。
- `npm run api:examples`：通过，使用 `API_BASE_URL=http://localhost:3001` 指向临时本地服务生成真实示例。

已知后续：

- Phase 7 继续迁移 VIP 模块。
