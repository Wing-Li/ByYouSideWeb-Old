# ByYouSide Node API

这是 ByYouSide 迁移后的新 Node.js 后端项目。

当前阶段：Phase 2 已完成，已接入 Prisma/PostgreSQL 基础设施、第一版数据模型和 Neon dev 数据库。业务接口尚未迁移。

## 当前环境记录

当前 Neon Postgres 使用分支区分本地开发和线上测试环境，两个分支都使用数据库名 `dev`：

| 项目 | 值 |
| --- | --- |
| Neon 项目名 | `byyouside-dev` |
| Neon Project ID | `snowy-surf-82537140` |
| 测试环境分支 | `main` / `br-odd-smoke-ajcku34s` |
| 本地开发分支 | `local` / `br-restless-feather-aj3rh3dm` |
| 数据库名 | 两个分支均为 `dev` |
| 连接方式 | Neon 直连 host |
| 连接配置文件 | `.env`、`.env.test` |

注意：

- 真实 `DATABASE_URL` 只写在本地 `.env` 和 `.env.test`，不要提交到仓库。
- Prisma migration 使用 Neon 直连 host，不使用 pooled host。
- `.env` 应指向 Neon `local` 分支，用于本地开发。
- `.env.test` 和线上测试环境变量应指向 Neon `main` 分支，用于发布后的测试环境。
- `local` 分支从 `main` 分支创建，创建时已继承当前 schema、migration 记录和 seed 数据。
- `APP_ENVIRONMENT=dev` 表示当前 App 配置环境名，对应 seed 写入的 `app_configs.environment`。
- 默认管理员由 seed 创建，账号、邮箱、密码来自环境变量；Phase 3 登录接口完成后再验证管理员登录链路。
- 2026-05-17 已创建 Neon `local` 分支，并已将本地 `.env` 的 `DATABASE_URL` 切换为 `local` 分支直连 host。

## 技术栈

- Node.js
- NestJS
- TypeScript
- Swagger/OpenAPI
- Prisma
- PostgreSQL
- Jest + Supertest

## 环境变量

本地开发时可复制 `.env.example` 为 `.env`，测试运行可复制为 `.env.test`。当前项目已在本机配置好真实 Neon dev 连接串，但该文件被 `.gitignore` 忽略。

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/dev?channel_binding=require&sslmode=verify-full"
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe_123456
APP_ENVIRONMENT=dev
APP_NAME=伴你左右
APP_UNCHECK_MODE=false
```

各环境文件约定：

| 文件 | 用途 | 是否提交 |
| --- | --- | --- |
| `.env.example` | 示例配置，不含真实密钥 | 是 |
| `.env` | 本地开发配置，应指向 Neon `local` 分支的 `dev` 数据库 | 否 |
| `.env.test` | 自动化测试配置，应指向 Neon `main` 分支的 `dev` 数据库 | 否 |

Nest 应用会按 `NODE_ENV` 自动读取 `.env.<NODE_ENV>`，再读取 `.env`。Prisma CLI 也使用同一套读取顺序。

## 常用命令

```bash
npm run start:dev
npm run start:prod
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Windows PowerShell 如果因为执行策略无法运行 `npm.ps1`，可以使用 `npm.cmd`：

```powershell
npm.cmd run build
npm.cmd run prisma:migrate
```

## 数据库操作

Prisma schema 位于：

```bash
prisma/schema.prisma
```

迁移文件位于：

```bash
prisma/migrations/
```

本地开发创建新迁移：

```bash
npm run prisma:migrate -- --name <migration_name>
```

测试/发布环境应用已提交迁移：

```bash
npx prisma migrate deploy
```

初始化或刷新基础数据：

```bash
npm run prisma:seed
```

当前 Neon `main/dev` 数据库已完成：

- migration：`20260517010000_init`
- seed 管理员：1 条
- seed App 配置：1 条
- seed VIP 套餐：10 条

`local/dev` 分支从 `main/dev` 创建，本地开发可在 `local` 上自由执行 migration 和 seed。发布测试环境时，只将已提交的 migration 应用到 `main`。

