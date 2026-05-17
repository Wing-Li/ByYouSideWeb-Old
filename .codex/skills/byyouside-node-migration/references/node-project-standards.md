# Node 项目规范

新 `server-node/` 后端使用本规范。

## 架构

默认技术栈：

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Swagger/OpenAPI
- Jest + Supertest

推荐结构：

```text
server-node/
  prisma/
    schema.prisma
    seed.ts
  src/
    main.ts
    app.module.ts
    common/
      auth/
      decorators/
      filters/
      guards/
      interceptors/
      response/
      utils/
    config/
    database/
    integrations/
      mail/
      umeng-push/
    modules/
      auth/
      users/
      friends/
      devices/
      memoirs/
      moments/
      vip/
      app-config/
      announcements/
      feedback/
      versions/
  test/
  .env.example
```

## 模块规则

- 一个 Nest module 只承载一个业务领域。
- 路由定义只放在 controller。
- 业务规则放在 service。
- 数据访问通过 Prisma service 或小型 repository helper。
- DTO 放在对应模块附近。
- 鉴权、响应、过滤器和 Guard 等横切能力放在 `common/`。
- 外部服务放在 `integrations/`。

## TypeScript 规则

- 启用 strict 模式。
- 避免 `any`，除非有明确且很窄的原因。
- 使用 DTO class 做输入校验。
- 公开 service 方法使用明确返回类型。
- 对稳定业务状态使用 enum，不使用魔法字符串。

## Prisma 规则

- PostgreSQL 是数据源事实标准。
- 使用 Prisma migrations 管理 schema。
- 数据库命名保持一致，必要时通过 Prisma mapping 统一为 `snake_case`。
- 统一使用 `createdAt` 和 `updatedAt`。
- 常用查询字段使用明确关系和索引。
- 不依赖旧 H2 schema 或旧生成 ID。
- seed 默认 App 配置、VIP 套餐和管理员用户。

## 鉴权规则

- 使用标准 JWT payload 字段：
  - `sub`：用户 ID
  - `iat`：签发时间
  - `exp`：过期时间
- 认证接口使用 Guard。
- 管理接口使用角色 Guard。
- 不在源码中保存 JWT secret。
- 只有明确规划后再支持 refresh token。

## 安全规则

- 只存储密码 hash。
- 验证码优先存储 hash。
- 不记录密码、token、验证码或密钥日志。
- 所有密钥从环境变量读取。
- `.env.example` 保持完整但使用假值。
- 开发环境 mock provider 不能误发真实邮件或推送。

## 外部集成规则

邮件：

- 提供邮件服务接口。
- 支持开发 mock/log 模式。
- 只有显式通过环境变量启用时才使用真实 SMTP。

友盟推送：

- 提供推送服务接口。
- Android 和 iOS payload 构造隔离。
- 支持开发 mock/log 模式。
- 推送消息类型应有明确类型。

网易云信 IM：

- 不实现。
- 从 VIP 和用户更新流程中移除旧耦合。

## 测试规则

每个已迁移模块应包含：

- 业务规则 service 单元测试。
- 重要 API 流程 e2e 测试。
- 错误输入校验测试。
- 认证和管理员接口权限测试。

模块开发后运行聚焦测试；标记阶段完成前运行更广的检查。

## 文档规则

- 每个公开接口必须出现在 Swagger/OpenAPI 中。
- 阶段状态变化时更新 `docs/NODE_MIGRATION_PLAN.md`。
- 有意改变旧行为时添加模块说明。
- README 保持实用且最新。

## 健康检查

完成有意义的代码变更前，优先运行：

- formatter
- linter
- typecheck
- unit tests
- 受影响模块的 e2e tests
- schema 变化时运行 Prisma generate/migrate validation

如某项检查无法运行，记录原因。
