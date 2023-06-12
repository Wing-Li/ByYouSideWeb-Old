package com.lyl.byyouside.controller.filter

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.utils.JwtUtils
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor
import java.util.*

class UserTokenInterceptor : HandlerInterceptor {
    companion object {
        /**
         * 请求头
         */
        private const val HEADER_AUTH = "Authorization"

        /**
         * 安全的url，不需要令牌
         */
        private val SAFE_URL_LIST = Arrays.asList(
            "/api/user/register",
            "/api/user/login"
        )
    }

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        response.contentType = "application/json; charset=utf-8"

        val url = request.requestURI.substring(request.contextPath.length)
        // 登录和注册等请求不需要令牌
        if (SAFE_URL_LIST.contains(url)) {
            return true
        }

        // 从请求头里面读取token
        val token = request.getHeader(HEADER_AUTH) ?: throw RuntimeException("请求失败，Token为空")

        // 验证令牌
        val verifyToken = JwtUtils.verifyToken(token)
        if (verifyToken) {
            throw RuntimeException("用户信息已过期，请重新登陆")
        }

        // 解析令牌
        val headerMap = JwtUtils.parseToken(token)
        val userId = headerMap["userId"].toString().toLong()
        val expireTime = headerMap["expireTime"].toString().toLong() // 验证过期时间

        ContextHolder.setUserId(userId)

        return true
    }

    override fun afterCompletion(request: HttpServletRequest, response: HttpServletResponse, handler: Any, ex: Exception?) {
        ContextHolder.shutdown()
    }

}