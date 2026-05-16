# ByYouSideWeb

ByYouSideWeb 是「伴你左右 / ByYouSide」App 的后端服务。项目使用 Kotlin + Spring Boot 构建，提供用户账号、密友关系、设备状态上报、位置请求、回忆录、瞬间、会员、公告、反馈、版本更新、邮件验证码、网易云信 IM 注册/更新、友盟推送等能力。

本文档面向人类维护者和 AI 编码助手：先说明业务，再说明架构、数据模型、API 与运行方式，便于快速理解和继续开发。

## 项目定位

这个服务不是普通内容社区后端，而是围绕「两个人或少量亲密好友之间的陪伴关系」设计的 App 后端。

核心业务包括：

- 用户注册、登录、资料维护、密码重置、账号注销。
- 好友/密友关系申请、同意、拒绝、删除、拉黑、备注、绑定“亲密好友”。
- 设备状态上报：电量、屏幕、音量、蓝牙、Wi-Fi、GPS、定位地址、经纬度等。
- 位置请求推送：用户可以向对方发起查看位置提醒。
- 两人关系下的内容沉淀：`Memoirs` 回忆录、`Moments` 瞬间。
- VIP 会员体系：单人会员、双人会员、会员绑定名额、充值记录。
- App 基础配置、公告、反馈、版本更新。
- 外部系统集成：网易云信 IM、友盟 Android/iOS 推送、163 SMTP 邮件验证码。

## 技术栈

- 语言：Kotlin 1.7.22
- 框架：Spring Boot 3.0.6
- 构建：Gradle Wrapper
- JDK：17
- Web：Spring MVC
- ORM：Spring Data JPA / Hibernate
- 数据库：H2 文件数据库，使用 `MODE=MYSQL`
- JSON：Jackson Kotlin、Fastjson2
- 工具库：Hutool
- 密码加密：Spring Security Crypto / BCrypt
- 模板：Thymeleaf 邮件模板
- 外部服务：
  - 网易云信 IM
  - 友盟推送
  - 163 SMTP 邮件

## 目录结构

```text
.
├── build.gradle
├── settings.gradle
├── gradlew / gradlew.bat
├── src/main/kotlin/com/lyl/byyouside
│   ├── ByYouSideApplication.kt
│   ├── config
│   │   ├── Config.kt
│   │   ├── ContextHolder.kt
│   │   └── StatusCode.kt
│   ├── controller
│   │   ├── api
│   │   ├── base
│   │   ├── chat
│   │   ├── exception
│   │   ├── filter
│   │   └── init
│   ├── model
│   │   ├── announcement
│   │   ├── base
│   │   ├── config
│   │   ├── device
│   │   ├── feedback
│   │   ├── friend
│   │   ├── memoirs
│   │   ├── moment
│   │   ├── user
│   │   ├── version
│   │   └── vip
│   ├── push
│   └── utils
└── src/main/resources
    ├── application.properties
    ├── application-dev.properties
    ├── application-prod.properties
    ├── templates/EmailVerificationCode.html
    └── static/images/user
```

## 启动入口与全局行为

入口类是 `ByYouSideApplication.kt`：

- `@SpringBootApplication` 启动 Spring Boot。
- `@EnableJpaAuditing` 开启 JPA 自动创建时间。
- `@EnableTransactionManagement` 开启事务。
- `@PostConstruct` 将默认时区设置为 `Asia/Shanghai`。

所有业务 Controller 继承 `ApiBaseController`，统一挂在 `/api` 前缀下。

统一返回结构是 `BaseCallBack<T>`：

```json
{
  "code": 200,
  "message": "请求成功",
  "data": {},
  "totalPages": 1,
  "currentPage": 1,
  "totalElements": 10,
  "size": 20,
  "isListLast": true
}
```

列表接口会补充分页字段。普通成功响应 `code=200`，失败响应使用 `StatusCode.kt` 中定义的业务码。

## 配置与运行

默认 profile：

```properties
spring.profiles.active=dev
```

开发环境 `application-dev.properties`：

- 端口：`38080`
- 数据库：`jdbc:h2:file:./ByYourSide/config/db/.h2/side_db;MODE=MYSQL`
- H2 Console：`/h2-bnzy-db`
- JPA：`spring.jpa.hibernate.ddl-auto=update`

生产环境 `application-prod.properties`：

- 端口：`38020`
- 同样使用 H2 文件数据库路径。

启动命令：

```bash
./gradlew bootRun
```

Windows：

```powershell
.\gradlew.bat bootRun
```

打包：

```bash
./gradlew build
```

启动后，本地开发接口地址通常是：

```text
http://localhost:38080/api
```

## 鉴权机制

`WebMvcConfiguration` 注册 `UserTokenInterceptor`，除白名单外，所有接口都需要请求头：

```http
Authorization: Bearer <jwt>
```

