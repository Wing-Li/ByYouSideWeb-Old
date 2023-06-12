package com.lyl.byyouside.utils

import cn.hutool.jwt.JWTUtil

/**
 * https://doc.hutool.cn/pages/JWTUtil/#%E4%BB%8B%E7%BB%8D
 */
object JwtUtils {
    /**
     * Token密码 不少于32位
     */
    private const val SECRET = "F8:4B:F8:F3:5A:E8:3F:47:31:C5:AE:3F:7C:44:AA:1D:CB:D7:A7:BA:55:F2:4A:4D:CF:18:69:36:F4:00:0B:DE"

    /**
     * Token前缀
     */
    private const val TOKEN_PREFIX = "Bearer "

    /**
     * Token过期时间
     */
    private const val EXPIRE_SECONDS = 1000 * 60 * 60 * 24 * 365L

    /**
     * 生成Token
     */
    fun createToken(userId: Long): String {
        val headerMap: HashMap<String?, Any?> = object : HashMap<String?, Any?>() {
            private val serialVersionUID = 1L

            init {
                put("userId", userId)
                put("expireTime", System.currentTimeMillis() + EXPIRE_SECONDS)
            }
        }
        val payloadMap: Map<String, Any> = HashMap()
        val token = JWTUtil.createToken(headerMap, payloadMap, SECRET.toByteArray())
        return TOKEN_PREFIX + token
    }

    /**
     * 验证Token
     */
    fun verifyToken(token: String?): Boolean {
        if (token == null) {
            throw RuntimeException("Token为空")
        }

        return try {
            JWTUtil.verify(token.replace(TOKEN_PREFIX, ""), SECRET.toByteArray())
        } catch (e: Exception) {
            throw RuntimeException("Token解析异常")
        }
    }

    /**
     * 解析Token
     */
    fun parseToken(token: String?): Map<String, Any> {
        if (token == null) {
            throw RuntimeException("Token为空")
        }

        return try {
            val map: MutableMap<String, Any> = HashMap()

            val t = token.replace(TOKEN_PREFIX, "");
            val jwt = JWTUtil.parseToken(t)

            val headerJsonObject = jwt.headers
            if (!headerJsonObject.containsKey("userId")) {
                throw RuntimeException("Token数据异常，请重新登录")
            }

            map["userId"] = headerJsonObject.getLong("userId")
            map["expireTime"]  = headerJsonObject.getLong("expireTime")

            map
        } catch (e: Exception) {
            throw RuntimeException("Token解析异常")
        }
    }
}