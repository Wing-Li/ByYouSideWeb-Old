# Phase 8 配置、公告、反馈、版本执行计划

状态：已关闭

## 目标

迁移旧后端中的 App 配置、公告、意见反馈和版本发布能力，补齐 NestJS API、Swagger 文档、真实示例捕获、单元测试、e2e 主链路和迁移状态记录。

## 范围

范围内：

- App 启动配置查询和管理员维护。
- 公告创建、分页列表和最新公告查询。
- 当前用户提交反馈和管理员分页查看反馈。
- 管理员发布版本和公开查询最新版本。
- 复用 Phase 2 已建 Prisma model：`AppConfig`、`Announcement`、`Feedback`、`AppVersion`。

范围外：

- 文件上传、富文本资源管理。
- 多环境配置审计历史。
- 真实推送或邮件生产接入。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/controller/api/ConfigInfoController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/config/ConfigInfo.kt`
- `src/main/kotlin/com/lyl/byyouside/model/config/ConfigInfoRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/config/Config.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/AnnouncementController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/announcement/Announcement.kt`
- `src/main/kotlin/com/lyl/byyouside/model/announcement/AnnouncementRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/FeedbackController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/feedback/Feedback.kt`
- `src/main/kotlin/com/lyl/byyouside/model/feedback/FeedbackRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/api/VersionController.kt`
- `src/main/kotlin/com/lyl/byyouside/model/version/Version.kt`
- `src/main/kotlin/com/lyl/byyouside/model/version/VersionRepository.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`

旧行为摘要：

- 路由：`POST /config/create`、`GET /config/app`、`POST /announcement/add`、`GET /announcement/getAll`、`GET /announcement/getLast`、`POST /feedback/add`、`GET /feedback/get`、`POST /version/add`、`GET /version/getLast`。
- 鉴权/当前用户：配置创建和版本发布手动校验 `user.status == "admin"`；反馈提交读取 `ContextHolder.userId`；公告旧接口未显式校验管理员；反馈列表旧接口未显式校验管理员。
- 请求字段：配置使用 `appName`、`unCheckModel`；公告使用 `title`、`authorName`、`content`；反馈使用 `content`；版本使用标题、描述、Android/iOS 版本名、下载地址和 `isForce`。
- 响应结构：统一 `BaseCallBack`；列表使用旧分页结构；配置查询会把 VIP 列表挂到 `vipTypeList`。
- 校验规则：公告标题不能为空、公告内容不能为空、反馈内容不能为空；版本字段旧代码没有显式空值校验但参数不可空。
- 数据读写：配置读取最新一条或初始化一条；公告按 `createTime` 倒序分页并支持最新一条；反馈保存当前用户内容；版本按 `releaseDate` 倒序取最新。
- 外部副作用：本阶段没有邮件、推送或 IM 副作用。
- 错误码：配置不存在 `18002`；无最新版本 `17000`；公共空标题/内容和内容不存在旧码在 `20000` 段，新系统收敛到 Phase 8 范围。
- 初始化/默认数据：`ConfigInfoController.initConfig` 初始化环境、应用名和审核模式；Node seed 已创建默认 `AppConfig`。

## 有意变化

- 公告创建、反馈列表改为管理员权限，修补旧接口权限过宽问题。
- 配置使用每个环境唯一一条 `AppConfig`，管理员更新当前环境配置；公开 App 配置仍返回 VIP 套餐列表。
- 版本最新查询公开可访问；版本发布仅管理员可操作。
- 错误码按 Node 迁移规范使用 `18000-18999` 配置和 `19000-19999` 公告/反馈/版本范围。

## 新 API 设计

路由：

| 方法 | 路径 | 鉴权 | 说明 | 旧接口参考 |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/app-config/app` | 否 | 查询 App 启动配置和 VIP 套餐列表 | `GET /config/app` |
| PATCH | `/api/v1/app-config/app` | 管理员 | 创建或更新当前环境 App 配置 | `POST /config/create` |
| POST | `/api/v1/announcements` | 管理员 | 创建公告 | `POST /announcement/add` |
| GET | `/api/v1/announcements` | 否 | 分页查询公告 | `GET /announcement/getAll` |
| GET | `/api/v1/announcements/latest` | 否 | 查询最新公告 | `GET /announcement/getLast` |
| POST | `/api/v1/feedback` | 登录 | 提交意见反馈 | `POST /feedback/add` |
| GET | `/api/v1/feedback` | 管理员 | 分页查看反馈 | `GET /feedback/get` |
| POST | `/api/v1/versions` | 管理员 | 发布版本 | `POST /version/add` |
| GET | `/api/v1/versions/latest` | 否 | 查询最新版本 | `GET /version/getLast` |

响应说明：

- 所有成功响应沿用统一 `code/message/data`。
- 分页列表使用统一 `pagination`。

错误码：

- `18002`：App 还没有基本配置。
- `19001`：标题不能为空。
- `19002`：内容不能为空。
- `19003`：请求的内容不存在。
- `19004`：目前没有新版本发布。

Swagger/OpenAPI 要求：

- 每个公开接口声明旧接口映射、鉴权要求、请求 DTO、响应 DTO 和错误响应。
- 新接口加入 `npm run api:examples` 捕获。

## 数据模型设计

Prisma model 或 model 变化：

- 复用 `AppConfig`、`Announcement`、`Feedback`、`AppVersion`，无需新增 migration。

索引/约束：

- 复用已有 `AppConfig.environment` 唯一约束和时间索引。

种子数据：

- 复用 Phase 2 默认 `AppConfig` 和 VIP 套餐 seed。

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
```

手动检查：

- Swagger JSON 包含 Phase 8 路由。
- 示例捕获文件中包含 Phase 8 示例且无敏感内容。

## 风险与开放问题

- 旧公告创建接口未校验管理员，新系统收敛为管理员接口，需要 App 管理端按新权限接入。
- 反馈列表旧接口未校验管理员，新系统收敛为管理员接口。

## 审阅记录

计划审阅结果：

- [x] 旧行为已完整覆盖
- [x] API 文档计划清晰
- [x] 数据模型计划清晰
- [x] 测试计划足够
- [x] 没有未解决的阻塞问题

审阅备注：

- Phase 8 无需 Prisma schema 变更，主要风险集中在权限收敛和 Swagger 示例覆盖。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-18 | 批准实现 | 创建初始计划并完成旧代码证据审阅 |
| 2026-05-18 | 已关闭 | 完成 Phase 8 代码、Swagger 示例捕获脚本、单元测试、e2e 主链路和迁移状态更新 |

## 完成记录

已完成代码：

- `server-node/src/modules/app-config/`
- `server-node/src/modules/announcements/`
- `server-node/src/modules/feedback/`
- `server-node/src/modules/versions/`
- `server-node/src/app.module.ts`
- `server-node/scripts/capture-api-examples.ts`
- `server-node/test/app.e2e-spec.ts`

已完成文档：

- 本计划。
- `docs/NODE_MIGRATION_PLAN.md` Phase 8 完成记录。

验证结果：

- `npm run format` 通过。
- `npm run lint` 通过。
- `npm run test -- --runInBand` 通过，11 个测试套件、25 个测试通过。
- `npm run test:e2e -- --runInBand` 通过，1 个测试套件、8 个测试通过。
- `npm run build` 通过。
- `npm run api:examples` 通过，并刷新 `server-node/docs/swagger/openapi-examples.json`。

已知后续：

- Phase 9 继续补真实外部服务 provider 和生产配置。
