# Legacy Reading Checklist

Use this checklist before migrating any ByYouSide module. The goal is to rebuild behavior from source code evidence before writing Node.js code.

## Always Read First

- `docs/NODE_MIGRATION_PLAN.md`
- `README.md`
- `src/main/kotlin/com/lyl/byyouside/ByYouSideApplication.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/base/ApiBaseController.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/filter/UserTokenInterceptor.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/exception/ExceptionController.kt`
- `src/main/kotlin/com/lyl/byyouside/config/ContextHolder.kt`
- `src/main/kotlin/com/lyl/byyouside/config/StatusCode.kt`
- `src/main/kotlin/com/lyl/byyouside/controller/init/InitLogic.kt`

## Module File Map

| Module | Legacy files to read |
| --- | --- |
| Users/Auth | `controller/api/UserController.kt`, `model/user/UserInfo.kt`, `model/user/UserInfoRepository.kt`, `utils/JwtUtils.kt`, `utils/EmailUtils.kt`, `utils/MyUtils.kt` |
| Friends | `controller/api/FriendController.kt`, `model/friend/Friend.kt`, `model/friend/FriendRepository.kt`, related `MemoirsRepository.kt`, `MomentsRepository.kt`, `push/PushApi.kt` |
| Devices/Location | `controller/api/DeviceInfoController.kt`, `model/device/DeviceInfo.kt`, `model/device/DeviceInfoRepository.kt`, `model/user/UserInfo.kt`, `push/PushApi.kt` |
| Memoirs | `controller/api/MemoirsController.kt`, `model/memoirs/Memoirs.kt`, `model/memoirs/MemoirsRepository.kt`, `model/friend/FriendRepository.kt` |
| Moments | `controller/api/MomentsController.kt`, `model/moment/Moments.kt`, `model/moment/MomentsRepository.kt`, `model/friend/FriendRepository.kt` |
| VIP | `controller/api/VipRechargeController.kt`, `model/vip/Vip.kt`, `model/vip/VipRepository.kt`, `model/vip/VipRecharge.kt`, `model/vip/VipRechargeRepository.kt`, `controller/init/InitLogic.kt` |
| Config | `controller/api/ConfigInfoController.kt`, `model/config/ConfigInfo.kt`, `model/config/ConfigInfoRepository.kt`, `config/Config.kt`, `controller/init/InitLogic.kt` |
| Announcements | `controller/api/AnnouncementController.kt`, `model/announcement/Announcement.kt`, `model/announcement/AnnouncementRepository.kt` |
| Feedback | `controller/api/FeedbackController.kt`, `model/feedback/Feedback.kt`, `model/feedback/FeedbackRepository.kt` |
| Versions | `controller/api/VersionController.kt`, `model/version/Version.kt`, `model/version/VersionRepository.kt` |
| Mail | `utils/EmailUtils.kt`, `resources/templates/EmailVerificationCode.html` |
| Push | `push/PushApi.kt`, `push/AndroidNotificationFactory.kt`, `push/IOSNotificationFactory.kt`, `push/CustomMessage.kt`, `push/DisplayType.kt` |
| Removed IM | `controller/chat/ChatYxImApi.kt`, `controller/chat/CheckSumBuilder.kt`; read only to remove old coupling and avoid reintroducing it |

## Behavior Extraction Template

For every endpoint or business operation, extract:

- Legacy route and HTTP method.
- Authentication requirement and current-user source.
- Request parameters, including exact old names and nullable behavior.
- Validation rules.
- Database reads and writes.
- External side effects, such as mail or push.
- Response body and pagination shape.
- Business error codes and messages.
- Permission checks.
- Hidden coupling to other modules.
- Behavior that should intentionally change in Node.js.

## Evidence Rules

- Prefer direct code references over memory.
- Search for an entity or repository usage before changing a model.
- Inspect deletion paths before changing relationships.
- Inspect init/seed logic before changing default data.
- Inspect `StatusCode.kt` before replacing an error.
- Inspect push/mail callers before changing user device fields.

## Stop Conditions

Stop and gather more context when:

- A field is used by more than one module and the full meaning is unclear.
- Old behavior appears unsafe and the new behavior may intentionally differ.
- An endpoint has side effects beyond its own table.
- You cannot explain how App clients should call the new API.
