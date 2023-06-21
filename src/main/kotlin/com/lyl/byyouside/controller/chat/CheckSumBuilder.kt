package com.lyl.byyouside.controller.chat

import java.security.MessageDigest;

object CheckSumBuilder {
    // 计算并获取CheckSum
    fun getCheckSum(appSecret: String, nonce: String, curTime: String): String? {
        return encode("sha1", appSecret + nonce + curTime)
    }

    // 计算并获取md5值
    fun getMD5(requestBody: String?): String? {
        return encode("md5", requestBody)
    }

    private fun encode(algorithm: String, value: String?): String? {
        return if (value == null) {
            null
        } else try {
            val messageDigest: MessageDigest = MessageDigest.getInstance(algorithm)
            messageDigest.update(value.toByteArray())
            getFormattedText(messageDigest.digest())
        } catch (e: Exception) {
            throw RuntimeException(e)
        }
    }

    private fun getFormattedText(bytes: ByteArray): String {
        val len = bytes.size
        val buf = StringBuilder(len * 2)
        for (j in 0 until len) {
            buf.append(HEX_DIGITS[bytes[j].toInt() shr 4 and 0x0f])
            buf.append(HEX_DIGITS[bytes[j].toInt() and 0x0f])
        }
        return buf.toString()
    }

    private val HEX_DIGITS = charArrayOf(
        '0', '1', '2', '3', '4', '5',
        '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
    )
}