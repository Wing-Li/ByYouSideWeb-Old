# 旧代码阅读清单

迁移任何 ByYouSide 模块前使用本清单。目标是在写新 Node.js 代码前，先从旧源码证据中还原真实业务行为。

## 每次优先阅读

- `docs/NODE_MIGRATION_PLAN.md`
- `README.md`
- `src/main/kotlin/com/lyl/byyouside/ByYouSideApplication.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/filter/UserTokenInterceptor.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/exception/ExceptionController.kt`
- `src/main/kotlin/com/lyl/byyouside/config/ContextHolder.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/init/InitLogic.kt`

## 模块文件地图

| 模块 | 需要阅读的旧文件 |
| --- | --- |
| 用户/认证 | `controller/api/UserController.kt`、`model/user/UserInfo.kt`、`model/user/UserInfoRepository.kt`、`utils/JwtUtils.kt`、`utils/EmailUtils.kt`、`utils/MyUtils.kt` |
| 好友 | `controller/api/FriendController.kt`、`model/friend/Friend.kt`、`model/friend/FriendRepository.kt`、相关 `MemoirsRepository.kt`、`MomentsRepository.kt`、`push/PushApi.kt` |
| 设备/位置 | `controller/api/DeviceInfoController.kt`、`model/device/DeviceInfo.kt`、`model/device/DeviceInfoRepository.kt`、`model/user/UserInfo.kt`、`push/PushApi.kt` |
| 回忆录 | `controller/api/MemoirsController.kt`、`model/memoirs/Memoirs.kt`、`model/memoirs/MemoirsRepository.kt`、`model/friend/FriendRepository.kt` |
| 瞬间 | `controller/api/MomentsController.kt`、`model/moment/Moments.kt`、`model/moment/MomentsRepository.kt`、`model/friend/FriendRepository.kt` |
| VIP | `controller/api/VipRechargeController.kt`、`model/vip/Vip.kt`、`model/vip/VipRepository.kt`、`model/vip/VipRecharge.kt`、`model/vip/VipRechargeRepository.kt`、`controller/init/InitLogic.kt` |
| 配置 | `controller/api/ConfigInfoController.kt`、`model/config/ConfigInfo.kt`、`model/config/ConfigInfoRepository.kt`、`config/Config.kt`、`controller/init/InitLogic.kt` |
| 公告 | `controller/api/AnnouncementController.kt`、`model/announcement/Announcement.kt`、`model/announcement/AnnouncementRepository.kt` |
| 反馈 | `controller/api/FeedbackController.kt`、`model/feedback/Feedback.kt`、`model/feedback/FeedbackRepository.kt` |
| 版本 | `controller/api/VersionController.kt`、`model/version/Version.kt`、`model/version/VersionRepository.kt` |
| 邮件 | `utils/EmailUtils.kt`、`resources/templates/EmailVerificationCode.html` |
| 推送 | `push/PushApi.kt`、`push/AndroidNotificationFactory.kt`、`push/IOSNotificationFactory.kt`、`push/CustomMessage.kt`、`push/DisplayType.kt` |
| 已移除 IM | `controller/chat/ChatYxImApi.kt`、`controller/chat/CheckSumBuilder.kt`；只用于识别旧耦合并避免重新引入 |

## 行为提取模板

迁移每个接口或业务操作时，提取以下信息：

- 旧路由和 HTTP 方法。
- 鉴权要求和当前用户来源。
- 请求参数，包括旧字段名和可空行为。
- 校验规则。
- 数据库读写。
- 外部副作用，例如邮件或推送。
- 响应体和分页结构。
- 业务错误码和错误消息。
- 权限检查。
- 与其它模块的隐式耦合。
- 新 Node.js 后端中需要有意改变的行为。

## 证据规则

- 优先引用直接代码证据，不凭记忆。
- 修改模型前先搜索实体或仓库的所有使用点。
- 修改关系前先检查删除路径。
- 修改默认数据前先检查初始化和 seed 逻辑。
- 替换错误码前先检查 `StatusCode.kt`。
- 修改用户设备字段前先检查推送和邮件调用方。

## 停止条件

遇到以下情况时，先停下来补充上下文：

- 某个字段被多个模块使用且含义不清。
- 旧行为看起来不安全，新行为可能需要有意改变。
- 接口存在超过本表自身的副作用。
- 无法解释 App 客户端应该如何调用新 API。
