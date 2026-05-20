# 伴你左右 Node API

`server-node` 是伴你左右服务端 API 项目，基于 NestJS、TypeScript、Prisma 和 PostgreSQL 构建。项目提供账号认证、用户资料、好友关系、设备与位置、回忆录、瞬间、VIP、App 配置、公告、反馈、版本发布、邮件验证码和友盟推送等后端能力。

## 技术栈

- Runtime：Node.js
- Framework：NestJS 11
- Language：TypeScript
- ORM：Prisma 7
- Database：PostgreSQL
- API 文档：Swagger/OpenAPI
- 参数校验：class-validator、class-transformer
- 测试：Jest、Supertest
- 密码哈希：bcryptjs
- 邮件：Nodemailer
- 推送：友盟 Push API

## 项目结构

```text
server-node/
├── docs/
│   └── swagger/
│       └── openapi-examples.json
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   └── capture-api-examples.ts
├── src/
│   ├── common/
│   │   ├── auth/
│   │   ├── decorators/
│   │   ├── errors/
│   │   ├── filters/
│   │   └── response/
│   ├── database/
│   ├── integrations/
│   │   ├── mail/
│   │   └── push/
│   ├── modules/
│   │   ├── announcements/
│   │   ├── app-config/
│   │   ├── auth/
│   │   ├── devices/
│   │   ├── feedback/
│   │   ├── friends/
│   │   ├── health/
│   │   ├── memoirs/
│   │   ├── moments/
│   │   ├── users/
│   │   ├── versions/
│   │   └── vip/
│   ├── app.module.ts
│   ├── main.ts
│   ├── setup-app.ts
│   └── setup-swagger.ts
├── test/
├── .env.example
├── package.json
└── prisma.config.ts
```

## 运行机制

应用入口为 `src/main.ts`。启动时会创建 Nest 应用，加载全局设置并监听 `PORT`。

全局行为定义在 `src/setup-app.ts`：

- API 统一前缀：`/api`
- URI 版本：默认 `/v1`
- ValidationPipe：启用白名单、禁止未知字段、自动转换类型
- ResponseInterceptor：统一成功响应结构
- HttpExceptionFilter：统一异常响应结构

Swagger 定义在 `src/setup-swagger.ts`：

- Swagger UI：`/api/docs`
- OpenAPI JSON：`/api/docs-json`
- 标题：`伴你左右 API`
- 支持 Bearer Token 鉴权
- 自动读取 `docs/swagger/openapi-examples.json` 注入真实接口示例

## 功能模块

| 模块 | 主要能力 |
| --- | --- |
| Health | 服务健康检查 |
| Auth | 注册、登录、密码重置验证码、确认密码重置 |
| Users | 当前用户资料、资料更新、账号注销申请、取消注销 |
| Friends | 好友申请、同意、拒绝、删除、拉黑、备注、好友列表、请求列表、亲密好友 |
| Devices | 设备状态上报、设备历史、最新设备状态、好友设备查询、请求好友位置 |
| Memoirs | 回忆录创建、更新、删除、详情、分页列表 |
| Moments | 瞬间创建、更新、删除、详情、分页列表 |
| VIP | VIP 套餐、开通、订单、双人会员绑定、管理员套餐和订单管理 |
| App Config | App 启动配置、VIP 套餐聚合、管理员配置更新 |
| Announcements | 公告创建、公告分页列表、最新公告 |
| Feedback | 用户反馈提交、管理员反馈列表 |
| Versions | 版本发布、最新版本查询 |
| Mail | 密码重置验证码邮件，支持 log 和 SMTP 模式 |
| Push | 好友、位置、VIP 相关推送，支持 log 和友盟模式 |

## API 路由

所有公开接口都带有 `/api/v1` 前缀。

### 基础

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | 否 | 服务健康检查 |

