package com.lyl.byyouside.utils

import java.text.SimpleDateFormat
import java.util.*

object MyUtils {
    /**
     * 字符串是否为空
     */
    fun isEmpty(str: CharSequence?): Boolean {
        return str.isNullOrEmpty()
    }

    /**
     * 时间戳转换成日期格式字符串
     */
    fun formatDate(timeStamp: Long): String {
        // //这个是你要转成后的时间的格式
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
        return sdf.format(Date(timeStamp))
    }

    /**
     * 格式化时间戳为 天数
     *
     * @param timestamp 时间戳
     */
    fun formatTimestampToDay(timestamp: Long): Long {
        return (System.currentTimeMillis() - timestamp) / 1000 / 60 / 60 / 24
    }
}