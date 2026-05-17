# Phase 5 设备与位置模块执行计划

状态：已关闭

## 目标

迁移旧后端的设备状态上报、设备历史查询、最新设备状态查询和请求位置推送能力，并在新 Node.js 后端中补齐更清晰的隐私权限边界、Swagger 文档、真实示例捕获和测试。

## 范围

范围内：

- 当前用户上报设备状态和位置快照。
- 查询当前用户设备快照历史。
- 查询当前用户最新设备快照。
- 查询指定好友用户的设备快照历史和最新设备快照。
- 向指定好友发送请求位置推送。
- 同步用户表中的最近位置字段。
- Swagger DTO、真实示例捕获、单元测试、e2e 主链路测试。

范围外：

- 真实友盟生产推送接入，继续使用现有 mock/log `PushService`。
- 历史 H2 数据兼容。
- 文件、图片、媒体上传。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/controller/api/DeviceInfoController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/device/DeviceInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/model/device/DeviceInfoRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/UserController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/model/user/UserInfoRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/filter/UserTokenInterceptor.kt`
- `src/main/kotlin/com/lyl/byyouside/config/ContextHolder.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/push/PushApi.kt`

旧行为摘要：

- 路由：`POST /api/device/add` 上报设备信息；`GET /api/device/myInfoList` 查询自己的历史；`GET /api/device/getByUserId` 查询指定用户历史；`GET /api/device/getMyLast` 查询自己的最新设备；`GET /api/device/getLastByUserId` 查询指定用户最新设备；`POST /api/user/requestLocation` 请求对方位置推送。
- 鉴权/当前用户：除安全白名单外由 `UserTokenInterceptor` 读取 `Authorization`，验证旧 token 后写入 `ContextHolder.userId`。
- 请求字段：设备上报字段包括 `deviceName`、`screenStatus`、`screenLevel`、`batteryStatus`、`batteryLevel`、`volumeLevel`、`bluetoothStatus`、`bluetoothName`、`wifiStatus`、`wifiName`、`gpsStatus`、`locationFrom`、`locationAddress`、`locationLongitude`、`locationLatitude`。
- 响应结构：旧版使用 `BaseCallBack`；列表由 `successListCallBack` 返回分页字段，页码从 1 开始。
- 校验规则：旧设备上报字段基本可空，传了才覆盖快照字段；用户不存在返回 `ERROR_15001`；没有最新设备返回 `ERROR_19000`。
- 数据读写：上报时新增 `DeviceInfo`；同时把 `locationAddress`、`locationLongitude`、`locationLatitude` 和 `locationTime` 同步到 `UserInfo`。
- 外部副作用：`POST /api/user/requestLocation` 检查对方 `deviceType` 和 `deviceAlias`，缺失时返回 `ERROR_10014`，存在时调用 `PushApi.sendRequestLocation`。
- 错误码：设备/位置相关旧错误包括 `10014` 未获取到对方设备信息、`15001` 用户不存在、`19000` 该用户还没有上传过信息。

## 有意变化

- 新 API 使用 `/api/v1/devices/*` REST 风格，不保留旧路径。
- 指定用户设备查询和请求位置只允许对已接受好友关系的对方执行；旧接口未显式校验好友关系，新系统出于位置隐私补齐权限边界。
- 旧字段 `locationFrom` 在新 Prisma 中命名为 `locationSource`，API 请求也使用 `locationSource`。
- 友盟真实推送仍延后到 Phase 9；本阶段只记录 mock/log 推送。

## 新 API 设计

| 方法 | 路径 | 鉴权 | 说明 | 旧接口参考 |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/devices/snapshots` | JWT | 上报当前用户设备状态和位置快照 | `POST /api/device/add` |
| GET | `/api/v1/devices/me/snapshots` | JWT | 查询当前用户设备快照历史 | `GET /api/device/myInfoList` |
| GET | `/api/v1/devices/me/snapshots/latest` | JWT | 查询当前用户最新设备快照 | `GET /api/device/getMyLast` |
| GET | `/api/v1/devices/users/:userId/snapshots` | JWT + 好友关系 | 查询指定好友设备快照历史 | `GET /api/device/getByUserId` |
| GET | `/api/v1/devices/users/:userId/snapshots/latest` | JWT + 好友关系 | 查询指定好友最新设备快照 | `GET /api/device/getLastByUserId` |
| POST | `/api/v1/devices/users/:userId/location-request` | JWT + 好友关系 | 请求指定好友上报位置 | `POST /api/user/requestLocation` |

响应说明：

- 快照使用字符串承载 BigInt 和 Decimal，避免前端精度丢失。
- 列表使用统一分页响应。
- 请求位置成功返回旧文案等价结果：`通知发送成功`。

错误码：

- `14001`：用户不存在。
- `14002`：该用户还没有上传过信息。
- `14003`：未获取到对方的设备信息，无法实时通知对方。
- `14004`：只能查看好友的设备信息。

Swagger/OpenAPI 要求：

- 每个公开接口声明认证、请求 DTO、查询参数、响应 DTO、错误响应。
- 将所有新增接口纳入 `npm run api:examples` 捕获。

## 数据模型设计

Prisma model 变化：

- 复用已有 `DeviceSnapshot`。
- 复用已有 `User.lastLocationAddress`、`lastLocationLongitude`、`lastLocationLatitude`、`lastLocationAt`。

索引/约束：

- 复用 `DeviceSnapshot.userId + createdAt` 索引。

种子数据：

- 不需要新增 seed。

## 实现任务

- [x] DTO 和校验
- [x] Controller 路由
- [x] Service 业务逻辑
- [x] PushService 增加请求位置 mock/log 方法
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

- Swagger JSON 包含 Phase 5 新增路由。
- 最新设备为空时返回明确业务错误。
- 非好友无法查询对方设备和请求位置。

## 风险与开放问题

- 旧接口允许按任意 `userId` 查询设备历史；新接口收紧为好友关系权限，这是有意的隐私保护变化，需在文档中明确。
- 真实友盟推送配置仍留到 Phase 9。

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
| 2026-05-17 | 批准实现 | 创建 Phase 5 初始计划并完成实现前审阅 |
| 2026-05-17 | 已关闭 | 完成 Devices 模块第一版迁移、真实示例捕获和验证 |

## 完成记录

已完成代码：

- `server-node/src/modules/devices/`：新增设备与位置 controller、service、DTO、mapper 和 module。
- `server-node/src/integrations/push/push.service.ts`：新增请求位置 mock/log 推送方法。
- `server-node/src/common/errors/error-codes.ts`：新增设备与位置业务错误码。
- `server-node/src/app.module.ts`：注册 `DevicesModule`。
- `server-node/scripts/capture-api-examples.ts`：纳入 Devices 接口真实示例捕获。
- `server-node/test/app.e2e-spec.ts`：补充设备上报、最新状态、好友查询和请求位置主链路。
- `server-node/src/modules/devices/devices.service.spec.ts`：补充设备服务单元测试。

已完成文档：

- `docs/NODE_MIGRATION_PLAN.md`：更新 Phase 5 状态、接口映射和下一步建议。
- `docs/migration-plans/phase-05-devices-location.md`：记录旧代码证据、隐私权限变化、API 设计、任务进度和验证结果。

验证结果：

- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test -- --runInBand`：通过。
- `npm run test:e2e -- --runInBand`：通过。
- `npm run build`：通过。
- `npm run api:examples`：通过；因本机 3000 端口已有旧 dist 服务，本次使用 `API_BASE_URL=http://localhost:3001` 指向临时新服务生成示例。

已知后续：

- Phase 9 接入真实友盟推送。
