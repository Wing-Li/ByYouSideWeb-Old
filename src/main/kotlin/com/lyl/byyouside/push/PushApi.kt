package com.lyl.byyouside.push

import cn.hutool.crypto.SecureUtil
import cn.hutool.http.HttpRequest

enum class MyNotificationType {

    /**
     * 请求位置
     */
    requestLocation {
        override val value: String
            get() = "requestLocation"
    },

    /**
     * 请求好友
     */
    requestAddFriend {
        override val value: String
            get() = "requestAddFriend"
    },

    /**
     * 同意好友请求
     */
    agreeAddFriend {
        override val value: String
            get() = "agreeAddFriend"
    };

    abstract val value: String
}

class PushApi() {

    fun sendRequestLocation(
        deviceType: String,
        deviceAlias: String,
        deviceAliasType: String,
        fromUserId: Long,
        fromUserNickName: String,
        fromUserIcon: String,
    ): Boolean {
        val title = "$fromUserNickName 查看了你"
        val text = "伴友想你了，快去看看吧~~~"
        val isIos = "ios" == deviceType
        val customMessage = CustomMessage(
            fromUserId = fromUserId,
            fromUserNickName = fromUserNickName,
            fromUserIcon = fromUserIcon,
            type = MyNotificationType.requestLocation.value
        )

        val jsonBody = if (isIos) {
            IOSNotificationFactory.createSingleAliasNotification(deviceAlias, deviceAliasType, title, text, customMessage)
        } else {
            AndroidNotificationFactory.createSingleAliasNotification(deviceAlias, deviceAliasType, title, text, customMessage)
        }

        return send(jsonBody, isIos)
    }

    fun sendRequestAddFriend(
        deviceType: String,
        deviceAlias: String,
        deviceAliasType: String,
        fromUserId: Long,
        fromUserNickName: String,
        fromUserIcon: String,
    ): Boolean {
        val title = "请求添加好友"
        val text = "$fromUserNickName 请求添加您为伴友，快去查看吧"
        val isIos = "ios" == deviceType
        val customMessage = CustomMessage(
            fromUserId = fromUserId,
            fromUserNickName = fromUserNickName,
            fromUserIcon = fromUserIcon,
            type = MyNotificationType.requestAddFriend.value
        )

        val jsonBody = if (isIos) {
            IOSNotificationFactory.createSingleAliasNotification(deviceAlias, deviceAliasType, title, text, customMessage)
        } else {
            AndroidNotificationFactory.createSingleAliasNotification(deviceAlias, deviceAliasType, title, text, customMessage)
        }

        return send(jsonBody, isIos)
    }

    fun sendAgreeAddFriend(
        deviceType: String,
        deviceAlias: String,
        deviceAliasType: String,
        fromUserId: Long,
        fromUserNickName: String,
        fromUserIcon: String,
    ): Boolean {
        val title = "$fromUserNickName 同意了您的好友请求"
        val text = "快去看看TA的最新状态吧"
        val isIos = "ios" == deviceType
        val customMessage = CustomMessage(
            fromUserId = fromUserId,
            fromUserNickName = fromUserNickName,
            fromUserIcon = fromUserIcon,
            type = MyNotificationType.agreeAddFriend.value
        )

        val jsonBody = if (isIos) {
            IOSNotificationFactory.createSingleAliasNotification(deviceAlias, deviceAliasType, title, text, customMessage)
        } else {
            AndroidNotificationFactory.createSingleAliasNotification(deviceAlias, deviceAliasType, title, text, customMessage)
        }

        return send(jsonBody, isIos)
    }


    private fun send(jsonBody: String, isIos: Boolean): Boolean {
        val APP_MASTER_SECRET_ANDROID = "lymihxt43onxap8jzi9bpvihcuciabcr"
        val APP_MASTER_SECRET_IOS = "yuiwgqfdhjv4rpccqr7p1eycy5zk8gbo"

        val appMasterSecret = if (isIos) APP_MASTER_SECRET_IOS else APP_MASTER_SECRET_ANDROID
        var url = "https://msgapi.umeng.com/api/send"
        val sign = SecureUtil.md5("POST$url$jsonBody$appMasterSecret")
        url = "$url?sign=$sign"

        val response = HttpRequest.post(url)
            .header("User-Agent", "Mozilla/5.0")
            .body(jsonBody)
            .timeout(30 * 1000)
            .execute()

        if (response.status == 200) {
            println("通知发送成功。")
        } else {
            println("通知发送失败！")
            println(response.body().toString())
        }
        return true
    }


}