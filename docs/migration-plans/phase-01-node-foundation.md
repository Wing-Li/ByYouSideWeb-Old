# Phase 01 Node 基础骨架执行计划

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

为 ByYouSide 迁移创建新的 `server-node/` 后端基础骨架。本阶段不迁移具体业务模块，只建立 NestJS/TypeScript 项目、全局 API 前缀、统一响应、异常处理、参数校验、Swagger/OpenAPI、配置基础、健康检查和基础测试。

## 范围

范围内：

- 创建 `server-node/`。
- 初始化 NestJS + TypeScript 应用。
- 使用 npm 作为包管理器，因为本机已存在 npm `11.9.0`。
- 使用本机 Node `v24.14.0`。
- 配置 Swagger/OpenAPI。
- 配置全局参数校验。
- 配置符合迁移规范的统一响应外壳。
- 配置全局异常过滤器。
- 添加健康检查接口。
- 添加基础 unit/e2e 验证。
- 添加 `server-node/README.md`。
- 更新迁移状态文档。

范围外：

- Prisma schema 和 PostgreSQL 连接。
- auth/users/friends/devices/VIP 等业务模块。
- JWT 实现。
- 邮件和推送集成。
- 从旧 H2 数据迁移。
- 兼容旧 JWT。
- 网易云信 IM 集成。

## 旧代码证据

已阅读文件：

- `src/main/kotlin/com/lyl/byyouside/ByYouSideApplication.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/filter/UserTokenInterceptor.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/exception/ExceptionController.kt`
- `src/main/kotlin/com/lyl/byyouside/config/ContextHolder.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/init/InitLogic.kt`
- `.codex/skills/byyouside-node-migration/references/node-project-standards.md`
- `.codex/skills/byyouside-node-migration/references/api-documentation-standard.md`

旧行为摘要：

- 路由：旧 API Controller 继承 `@RequestMapping("/api")`；新后端应保留 API 前缀，但内部使用 REST 风格路由。
- 鉴权/当前用户：旧系统使用 `UserTokenInterceptor` 和 `ContextHolder.userId`；Phase 1 只为未来 Guard 建立结构，不实现鉴权逻辑。
- 请求字段：旧日期绑定支持 `yyyy-MM-dd HH:mm:ss.SSS`；Phase 1 只启用全局 validation/transform。
- 响应结构：旧成功响应是 `BaseCallBack(code=200,message="请求成功",data=...)`；旧列表响应追加分页字段。新标准保留 `{ code, message, data }`，新 API 分页使用嵌套 `pagination` 对象。
- 参数校验：旧代码多数在 Controller 中手动校验；新基础设施使用 Nest `ValidationPipe`。
- 数据读写：Phase 1 无数据读写。
- 外部副作用：Phase 1 无外部副作用。
- 错误码：旧全局异常返回 HTTP 500 code 和异常 message；新基础设施将异常统一包装为响应外壳。
- 初始化/默认数据：旧 `InitLogic` 初始化 VIP 和配置。新 seed 逻辑推迟到 Prisma 阶段。

## 有意变化

- 新 API 文档从一开始使用 Swagger/OpenAPI。
- 新 API 分页响应使用 `pagination`，不再使用顶层 `totalPages/currentPage/totalElements/size/isListLast`。
- 新异常处理会将 Nest/HTTP/validation 错误统一转换为 `{ code, message, data: null }`。
- 新项目不包含任何网易云信 IM 代码。

原因：

- 用户已确认新 API 可以统一设计，前提是 API 文档准确。
- 迁移方案选择长期可维护的 Node/NestJS 架构，而不是逐行兼容旧代码。

## 新 API 设计

路由：

| 方法 | 路径 | 鉴权 | 说明 | 旧接口参考 |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | 否 | 新 Node 服务健康检查 | 无 |
| GET | `/api/docs` | 否 | Swagger UI | 无 |
| GET | `/api/docs-json` | 否 | Swagger 生成的 OpenAPI JSON | 无 |

响应说明：

