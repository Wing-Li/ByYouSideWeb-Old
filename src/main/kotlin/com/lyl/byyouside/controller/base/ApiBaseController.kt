package com.lyl.byyouside.controller.base

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfo
import org.springframework.beans.propertyeditors.CustomDateEditor
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.WebDataBinder
import org.springframework.web.bind.annotation.InitBinder
import org.springframework.web.bind.annotation.RequestMapping
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.*


/**
 * API 的基类，所有 API 都继承这个类
 */
@RequestMapping("/api")
@Transactional
open class ApiBaseController {

    /**
     * 分页请求，基础配置
     */
    fun getBasePageRequest(page: Int?, size: Int?): PageRequest {
        // page 从 1 开始
        return PageRequest.of((page ?: 1) - 1, size ?: 20)
    }

    /**
     * 分页请求，结果返回
     */
    fun <T> successListCallBack(page: Page<T>): BaseCallBack<MutableList<T>> {
        val callBack = BaseCallBack(200, "请求成功", page.content)
        callBack.totalPages = page.totalPages
        callBack.currentPage = page.pageable.pageNumber + 1 // 页数从1开始，代码是从0开始
        callBack.totalElements = page.totalElements
        callBack.size = page.size
        callBack.isListLast = page.isLast

        return callBack
    }

    /**
     * 请求数据成功
     */
    fun successCallBack(t: Any): BaseCallBack<Any> {
        return BaseCallBack(200, "请求成功", t)
    }

    /**
     * 请求失败时返回的数据
     *
     * @param code 失败 code
     * @param msg  失败信息
     * @return
     */
    fun failCallBack(code: Int, msg: String): BaseCallBack<Any> {
        return BaseCallBack(code, msg, null)
    }

    @InitBinder
    fun initBinder(binder: WebDataBinder) {
        // 只能支持 三位小数的 毫秒，不能支持6位小数的
        val dateFormat: DateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS")
        dateFormat.isLenient = true
        binder.registerCustomEditor(Date::class.java, CustomDateEditor(dateFormat, true))
    }

    //============================= 基础操作 ===========================================

    /**
     * 将用户信息返回给 客户端时，需要处理的一些逻辑
     */
    protected fun userAdapter(user: UserInfo): UserInfo {
        return user
    }

    /**
     * 获取用户之后的权鉴
     */
    protected fun userAuth(user: UserInfo?): BaseCallBack<Any>? {
        if (user == null) { // 用户信息异常，请重新登陆
            return failCallBack(StatusCode.ERROR_16001, StatusCode.ERROR_16001_TEXT)
        }
        if (user.isDestroy == true) { // 用户注销
            return if (user.destroyDate != null && (System.currentTimeMillis() - (user.destroyDate?.time ?: 0)) > 14 * 24 * 60 * 60 * 1000) {
                failCallBack(StatusCode.ERROR_13003, StatusCode.ERROR_13003_TEXT) // 您的账户已注销！
            } else {
                failCallBack(StatusCode.ERROR_13002, StatusCode.ERROR_13002_TEXT) // 您的账户已申请注销，重新登录将会取消申请!（可以重复申请）
            }
        }
        if ((user.closeDate ?: 0) > 0) { // 您的账户被限制登录(天)：5
            return failCallBack(StatusCode.ERROR_13001, StatusCode.ERROR_13001_TEXT + user.closeDate)
        }
        return null;
    }

}
