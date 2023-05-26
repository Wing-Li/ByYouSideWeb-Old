package com.lyl.byyouside.controller.base

import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.RequestMapping

/**
 * API 的基类，所有 API 都继承这个类
 */
@RequestMapping("/api")
open class ApiBaseController {

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
        if (user == null) {
            return failCallBack(StatusCode.ERROR_16001, StatusCode.ERROR_16001_TEXT)
        }
        if ((user.closeDate ?: 0) > 0) {
            return failCallBack(StatusCode.ERROR_13001, StatusCode.ERROR_13001_TEXT + user.closeDate)
        }
        return null;
    }

}