白名单接口：

- `/favicon.ico`
- `/error`
- `/api/user/register`
- `/api/user/login`
- `/api/user/resetPassSendEmailCode`
- `/api/user/resetPassVerifyCode`
- `/api/user/cancelDestroy`
- `/api/config/h5`
- `/api/config/app`
- `/api/version/getLast`
- `/images/user/**`

Token 由 `JwtUtils` 创建和校验。Token 中把 `userId` 和 `expireTime` 放在 JWT header 里。拦截器解析后把当前用户 ID 放入 `ContextHolder.userId`，请求完成后清理 ThreadLocal。

注意：当前 `JwtUtils.verifyToken` 只校验签名，代码没有实际判断 `expireTime` 是否过期。

## 初始化逻辑

`InitLogic` 在应用启动后执行：

- 初始化 VIP 类型：月、季、半年、年、年包三天试用，以及双人会员套餐。
- 初始化 App 配置：默认 `appName` 和 `unCheckModel=false`。

如果数据库中已经存在相关记录，则不会重复初始化。

## 核心数据模型

### UserInfo

用户表，主键从 `10000` 开始。核心字段：

- `userName`：用户名，唯一，4-20 位字母/数字/下划线。
- `email`：邮箱。
- `password`：BCrypt 加密密码，返回 JSON 时隐藏。
- `nickName`、`icon`、`gender`、`introduction`、`birthday`：资料字段。
- `uploadIntervalTime`：设备信息上报间隔，默认 120。
- `vipFrom`、`vipLevel`、`vipLimitDate`、`bindCount`：会员信息。
- `isDestroy`、`destroyDate`、`destroyReason`：注销信息。
- `locationAddress`、`locationLongitude`、`locationLatitude`、`locationTime`：最近位置快照。
- `code`、`codeDate`：找回密码验证码。
- `imAccountId`：网易云信 IM 账号。
- `deviceType`、`deviceAliasType`、`deviceAlias`：友盟推送设备信息。
- `status`：身份标识，`admin` 表示管理员。

### Friend

双向好友关系表。系统会为双方各保存一条关系记录。

- `myUser`：关系拥有者。
- `toUser`：对方用户。
- `friendAlias`：好友备注。
- `checkBestFriend`：是否是亲密好友。
- `status`：
  - `-2`：永久拒绝
  - `-1`：拒绝
  - `0`：等待确认
  - `1`：已同意
- `checkBlock`：
  - `0`：正常
  - `1`：我拉黑了对方
  - `2`：对方拉黑了我

### DeviceInfo

用户设备状态上报记录：

- 设备名、屏幕状态、屏幕亮度、电池状态、电量、音量。
- 蓝牙状态、蓝牙名称。
- Wi-Fi 状态、Wi-Fi 名称。
- GPS 状态、定位来源、地址、经纬度。

新增设备记录时，会同步更新 `UserInfo` 中的最近位置字段。

### Memoirs 与 Moments

两者都属于某条好友关系 `friendId`：

- `Memoirs`：回忆录，有标题、正文、日期。
- `Moments`：瞬间，只有正文和日期。

列表查询时会根据当前用户的好友关系 ID 找到对方的反向关系 ID，再一起查询两人的内容。

### Vip 与 VipRecharge

`Vip` 是会员套餐：

- `level`：会员等级。
- `duration`：时长，单位月。
- `price`：价格。
- `identity`：商品标识。
- `status`：
  - `-1`：关闭
  - `0`：普通单人会员
  - `2`：双人会员
  - `999`：测试

`VipRecharge` 是会员购买/开通记录：

- `userId`：被开通会员的用户。
- `vip`：套餐。
- `vipFrom`：`ios` / `android` / `bind` / `admin`。
- `bindFromUserId`：如果来自绑定会员，记录赠送者。
- `actualPrice`：实际支付金额。

### 其他实体

- `ConfigInfo`：App 配置，含审核模式和会员套餐列表。
- `Announcement`：公告。
- `Feedback`：用户反馈。
- `Version`：App 最新版本信息。

## API 概览

所有接口默认前缀为 `/api`。

