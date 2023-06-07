package com.lyl.byyouside.controller.chat

import com.lyl.byyouside.utils.http.CallBackUtil
import com.lyl.byyouside.utils.http.OkhttpUtil
import okhttp3.Call
import java.lang.Exception

/**
 * IM 接口封装
 */
class ChatApi {

    /**
     * 公共Header生成
     */
    private fun getHeader(): HashMap<String, String> {
        val headerMap = HashMap<String, String>()


        return headerMap
    }

    /**
     * 创建账号
     */
    public fun createUser() {
        val url = "https://api.netease.im/nimserver/user/create.action";
        val headerMap = getHeader()
        val paramsMap = HashMap<String, String>()

        OkhttpUtil.okHttpPost(url, paramsMap, headerMap, object : CallBackUtil.CallBackString() {
            override fun onFailure(call: Call?, e: Exception?) {
            }

            override fun onResponse(response: String?) {
            }

        })
    }

}