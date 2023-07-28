package com.lyl.byyouside.push

enum class DisplayType {

    /**
     * 通知:消息送达到用户设备后，由友盟SDK接管处理并在通知栏上显示通知内容。
     */
    NOTIFICATION {
        override val value: String
            get() = "notification"
    },

    /**
     * 消息:消息送达到用户设备后，消息内容透传给应用自身进行解析处理。
     */
    MESSAGE {
        override val value: String
            get() = "message"
    };

    ///
    abstract val value: String
}