package com.lyl.byyouside.controller.base

import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.User
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.RequestMapping

/**
 * API 的基类，所有 API 都继承这个类
 */
@RequestMapping("/api")
open class ApiBaseController {

    @Value("\${com.lyl.imageHost}")
    private val imageHost: String? = null

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
        return BaseCallBack(code, msg, Any())
    }

    //============================= 基础操作 ===========================================

    /**
     * 将用户信息返回给 客户端时，需要处理的一些逻辑
     */
    protected fun userAdapter(user: User): User {
        if (!MyUtils.isEmpty(user.icon)) {
            // 设置头像
            user.icon = imageHost + user.icon
        }
        return user
    }

    /**
     * 账号被封的天数
     */
    protected fun userCloseDay(user: User): Long {
        if (user.closeDate != null && user.closeDate!! > 0) {
            return MyUtils.formatTimestampToDay(user.closeDate!!)
        }
        return 0
    }
}
