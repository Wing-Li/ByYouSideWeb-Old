# ByYouSide Node API

这是 ByYouSide 迁移后的新 Node.js 后端项目。

当前阶段：Phase 1，仅完成基础骨架。业务模块尚未迁移。

## 技术栈

- Node.js
- NestJS
- TypeScript
- Swagger/OpenAPI
- Jest + Supertest

后续 Phase 会继续接入 Prisma 和 PostgreSQL。

## 常用命令

```bash
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

## 环境变量

本地开发时可复制 `.env.example` 为 `.env`，再按需覆盖配置。

```bash
PORT=3000
NODE_ENV=development
```

## 本地地址

服务运行后：

- 健康检查：`GET http://localhost:3000/api/v1/health`
- Swagger UI：`http://localhost:3000/api/docs`
- OpenAPI JSON：`http://localhost:3000/api/docs-json`

## 基础规则

- 公开 API 路由统一使用 `/api` 前缀。
- 当前使用 URI 版本号，第一版路径为 `/v1`。
- 运行时响应统一包装为 `{ code, message, data }`。
- 参数校验和异常处理通过全局 Nest pipe/filter 统一处理。
- 不要把密钥写入源码。
- 不要添加网易云信 IM 集成。