### 用户

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/user/register` | 否 | 注册用户，返回用户信息和 token |
| POST | `/user/login` | 否 | 登录，支持用户名或邮箱 |
| POST | `/user/resetPassSendEmailCode` | 否 | 发送找回密码邮箱验证码 |
| POST | `/user/resetPassVerifyCode` | 否 | 校验验证码并重置密码 |
| POST | `/user/update` | 是 | 更新资料、推送设备别名、会员状态等 |
| POST | `/user/getAll` | 是 | 获取所有用户 |
| POST | `/user/getUser` | 是 | 按用户 ID 获取用户 |
| POST | `/user/getMyInfo` | 是 | 获取当前用户 |
| POST | `/user/destroy` | 是 | 申请注销 |
| POST | `/user/cancelDestroy` | 否 | 取消注销 |
| POST | `/user/requestLocation` | 是 | 向对方发送位置请求推送 |

### 好友/密友

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/friend/request` | 请求添加好友 |
| POST | `/friend/agreeRequest` | 同意好友请求，并创建双方关系 |
| POST | `/friend/rejectRequest` | 拒绝好友请求，可永久拒绝 |
| POST | `/friend/delete` | 删除好友，并删除双方回忆录/瞬间 |
| POST | `/friend/block` | 拉黑或取消拉黑好友 |
| POST | `/friend/update` | 修改好友备注 |
| POST | `/friend/getMyFriend` | 分页查询我的好友 |
| POST | `/friend/getRequestMeFriend` | 分页查询请求我的好友 |
| POST | `/friend/bindBestFriend` | 绑定亲密好友 |

### 设备状态

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/device/add` | 新增当前用户设备状态，并同步最近位置 |
| GET | `/device/myInfoList` | 当前用户设备状态分页列表 |
| GET | `/device/getByUserId` | 指定用户设备状态分页列表 |
| GET | `/device/getMyLast` | 当前用户最新设备状态 |
| GET | `/device/getLastByUserId` | 指定用户最新设备状态 |

### 回忆录

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/memoirs/create` | 创建回忆录 |
| POST | `/memoirs/update` | 更新回忆录 |
| POST | `/memoirs/delete` | 删除自己创建的回忆录 |
| GET | `/memoirs/get` | 按 ID 获取回忆录 |
| GET | `/memoirs/list` | 查询某段好友关系下双方回忆录 |

### 瞬间

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/moments/create` | 创建瞬间 |
| POST | `/moments/update` | 更新瞬间 |
| POST | `/moments/delete` | 删除自己创建的瞬间 |
| GET | `/moments/get` | 按 ID 获取瞬间 |
| GET | `/moments/list` | 查询某段好友关系下双方瞬间 |

### VIP

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/vip/addRecharge` | 为自己或指定用户开通会员 |
| POST | `/vip/bindVip` | 使用双人会员名额给其他用户绑定会员 |
| POST | `/vip/create` | 管理员创建会员套餐 |
| POST | `/vip/update` | 管理员更新会员套餐 |
| GET | `/vip/getRechargeAll` | 查询全部充值记录 |
| GET | `/vip/getRechargeByUserId` | 查询指定用户充值记录 |
| GET | `/vip/getMyRecharge` | 查询当前用户充值记录 |
| GET | `/vip/getType` | 查询全部会员套餐 |

