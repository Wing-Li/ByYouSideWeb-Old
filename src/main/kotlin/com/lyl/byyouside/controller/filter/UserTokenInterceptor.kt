package com.lyl.byyouside.controller.filter

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.utils.JwtUtils
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.servlet.HandlerInterceptor
import java.util.*

class UserTokenInterceptor : HandlerInterceptor {

    @Autowired
    private lateinit var userRepository: UserInfoRepository

    companion object {
        /**
         * 请求头
         */
        private const val HEADER_AUTH = "Authorization"

        /**
         * 安全的url，不需要令牌
         */
        private val SAFE_URL_LIST = listOf(
            "/favicon.ico",
            "/error",

            "/api/user/register",
            "/api/user/login",
            "/api/user/resetPassSendEmailCode",
            "/api/user/resetPassVerifyCode",
            "/api/user/cancelDestroy",

            "/api/config/h5",
            "/api/config/app",

            "/api/version/getLast",
        )
    }

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        response.contentType = "application/json; charset=utf-8"

        val url = request.requestURI.substring(request.contextPath.length)
        // 登录和注册等请求不需要令牌
        if (SAFE_URL_LIST.contains(url) || url.startsWith("/images/user/")) {
            return true
        }

        // 从请求头里面读取token
        val token = request.getHeader(HEADER_AUTH) ?: throw RuntimeException("请求失败，Token异常，请重新登录")

        // 验证令牌
        val verifyToken = JwtUtils.verifyToken(token)
        if (!verifyToken) {
            throw RuntimeException("用户信息已过期，请重新登陆")
        }

        // 解析令牌
        val headerMap = JwtUtils.parseToken(token)
        val userId = headerMap["userId"].toString().toLong()
        // val expireTime = headerMap["expireTime"].toString().toLong() // 验证过期时间

        val userCheck = userCheck(userId)
        if (userCheck?.isNotEmpty() == true) {
            throw RuntimeException(userCheck)
        }

        ContextHolder.userId = userId

        return true
    }

    override fun afterCompletion(request: HttpServletRequest, response: HttpServletResponse, handler: Any, ex: Exception?) {
        ContextHolder.shutdown()
    }

    /**
     * 检验用户是否正常
     */
    private fun userCheck(userId: Long): String? {
        val userInfo = userRepository.findById(userId)
        if (!userInfo.isPresent) {
            return "用户信息异常，请重新登陆"
        }
        val user = userInfo.get()
        if (user.isDestroy == true) { // 用户注销
            return if (user.destroyDate != null && (System.currentTimeMillis() - (user.destroyDate?.time ?: 0)) > 14 * 24 * 60 * 60 * 1000) {
                StatusCode.ERROR_13003_TEXT // "您的账户已注销!"
            } else {
                StatusCode.ERROR_13002_TEXT // "您的账户已申请注销，重新登录将会取消申请!（可以重复申请）"
            }
        }
        if ((user.closeDate ?: 0) > 0) { // 您的账户被限制登录(天)：5
            return StatusCode.ERROR_13001_TEXT + user.closeDate
        }

        return null
    }

}