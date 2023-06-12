package com.lyl.byyouside.utils

import cn.hutool.jwt.JWTUtil

/**
 * @author llh
 */
object JwtUtils {
    /**
     * 令牌密码 不少于32位
     */
    private const val SECRET = "F8:4B:F8:F3:5A:E8:3F:47:31:C5:AE:3F:7C:44:AA:1D:CB:D7:A7:BA:55:F2:4A:4D:CF:18:69:36:F4:00:0B:DE"

    /**
     * 令牌前缀
     */
    private const val TOKEN_PREFIX = "Bearer "

    /**
     * 令牌过期时间
     */
    private const val EXPIRE_SECONDS = 1000 * 60 * 60 * 24 * 365L

    /**
     * 生成令牌
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
     * 验证令牌
     */
    fun verifyToken(token: String?): Boolean {
        if (token == null) {
            throw RuntimeException("令牌为空")
        }

        return try {
            JWTUtil.verify(token, SECRET.toByteArray())
        } catch (e: Exception) {
            throw RuntimeException("令牌解析异常")
        }
    }

    /**
     * 解析令牌
     */
    fun parseToken(token: String?): Map<String, Any> {
        if (token == null) {
            throw RuntimeException("令牌为空")
        }

        return try {
            val jwt = JWTUtil.parseToken(token)
            val userId = jwt.getHeader("userId") as String
            val expireTime = jwt.getHeader("expireTime") as Long

            val map: MutableMap<String, Any> = HashMap()
            map["userId"] = userId
            map["expireTime"] = expireTime

            map
        } catch (e: Exception) {
            throw RuntimeException("令牌解析异常")
        }
    }
}