### 认证

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | 否 | 注册账号 |
| POST | `/api/v1/auth/login` | 否 | 登录并返回 Bearer Token |
| POST | `/api/v1/auth/password-reset/code` | 否 | 发送密码重置验证码 |
| POST | `/api/v1/auth/password-reset/confirm` | 否 | 校验验证码并重置密码 |

### 用户

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/v1/users/me` | 登录 | 获取当前用户资料 |
| PATCH | `/api/v1/users/me` | 登录 | 更新当前用户资料 |
| POST | `/api/v1/users/me/destroy-request` | 登录 | 申请注销账号 |
| POST | `/api/v1/users/me/destroy-request/cancel` | 登录 | 取消注销申请 |

### 好友

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/v1/friends/requests` | 登录 | 发送好友申请 |
| POST | `/api/v1/friends/requests/:id/accept` | 登录 | 同意好友申请 |
| POST | `/api/v1/friends/requests/:id/reject` | 登录 | 拒绝好友申请 |
| DELETE | `/api/v1/friends/:id` | 登录 | 删除好友 |
| PATCH | `/api/v1/friends/:id/block` | 登录 | 拉黑或取消拉黑好友 |
| PATCH | `/api/v1/friends/:id/alias` | 登录 | 修改好友备注 |
| GET | `/api/v1/friends` | 登录 | 查询我的好友 |
| GET | `/api/v1/friends/requests/incoming` | 登录 | 查询请求我的好友 |
| POST | `/api/v1/friends/:id/best` | 登录 | 设置亲密好友 |

### 设备与位置

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/v1/devices/snapshots` | 登录 | 上报设备状态 |
| GET | `/api/v1/devices/me/snapshots` | 登录 | 查询当前用户设备历史 |
| GET | `/api/v1/devices/me/snapshots/latest` | 登录 | 查询当前用户最新设备状态 |
| GET | `/api/v1/devices/users/:userId/snapshots` | 登录 | 查询好友设备历史 |
| GET | `/api/v1/devices/users/:userId/snapshots/latest` | 登录 | 查询好友最新设备状态 |
| POST | `/api/v1/devices/users/:userId/location-request` | 登录 | 请求好友位置 |

### 回忆录与瞬间

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/v1/memoirs` | 登录 | 创建回忆录 |
| GET | `/api/v1/memoirs` | 登录 | 查询回忆录列表 |
| GET | `/api/v1/memoirs/:id` | 登录 | 查询回忆录详情 |
| PATCH | `/api/v1/memoirs/:id` | 登录 | 更新回忆录 |
| DELETE | `/api/v1/memoirs/:id` | 登录 | 删除回忆录 |
| POST | `/api/v1/moments` | 登录 | 创建瞬间 |
| GET | `/api/v1/moments` | 登录 | 查询瞬间列表 |
| GET | `/api/v1/moments/:id` | 登录 | 查询瞬间详情 |
| PATCH | `/api/v1/moments/:id` | 登录 | 更新瞬间 |
| DELETE | `/api/v1/moments/:id` | 登录 | 删除瞬间 |

### VIP

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/v1/vip/plans` | 登录 | 查询 VIP 套餐 |
| POST | `/api/v1/vip/plans` | 管理员 | 创建 VIP 套餐 |
| PATCH | `/api/v1/vip/plans/:id` | 管理员 | 更新 VIP 套餐 |
| POST | `/api/v1/vip/orders` | 登录 | 开通 VIP |
| GET | `/api/v1/vip/orders/me` | 登录 | 查询我的 VIP 订单 |
| GET | `/api/v1/vip/orders` | 管理员 | 查询 VIP 订单列表 |
| POST | `/api/v1/vip/bindings` | 登录 | 绑定双人会员名额 |

### 配置、公告、反馈、版本

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/v1/app-config/app` | 否 | 查询 App 启动配置 |
| PATCH | `/api/v1/app-config/app` | 管理员 | 更新 App 启动配置 |
| POST | `/api/v1/announcements` | 管理员 | 创建公告 |
| GET | `/api/v1/announcements` | 否 | 分页查询公告 |
| GET | `/api/v1/announcements/latest` | 否 | 查询最新公告 |
| POST | `/api/v1/feedback` | 登录 | 提交反馈 |
| GET | `/api/v1/feedback` | 管理员 | 分页查看反馈 |
| POST | `/api/v1/versions` | 管理员 | 发布版本 |
| GET | `/api/v1/versions/latest` | 否 | 查询最新版本 |

