# Swagger 真实示例捕获规范

新增或修改 `server-node/` 公开 API 时使用本规范。

## 目标

Swagger UI 是主要 API 文档入口。请求和响应示例应来自本地真实 HTTP 请求，让前端开发者不必手动执行每个接口，也能预览接近真实的结果。

## 命令

本地服务启动后，在 `server-node/` 下运行：

```bash
npm run api:examples
```

默认值：

- `API_BASE_URL=http://localhost:3000`
- `SWAGGER_DEMO_EMAIL=yyy101@yy.com`
- `SWAGGER_DEMO_PASSWORD=123123123`

这些默认值只用于本地/测试。需要时可以用环境变量覆盖。

## 文件

- 捕获脚本：`server-node/scripts/capture-api-examples.ts`
- 生成示例：`server-node/docs/swagger/openapi-examples.json`
- Swagger 加载器：`server-node/src/setup-swagger.ts`

生成的 JSON 可以提交到仓库，但不得包含原始 token、验证码、数据库 URL、真实服务密钥或生产凭据。

## 捕获规则

- 示例必须来自真实 HTTP 响应。
- 不要手写响应示例冒充真实结果。
- Swagger 启动时只读取生成的 JSON 并注入 OpenAPI examples，不能发送 HTTP 请求。
- 原子写入示例：先生成到临时文件，安全校验后再替换最终文件。
- 捕获失败时应明确失败，不要留下部分生成的最终示例文件。

## 脱敏规则

- 将原始 JWT 替换为 `Bearer <captured-jwt-redacted>`。
- 将请求密码替换为 `<demo-password>`。
- 绝不把验证码写入生成示例。
- 绝不包含 `.env`、`DATABASE_URL`、SMTP 凭据、推送凭据或生产密钥。

## 模块迁移要求

每个模块执行计划必须包含示例捕获说明：

- 新增到 `npm run api:examples` 的接口。
- 已捕获的成功示例和重要失败示例。
- 有意不捕获的接口及原因。
- Swagger UI 能展示捕获示例的验证结果。

公开 API 模块的 Swagger 示例未捕获且未明确说明延后原因时，不得标记该模块完成。