健康检查成功：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "ok",
    "service": "byyouside-api"
  }
}
```

错误码：

- `10000`：通用内部服务错误。
- `10001`：请求参数校验错误。
- `10004`：资源不存在。

Swagger/OpenAPI 要求：

- Swagger 标题：`ByYouSide API`。
- 包含全局 bearer auth scheme，供未来接口使用。
- 文档化健康检查接口。
- Swagger 输出必须与运行时 DTO 响应一致。

## 数据模型设计

Prisma model 或 model 变化：

- Phase 1 无。

索引/约束：

- Phase 1 无。

种子数据：

- Phase 1 无。

## 实现任务

- [x] 创建 `server-node/` NestJS 项目。
- [x] 配置 TypeScript strict 和基础脚本。
- [x] 添加全局 API 前缀 `/api`。
- [x] 添加全局 validation pipe。
- [x] 添加统一响应 interceptor。
- [x] 添加异常 filter。
- [x] 添加通用响应/错误 DTO。
- [x] 添加 health module/controller。
- [x] 配置 Swagger/OpenAPI。
- [x] 添加 `.env.example`。
- [x] 添加 `server-node/README.md`。
- [x] 添加 health 和统一响应的 unit/e2e 测试。
- [x] 运行 formatter/linter/typecheck/tests。
- [x] 更新迁移文档状态。

## 验证计划

需要运行的命令：

```text
npm install
npm run format
npm run lint
npm run test
npm run test:e2e
npm run build
```

手动检查：

- 启动应用并访问 `/api/health`。
- 访问 `/api/docs`。
- 确认未提交密钥。
- 确认没有提前把业务模块标记为完成。

## 风险与开放问题

- Nest CLI 脚手架会生成默认示例文件，需要替换为 ByYouSide 专用基础文件。
- 当前 Node 版本是 `v24.14.0`；如果后续部署环境使用不同版本，需要更新 `server-node/README.md` 和 `.env.example`。
- 完整 JWT/auth 行为有意推迟到 Phase 3。

## 审阅记录

计划审阅结果：

- [x] 基础骨架范围内的旧行为已覆盖。
- [x] API 文档计划清晰。
- [x] 数据模型计划清晰，因为 Phase 1 不涉及持久化。
- [x] 测试对基础骨架范围足够。
- [x] 没有未解决的阻塞问题。

审阅备注：

- 可以执行 Phase 1 实现。
- 保持旧项目不动，只更新迁移文档。

## 进度记录

| 日期 | 状态 | 说明 |
| --- | --- | --- |
| 2026-05-16 | 批准实现 | 阅读迁移文档、Skill 规则和旧基础设施文件后创建初始计划 |
| 2026-05-16 | 实现中 | 创建 `server-node/`，并用 ByYouSide 基础设施替换 Nest 默认示例代码 |
| 2026-05-16 | 已验证 | format、lint、unit test、e2e test、build 和运行时 HTTP 检查全部通过 |
| 2026-05-16 | 已关闭 | Phase 1 文档和迁移状态已更新 |

## 完成记录

已完成代码：

- `server-node/` NestJS 项目。
- 全局 `/api` 前缀和 URI versioning。
- 全局 validation pipe。
- 全局统一响应 interceptor。
- 全局异常 filter。
- 通用响应/错误 DTO 和类型。
- `GET /api/v1/health` 健康检查模块。
- `/api/docs` 和 `/api/docs-json` Swagger/OpenAPI。
- `.env.example`。
- Unit 和 e2e 测试。

已完成文档：

- 本计划。
- `server-node/README.md`。
- `docs/NODE_MIGRATION_PLAN.md`。
- `docs/migration-plans/README.md`。

验证结果：

- `npm run format`：通过。
- `npm run lint`：通过。
- `npm run test`：通过。
- `npm run test:e2e`：通过。
- `npm run build`：通过。
- 针对 `node dist/main.js` 的运行时检查：`/api/v1/health` 返回 `code=200`，`/api/docs-json` 返回标题 `ByYouSide API`，且 OpenAPI 包含 `/api/v1/health`。

已知后续：

- Phase 2 需要添加 Prisma/PostgreSQL 和 seed 策略。
- Phase 3 需要添加标准 JWT auth 和 users 模块。
