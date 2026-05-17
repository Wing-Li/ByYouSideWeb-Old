# API 文档规范

新 Node 后端可以重新设计 API，但 App 开发者必须能够完全依赖文档完成接入。

## 每个接口必须记录

- 摘要。
- 详细业务说明。
- 鉴权要求。
- 所需角色，如有。
- HTTP 方法和路径。
- 请求体 schema。
- Query、Path、Header 参数。
- 成功响应 schema。
- 错误响应 schema。
- 业务错误码。
- 示例请求。
- 示例成功响应。
- 示例失败响应。
- 重要副作用。

公开 API 的请求和响应示例应通过 `npm run api:examples` 从本地真实 HTTP 请求捕获。只要捕获脚本可以生成，就不要手写虚构响应示例。

## 响应规范

标准成功响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

标准分页成功响应：

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

标准失败响应：

```json
{
  "code": 11001,
  "message": "用户名或密码无效",
  "data": null
}
```

## 命名建议

新 API 优先使用 REST 风格路由：

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PATCH /users/me`
- `POST /friends/requests`
- `POST /friends/requests/:id/accept`
- `POST /friends/requests/:id/reject`
- `GET /devices/me/snapshots`
- `POST /devices/snapshots`

迁移说明中保留旧接口到新接口的映射关系。

## DTO 规则

- 使用明确的 DTO class。
- 所有用户输入都使用校验装饰器。
- 所有字段都使用 Swagger 装饰器。
- 明确标注可空字段。
- 提供示例。
- 不暴露密码 hash、验证码 hash、密钥或内部字段。

## 错误码规则

使用稳定的模块范围：

| 范围 | 模块 |
| --- | --- |
| 10000-10999 | 通用错误 |
| 11000-11999 | 认证与账号 |
| 12000-12999 | 用户资料 |
| 13000-13999 | 好友关系 |
| 14000-14999 | 设备与位置 |
| 15000-15999 | 回忆录 |
| 16000-16999 | 瞬间 |
| 17000-17999 | VIP |
| 18000-18999 | 配置 |
| 19000-19999 | 公告、反馈、版本 |
| 20000-20999 | 外部集成 |

代码中使用的每个业务错误都必须在文档中说明。

## 文档验证

标记 API 完成前，确认：

- Swagger/OpenAPI 可以打开或生成。
- DTO 字段与运行时 DTO 一致。
- 鉴权要求与 Guard 一致。
- 示例有效。
- Swagger 示例来自真实 HTTP 捕获；如果延后捕获，需要说明原因。
- 已记录旧接口到新接口的映射。
- 测试至少覆盖一个成功路径和一个失败路径。
