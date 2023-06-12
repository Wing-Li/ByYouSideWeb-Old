package com.lyl.byyouside.controller.filter

import com.fasterxml.jackson.databind.ObjectMapper
import com.lyl.byyouside.controller.exception.ExceptionController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.utils.DESHelper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.PropertySource
import org.springframework.core.MethodParameter
import org.springframework.http.MediaType
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice

@PropertySource(value = ["classpath:application.properties"])
@RestControllerAdvice
class MyResponseBodyAdvice() : ResponseBodyAdvice<Any> {

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(ExceptionController::class.java)
    }

    @Value("\${spring.profiles.active}")
    private val active: String? = null

    override fun supports(returnType: MethodParameter, converterType: Class<out HttpMessageConverter<*>>): Boolean {
        return true
    }

    override fun beforeBodyWrite(
        body: Any?,
        returnType: MethodParameter,
        selectedContentType: MediaType,
        selectedConverterType: Class<out HttpMessageConverter<*>>,
        request: ServerHttpRequest,
        response: ServerHttpResponse
    ): Any? {

        //返回类型是否已经封装 - 全局异常
        if (body is BaseCallBack<*>) {
            return body
        }

        // dev 环境不加密
        if ("dev" != active) {
            try {
                val objectMapper = ObjectMapper()
                // 对所有的 api 数据都加密
                val result = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(body)
                logger.info("加密返回数据：$result")
                return DESHelper.encrypt(result)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        return body
    }
}