### 配置、公告、反馈、版本

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/config/create` | 是，管理员 | 创建或更新 App 配置 |
| GET | `/config/app` | 否 | 获取 App 配置和会员套餐 |
| POST | `/announcement/add` | 是 | 添加公告 |
| GET | `/announcement/getAll` | 是 | 分页获取公告 |
| GET | `/announcement/getLast` | 是 | 获取最新公告 |
| POST | `/feedback/add` | 是 | 提交反馈 |
| GET | `/feedback/get` | 是 | 分页获取反馈 |
| POST | `/version/add` | 是，管理员 | 添加版本信息 |
| GET | `/version/getLast` | 否 | 获取最新版本 |

## 主要业务流程

### 注册与登录

1. 客户端调用 `/api/user/register`，传入 `userName`、`passWord`、`email`。
2. 后端校验用户名、密码长度、邮箱格式、用户名唯一性、邮箱唯一性。
3. 密码使用 BCrypt 加密后保存。
4. 注册成功后生成 JWT token 并返回。
5. 登录时用用户名或邮箱查找用户，校验 BCrypt 密码，校验注销/封禁状态，再返回 token。

### 密码重置

1. 客户端调用 `/api/user/resetPassSendEmailCode`。
2. 后端按用户名或邮箱找到用户。
3. 1 分钟内不能重复发送验证码。
4. 生成 4 位数字验证码，用 Thymeleaf 模板渲染 HTML 邮件，通过 163 SMTP 发送。
5. 客户端调用 `/api/user/resetPassVerifyCode`，验证码 5 分钟内有效。
6. 校验成功后更新 BCrypt 密码，清空验证码字段。

### 添加好友

1. A 调用 `/api/friend/request` 请求添加 B。
2. 如果 A 已请求过 B，根据状态返回重复请求、已是好友或永久拒绝。
3. 如果 B 已经请求过 A，则直接把 B -> A 设置为同意，并创建 A -> B 的关系。
4. 否则创建 A -> B 的等待关系。
5. 请求、同意等事件会尝试通过友盟推送通知对方。

### 删除好友

1. 调用 `/api/friend/delete`。
2. 后端校验当前用户只能删除自己的关系记录。
3. 删除自己的关系记录。
4. 查找并删除对方的反向关系记录。
5. 删除两条关系 ID 关联的回忆录和瞬间。

### 设备上报与位置

1. 客户端周期性调用 `/api/device/add` 上报设备状态。
2. 设备记录保存到 `DeviceInfo`。
3. 如果带了定位信息，同步写入 `UserInfo` 的最近位置快照。
4. 用户调用 `/api/user/requestLocation` 时，后端根据对方用户的 `deviceType`、`deviceAliasType`、`deviceAlias` 发友盟推送。

### 会员开通与绑定

1. `/api/vip/addRecharge` 创建充值记录，并更新用户会员等级、来源、到期时间、绑定名额。
2. 如果用户已有未过期会员，则在原到期时间上叠加月份；否则从当前时间开始计算。
3. 开通会员后，会为用户创建或更新网易云信 IM 账号。
4. 双人会员会提供 `bindCount` 名额，例如 `1/1`。
5. `/api/vip/bindVip` 使用当前用户名额给另一个用户开通 `from=bind` 的会员，并减少名额。

## 外部服务集成

### 网易云信 IM

位置：`controller/chat/ChatYxImApi.kt`

功能：

- 根据当前环境生成 IM 账号：`dev_bnzy_<userId>` 或 `prod_bnzy_<userId>`。
- 创建 IM 用户。
- 查询 IM 用户是否存在。
- 更新 IM 用户资料。

调用使用 Hutool `HttpRequest`，请求头通过 `CheckSumBuilder` 生成 `CheckSum`。

### 友盟推送

位置：`push/`

功能：

- Android/iOS 推送 JSON 构造。
- 单个 alias 通知。
- 单个 alias 透传消息。
- 按 alias type 推送。
- 业务类型：
  - `requestLocation`
  - `requestAddFriend`
  - `agreeAddFriend`
  - `bindVip`

### 邮件验证码

位置：

- `utils/EmailUtils.kt`
- `resources/templates/EmailVerificationCode.html`

功能：

- 通过 Hutool Mail 连接 163 SMTP。
- 使用 Thymeleaf 模板渲染验证码邮件。
- 支持普通文本、HTML、群发。

## 安全与维护注意事项

当前代码中存在一些需要优先治理的点：

- 多个外部服务密钥、SMTP 授权码、JWT secret、AES key 直接写在源码中。建议迁移到环境变量或独立配置文件，并避免提交真实密钥。
- `application-dev.properties` 和 `application-prod.properties` 中包含数据库账号密码。
- H2 Console 开启了 `web-allow-others=true`，生产环境应关闭或加强访问控制。
- JWT 中有 `expireTime`，但校验逻辑没有实际判断是否过期。
- `/api/user/getAll`、公告添加、反馈查询、充值记录查询等接口的权限边界偏宽，建议按管理员权限重新审视。
- 部分 GET 接口会返回指定用户设备信息，需要结合产品权限判断是否只允许好友访问。
- 响应加密逻辑在 `MyResponseBodyAdvice` 中已注释，当前所有 API 明文返回。
- 源码中的部分中文注释在当前环境显示为乱码，建议统一文件编码为 UTF-8。
- `Date.month` 已废弃，会员到期时间叠加建议改为 `java.time.LocalDateTime` 或 `Calendar`。

## 给 AI 维护者的快速理解

如果要继续开发，请按这个顺序读代码：

1. `ByYouSideApplication.kt`：启动与时区。
2. `ApiBaseController.kt`：统一返回、分页、用户状态校验。
3. `UserTokenInterceptor.kt`：鉴权白名单、JWT 解析、`ContextHolder.userId`。
4. `model/user/UserInfo.kt`、`model/friend/Friend.kt`、`model/device/DeviceInfo.kt`：核心数据结构。
5. `UserController.kt`、`FriendController.kt`、`DeviceInfoController.kt`：主业务闭环。
6. `MemoirsController.kt`、`MomentsController.kt`：关系内容。
7. `VipRechargeController.kt`、`ConfigInfoController.kt`：会员与配置。
8. `ChatYxImApi.kt`、`PushApi.kt`、`EmailUtils.kt`：外部集成。

开发时要特别注意：

- 当前用户 ID 不从参数取，而是来自 `ContextHolder.userId`。
- 好友关系是双向两条记录，很多查询需要同时处理正向和反向 `friendId`。
- 删除好友会级联删除两人相关的回忆录和瞬间，但这是业务层手动删除，不是数据库外键级联。
- 会员开通会产生充值记录，并可能触发 IM 注册/更新。
- 推送依赖用户表里的 `deviceType`、`deviceAliasType`、`deviceAlias`。

## License

GNU AGPLv3

Copyright (c) 2023 Wing-Li

[GNU Affero General Public License v3.0](https://choosealicense.com/licenses/agpl-3.0/)
