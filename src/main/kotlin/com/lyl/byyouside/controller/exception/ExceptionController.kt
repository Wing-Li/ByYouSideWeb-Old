package com.lyl.byyouside.controller.exception

import com.lyl.byyouside.model.base.BaseCallBack
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

/**
 * https://blog.csdn.net/weixin_45486011/article/details/124123166
 * 返回结果及接口异常处理
 */
@RestControllerAdvice
class ExceptionController {
    companion object {
        private val log: Logger = LoggerFactory.getLogger(ExceptionController::class.java)
    }

    /**
     * 默认全局异常处理。
     *
     * @param e the e
     * @return ResultData
     */
    @ExceptionHandler(Exception::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public fun exception(e: Exception): BaseCallBack<String> {

        log.error("全局异常信息 ex={}", e.message, e);

        return BaseCallBack(
            code = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            message = e.message ?: "",
            ""
        )
    }
}