## 响应格式

成功响应统一包装为：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应会额外包含 `pagination`：

```json
{
  "code": 200,
  "message": "success",
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "isLast": false
  }
}
```

错误响应统一为：

```json
{
  "code": 11002,
  "message": "密码错误",
  "data": null
}
```

## 鉴权

登录和注册成功后返回标准 Bearer Token：

```text
Authorization: Bearer <token>
```

JWT payload 使用标准字段：

- `sub`：用户 ID
- `iat`：签发时间
- `exp`：过期时间

需要登录的接口必须携带 `Authorization` 请求头。管理员接口要求当前用户 `role` 为 `ADMIN`。

## 数据模型

Prisma schema 位于 `prisma/schema.prisma`，主要模型包括：

| Model | 表名 | 说明 |
| --- | --- | --- |
| `User` | `users` | 用户账号、资料、角色、状态、VIP、位置和推送信息 |
| `VerificationCode` | `verification_codes` | 邮箱验证码，验证码只保存 hash |
| `FriendRelation` | `friend_relations` | 好友关系、状态、备注、拉黑状态和亲密好友 |
| `DeviceSnapshot` | `device_snapshots` | 设备状态和位置快照 |
| `Memoir` | `memoirs` | 回忆录 |
| `Moment` | `moments` | 瞬间 |
| `VipPlan` | `vip_plans` | VIP 套餐 |
| `VipOrder` | `vip_orders` | VIP 开通和绑定订单 |
| `AppConfig` | `app_configs` | App 启动配置 |
| `Announcement` | `announcements` | 公告 |
| `Feedback` | `feedbacks` | 用户反馈 |
| `AppVersion` | `app_versions` | App 版本发布记录 |

数据库字段使用 `snake_case`，TypeScript/Prisma 字段使用 `camelCase`，通过 Prisma `@map` 和 `@@map` 映射。

## 环境变量

本地开发可复制 `.env.example` 为 `.env`，生产环境建议使用部署平台环境变量或受控 `.env.production`。真实密钥不要提交到仓库。

### 基础配置

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `NODE_ENV` | 运行环境 | `development`、`test`、`production` |
| `PORT` | 服务监听端口 | `38080` |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://...` |
| `APP_ENVIRONMENT` | App 配置环境名 | `dev`、`production` |
| `APP_NAME` | App 名称 | `伴你左右` |
| `APP_UNCHECK_MODE` | App 审核模式开关 | `false` |

### 管理员 seed

| 变量 | 说明 |
| --- | --- |
| `ADMIN_USERNAME` | 初始管理员用户名 |
| `ADMIN_EMAIL` | 初始管理员邮箱 |
| `ADMIN_PASSWORD` | 初始管理员密码 |

### JWT

| 变量 | 说明 |
| --- | --- |
| `JWT_SECRET` | JWT 签名密钥，必须是真实随机密钥 |
| `JWT_EXPIRES_IN_SECONDS` | Token 有效期，单位秒 |

### 邮件

| 变量 | 说明 |
| --- | --- |
| `MAIL_MODE` | 邮件模式，`log` 或 `smtp` |
| `SMTP_HOST` | SMTP 主机 |
| `SMTP_PORT` | SMTP 端口 |
| `SMTP_SECURE` | 是否使用安全连接 |
| `SMTP_USER` | SMTP 用户 |
| `SMTP_PASS` | SMTP 密码或授权码 |
| `SMTP_FROM` | 发件人 |