如果后续 seed 逻辑改为可重复执行，必须继续保持幂等，避免重复创建套餐或管理员。

## 本地启动

开发模式：

```bash
npm run start:dev
```

生产模式本地验证：

```bash
npm run build
npm run start:prod
```

## 本地地址

服务运行后：

- 健康检查：`GET http://localhost:3000/api/v1/health`
- Swagger UI：`http://localhost:3000/api/docs`
- OpenAPI JSON：`http://localhost:3000/api/docs-json`

## Swagger 真实示例生成

Swagger UI 是当前接口文档入口。接口示例通过显式脚本捕获真实 HTTP 响应生成，服务启动时只读取生成文件，不会自动请求接口或修改数据。

生成前先启动本地服务：

```bash
npm run build
npm run start:prod
```

然后在另一个终端执行：

```bash
npm run api:examples
```

默认配置：

- `API_BASE_URL=http://localhost:3000`
- `SWAGGER_DEMO_EMAIL=yyy101@yy.com`
- `SWAGGER_DEMO_PASSWORD=123123123`

生成文件：

```text
docs/swagger/openapi-examples.json
```

该文件会被 `src/setup-swagger.ts` 注入到 `/api/docs` 和 `/api/docs-json`。生成脚本会脱敏 JWT 和密码，并阻止验证码、数据库连接串、真实密钥等敏感内容进入示例文件。

后续每迁移一个公开 API 模块，都应同步扩展 `scripts/capture-api-examples.ts` 的捕获范围。

## 发布测试环境

发布到线上测试环境时建议按以下顺序执行：

1. 拉取最新代码。
2. 安装依赖：`npm ci`。
3. 配置环境变量，确保 `DATABASE_URL` 指向 Neon `main` 分支的 `dev` 数据库直连 host。
4. 生成 Prisma Client：`npm run prisma:generate`。
5. 应用迁移：`npx prisma migrate deploy`。
6. 必要时执行 seed：`npm run prisma:seed`。
7. 构建项目：`npm run build`。
8. 启动服务：`npm run start:prod`。
9. 验证健康检查和 Swagger：
   - `GET /api/v1/health`
   - `GET /api/docs-json`

发布前建议至少运行：

```bash
npm run prisma:validate
npm run lint
npm run test
npm run test:e2e
npm run build
```

等后续接入业务模块后，还需要补充对应模块的 e2e 链路验证。

## 基础规则

- 公开 API 路由统一使用 `/api` 前缀。
- 当前使用 URI 版本号，第一版路径为 `/v1`。
- 运行时响应统一包装为 `{ code, message, data }`。
- 参数校验和异常处理通过全局 Nest pipe/filter 统一处理。
- 不要把密钥写入源码。
- 不要添加网易云信 IM 集成。
- 本地开发使用 Neon `local/dev`，线上测试使用 Neon `main/dev`。
- 运行涉及数据库的命令前，先确认 `.env` 中的 `DATABASE_URL` 指向 Neon 直连 host，而不是 pooled host。

## 注意事项

- 本地开发和线上测试环境都使用名为 `dev` 的数据库，但位于不同 Neon 分支；执行 seed、migration、手动 SQL 前要确认当前连接的是 `local` 还是 `main`。
- 本地 `local` 分支用乱时，可以从 `main` 重建或 reset；不要把本地测试数据反向合并到 `main`。
- 不要在 README、迁移文档、提交记录或截图里暴露真实数据库密码。
- 修改 Prisma schema 后，必须同步提交 migration 文件。
- 本地开发先在 `local` 分支验证 migration；发布测试环境时再对 `main` 分支执行 `npx prisma migrate deploy`。
- 修改 public API 后，必须同步 Swagger DTO、e2e 测试和迁移文档。
- 当前业务接口尚未迁移，Swagger 中只有健康检查等基础接口。
- Phase 3 将开始认证与用户模块，届时需要验证 seed 管理员能正常登录。
