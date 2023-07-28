package com.lyl.byyouside.push

import cn.hutool.core.util.RandomUtil
import com.alibaba.fastjson2.JSONObject

object AndroidNotificationFactory {

    /**
     * 参数详解
     * https://developer.umeng.com/docs/67966/detail/68343#h1-u6D88u606Fu53D1u90014
     */
    private fun baseParameter(
        displayType: DisplayType,

        // 当display_type=notification时，标题、文本 必填
        title: String,
        text: String,

        // 当display_type=message时，custom 必填
        customMessage: CustomMessage?,

        // 公信 / 私信
        isPrivateMessage: Boolean,
    ): JSONObject {
        val jsonObject = JSONObject()
        jsonObject["appKey"] = "64b02374bd4b621232d129d3"
        jsonObject["timestamp"] = (System.currentTimeMillis() / 1000).toInt().toString()

        // 自定义数据
        val extraData = JSONObject()
        if (customMessage != null) {
            // 广播数据，没有这些
            extraData["fromUserId"] = customMessage.fromUserId
            extraData["fromUserNickName"] = customMessage.fromUserNickName
            extraData["fromUserIcon"] = customMessage.fromUserIcon
            extraData["type"] = customMessage.type
        }

        jsonObject["payload"] = JSONObject().apply {
            fluentPut("display_type", displayType.value)
            fluentPut("body", JSONObject().apply {
                // 当display_type=notification时，标题、文本 必填
                fluentPut("title", title)
                fluentPut("text", text)
                fluentPut("after_open", "go_app")

                // 当display_type=message时，custom 必填
                fluentPut("custom", extraData)
            })
            fluentPut("extra", extraData)
        }

        jsonObject["policy"] = JSONObject().apply {
            // 强烈建议开发者在发送任务类消息时填写这个字段，友盟服务端会根据这个字段对消息做去重避免重复发送
            // 同一个appkey下面的多个消息会根据out_biz_no去重，不同发送任务的out_biz_no需要保证不同，否则会出现后发消息被去重过滤的情况
            fluentPut("out_biz_no", "${System.currentTimeMillis()}${RandomUtil.randomInt(0, 1000000)}")
        }

        jsonObject["production_mode"] = "true"
        jsonObject["description"] = text

        jsonObject["mipush"] = "true"
        jsonObject["mi_activity"] = "com.lyl.byyourside.MainActivity"

        jsonObject["channel_properties"] = JSONObject().apply {
            fluentPut("channel_activity", "com.umeng.message.UmengOfflineMessageActivity")
            fluentPut("main_activity", "com.lyl.byyourside.MainActivity")
            if (isPrivateMessage) {
                fluentPut("xiaomi_channel_id", "")
                fluentPut("vivo_category", "1")
                fluentPut("oppo_channel_id", "service_reminder")
                fluentPut("huawei_channel_importance", "NORMAL")
                fluentPut("huawei_channel_category", "WORK")
            } else {
                fluentPut("xiaomi_channel_id", "")
                fluentPut("vivo_category", "0")
                fluentPut("oppo_channel_id", "upush_default")
                fluentPut("huawei_channel_importance", "LOW")
                fluentPut("huawei_channel_category", "MARKETING")
            }
        }

        return jsonObject;
    }

    /**
     * 给某个人发透传消息
     */
    fun createSingleAliasMessage(
        deviceAlias: String,
        deviceAliasType: String,
        title: String,
        text: String,
        customMessage: CustomMessage,

        ): String {
        val jsonObject = baseParameter(
            displayType = DisplayType.MESSAGE,
            title = title,
            text = text,
            customMessage = customMessage,
            isPrivateMessage = true,
        )

        jsonObject["type"] = "customizedcast" // 通过alias进行推送
        jsonObject["alias_type"] = deviceAliasType // 当type=customizedcast时,必填
        jsonObject["alias"] = deviceAlias // 当type=customizedcast时,选填

        return jsonObject.toJSONString()
    }

    /**
     * 给某个人发通知
     */
    fun createSingleAliasNotification(
        deviceAlias: String,
        deviceAliasType: String,
        title: String,
        text: String,
        customMessage: CustomMessage?,
    ): String {
        val jsonObject = baseParameter(
            displayType = DisplayType.NOTIFICATION,
            title = title,
            text = text,
            customMessage = customMessage,
            isPrivateMessage = true,
        )

        jsonObject["type"] = "customizedcast" // 通过alias进行推送
        jsonObject["alias_type"] = deviceAliasType // 当type=customizedcast时,必填
        jsonObject["alias"] = deviceAlias // 当type=customizedcast时,选填

        return jsonObject.toJSONString()
    }

    /**
     * 以某一组类型
     */
    fun createAliasNotification(
        aliasType: String,
        title: String,
        text: String,
    ): String {
        // 公信
        val jsonObject = baseParameter(
            displayType = DisplayType.NOTIFICATION,
            title = title,
            text = text,
            customMessage = null,
            isPrivateMessage = false,
        )

        jsonObject["type"] = "customizedcast" // 通过alias进行推送
        jsonObject["alias_type"] = aliasType // 当type=customizedcast时,必填

        return jsonObject.toJSONString()
    }

}


