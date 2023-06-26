package com.lyl.byyouside.controller.filter

import com.fasterxml.jackson.databind.ObjectMapper
import com.lyl.byyouside.config.Config
import com.lyl.byyouside.controller.exception.ExceptionController
import com.lyl.byyouside.utils.AESHelper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.MethodParameter
import org.springframework.http.MediaType
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice

@RestControllerAdvice
class MyResponseBodyAdvice() : ResponseBodyAdvice<Any> {

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(ExceptionController::class.java)
    }

    @Autowired
    private lateinit var mConfig: Config

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

        // dev 环境不加密
        if ("dev" != mConfig.active) {
            try {
                val objectMapper = ObjectMapper()
                // 对所有的 api 数据都加密
                val result = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(body)
                logger.info("加密返回数据：$result")
                return AESHelper.encrypt(result)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        return body
    }
}