`MAIL_MODE=log` 时不会发送真实邮件，只记录准备发送动作。`MAIL_MODE=smtp` 时会通过 Nodemailer 发送密码重置验证码邮件。

### 友盟推送

| 变量 | 说明 |
| --- | --- |
| `PUSH_MODE` | 推送模式，`log` 或 `umeng` |
| `UMENG_SEND_URL` | 友盟发送地址 |
| `UMENG_TIMEOUT_MS` | 友盟请求超时，单位毫秒 |
| `UMENG_ANDROID_APP_KEY` | Android appKey |
| `UMENG_ANDROID_APP_MASTER_SECRET` | Android master secret |
| `UMENG_IOS_APP_KEY` | iOS appKey |
| `UMENG_IOS_APP_MASTER_SECRET` | iOS master secret |

`PUSH_MODE=log` 时不会请求友盟，只记录脱敏推送日志。`PUSH_MODE=umeng` 时会调用友盟接口。

## 环境文件读取顺序

Nest 应用通过 `@nestjs/config` 读取环境变量：

```text
.env.<NODE_ENV>
.env
```

Prisma CLI 通过 `prisma.config.ts` 使用同样的读取顺序。

常用约定：

| 文件 | 用途 | 是否提交 |
| --- | --- | --- |
| `.env.example` | 安全模板，不包含真实密钥 | 是 |
| `.env` | 本地开发环境 | 否 |
| `.env.test` | 自动化测试环境 | 否 |
| `.env.production` | 本地或服务器生产环境文件 | 否 |

## 安装依赖

```bash
npm ci
```

开发时也可以使用：

```bash
npm install
```

## 本地启动

启动开发服务：

```bash
npm run start:dev
```

构建后以生产模式启动：

```bash
npm run build
npm run start:prod
```

如果在 Windows PowerShell 中遇到执行策略限制，可以使用 `npm.cmd`：

```powershell
npm.cmd run start:dev
npm.cmd run build
```

## 本地访问

端口由 `PORT` 环境变量决定。以 `PORT=38080` 为例：

- 健康检查：`http://localhost:38080/api/v1/health`
- Swagger UI：`http://localhost:38080/api/docs`
- OpenAPI JSON：`http://localhost:38080/api/docs-json`

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run start` | 启动 Nest 应用 |
| `npm run start:dev` | 监听模式启动开发服务 |
| `npm run start:debug` | Debug 模式启动开发服务 |
| `npm run start:prod` | 运行构建产物 |
| `npm run build` | 构建项目 |
| `npm run format` | 格式化 TypeScript 和 Prisma 相关文件 |
| `npm run lint` | ESLint 检查并自动修复 |
| `npm run test` | 运行单元测试 |
| `npm run test:e2e` | 运行 e2e 测试 |
| `npm run test:cov` | 运行测试覆盖率 |
| `npm run prisma:format` | 格式化 Prisma schema |
| `npm run prisma:validate` | 校验 Prisma schema |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 创建并应用开发环境数据库变更 |
| `npm run prisma:seed` | 初始化基础数据 |
| `npm run api:examples` | 通过真实 HTTP 请求刷新 Swagger 示例 |

## 数据库操作

校验 schema：

```bash
npm run prisma:validate
```

生成 Prisma Client：

```bash
npm run prisma:generate
```

本地开发创建数据库变更：

```bash
npm run prisma:migrate -- --name <migration_name>
```

发布环境应用已提交数据库变更：

```bash
npx prisma migrate deploy
```

执行 seed：

```bash
npm run prisma:seed
```

seed 会初始化：

- 默认管理员
- 默认 App 配置
- VIP 套餐

seed 所需管理员账号、邮箱、密码和 App 配置来自环境变量。

## Swagger 真实示例

Swagger 示例文件为：

```text
docs/swagger/openapi-examples.json
```

该文件由脚本通过真实 HTTP 请求生成：

```bash
npm run api:examples
```

生成前需要先启动服务，并确保数据库中存在可登录的演示用户和管理员用户，或通过以下变量覆盖：

| 变量 | 说明 |
| --- | --- |
| `API_BASE_URL` | 示例捕获的服务地址，默认按 `PORT` 计算 |
| `SWAGGER_DEMO_EMAIL` | 演示普通用户邮箱 |
| `SWAGGER_DEMO_PASSWORD` | 演示普通用户密码 |
| `SWAGGER_ADMIN_EMAIL` | 演示管理员邮箱，默认回退到 `ADMIN_EMAIL` |
| `SWAGGER_ADMIN_PASSWORD` | 演示管理员密码，默认回退到 `ADMIN_PASSWORD` |

生成脚本会：

- 请求真实 API。
- 原子写入 `openapi-examples.json`。
- 脱敏 JWT、密码和验证码。
- 阻止数据库连接串、演示密码、原始 token 等敏感内容写入示例文件。

## 测试

运行单元测试：

```bash
npm run test -- --runInBand
```

运行 e2e 测试：

```bash
npm run test:e2e -- --runInBand
```

建议提交前至少运行：

```bash
npm run format
npm run lint
npm run test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

涉及 Prisma schema 时额外运行：

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
```

## 生产部署建议

生产部署前建议按以下顺序执行：

1. 设置完整生产环境变量。
2. 安装依赖：`npm ci`。
3. 校验 Prisma schema：`npm run prisma:validate`。
4. 生成 Prisma Client：`npm run prisma:generate`。
5. 应用已提交数据库变更：`npx prisma migrate deploy`。
6. 执行 seed：`npm run prisma:seed`。
7. 构建项目：`npm run build`。
8. 启动服务：`npm run start:prod`。
9. 访问 `GET /api/v1/health` 确认服务可用。
10. 访问 `/api/docs-json` 确认 API 文档可生成。
11. 使用管理员账号登录，确认 `role` 为 `ADMIN`。

生产环境建议：

- 使用进程守护工具或平台托管能力运行服务。
- 使用 HTTPS 和反向代理暴露外部 API。
- 将数据库、JWT、SMTP、友盟密钥放入部署平台环境变量或受控密钥系统。
- 不在日志中输出密码、验证码、token 或服务密钥。
- 上线前确认数据库备份和回滚方案。

## 外部服务模式

### 邮件

开发或测试环境建议：

```text
MAIL_MODE=log
```

生产环境启用真实 SMTP：

```text
MAIL_MODE=smtp
```

SMTP 配置缺失或仍是占位值时，服务会在发送邮件时明确失败。

### 推送

开发或测试环境建议：

```text
PUSH_MODE=log
```

生产环境启用友盟：

```text
PUSH_MODE=umeng
```

当前支持四类业务推送：

- `requestLocation`
- `requestAddFriend`
- `agreeAddFriend`
- `bindVip`

友盟配置缺失或仍是占位值时，服务会在发送推送时明确失败。

## 安全约束

- 不提交 `.env`、`.env.test`、`.env.production`。
- 不在源码、README、测试快照或 Swagger 示例中写入真实密钥。
- 密码只保存 hash。
- 验证码只保存 hash，并带过期时间和消费状态。
- JWT secret 必须是真实随机值，不能使用示例占位。
- 生产环境应使用真实 PostgreSQL 连接串。
- 管理接口必须通过 Bearer Token 鉴权，并要求管理员角色。

## 开发约定

- Controller 只处理路由、参数、当前用户和 Swagger 声明。
- Service 承载业务流程和业务规则。
- PrismaService 负责数据库访问。
- DTO 负责输入校验和 Swagger schema。
- 公开 API 变化后，需要同步 DTO、测试和 Swagger 示例捕获脚本。
- Prisma schema 变化后，需要提交 migration 文件。
- 外部服务调用统一通过 `src/integrations/` 下的 provider。
