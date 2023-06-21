package com.lyl.byyouside.controller.chat

import cn.hutool.core.util.RandomUtil
import cn.hutool.http.HttpRequest
import cn.hutool.json.JSONUtil
import java.util.*

class ChatYxImApi {

    private fun buildBaseHeader(): HashMap<String, String> {
        // 伴你左右-Dev 环境
        val appKey = "d80f2c84a194588e809e65b9fbde2d91"
        val appSecret = "6e6d7cdd34ec"
        val nonce = RandomUtil.randomNumbers(64)
        val curTime: String = java.lang.String.valueOf(Date().time / 1000L)
        val checkSum: String? = CheckSumBuilder.getCheckSum(appSecret, nonce, curTime) //参考 计算CheckSum的java代码

        // 设置请求的header
        val headerMap = HashMap<String, String>();
        headerMap.put("AppKey", appKey)
        headerMap.put("Nonce", nonce)
        headerMap.put("CurTime", curTime)
        headerMap.put("CheckSum", checkSum ?: "")
        headerMap.put("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
        return headerMap
    }

    fun createImUser(
        accid: String,
        token: String, // 密码
        name: String,
        icon: String,
        email: String,
        gender: Int,
        sign: String?,
        birth: String?,
    ): String {
        val url = "https://api.netease.im/nimserver/user/create.action"
        val headerMap = buildBaseHeader()

        // 设置请求的参数， 全部转为 String类型，包括 Boolean
        val paramMap = HashMap<String, Any>();
        paramMap.put("accid", accid)
        paramMap.put("token", token)
        paramMap.put("name", name)
        paramMap.put("icon", icon)
        paramMap.put("email", email)
        paramMap.put("gender", gender.toString())
        sign?.let { paramMap.put("sign", it) }
        birth?.let { paramMap.put("birth", it) }

        val body = HttpRequest.post(url)
            .headerMap(headerMap, false)
            .form(paramMap)
            .timeout(15 * 1000)
            .execute()
            .body()

        val jsonObject = JSONUtil.parseObj(body)
        if ("200" == jsonObject.get("code")) {
            return ""
        } else {
            return jsonObject.get("desc")?.toString() ?: "注册IM出错"
        }

//        注册成功返回示例
//        "Content-Type": "application/json; charset=utf-8"
//        {
//            "code": 200,
//            "info": {
//                "name": "zhangsan",
//                "accid": "123456",
//                "token": "abcdef"
//            }
//        }
//        失败
//        {
//            "code": 414,
//            "desc": "already register"
//        }

        // 打印执行结果
    }

    fun updateImUserInfo(
        accid: String,
        name: String?,
        icon: String?,
        email: String?,
        gender: Int?,
        sign: String?,
        birth: String?,
    ): Boolean {
        val url = "https://api.netease.im/nimserver/user/updateUinfo.action"
        val headerMap = buildBaseHeader()

        // 设置请求的参数， 全部转为 String类型，包括 Boolean
        val paramMap = HashMap<String, Any>();
        paramMap.put("accid", accid)
        name?.let { paramMap.put("name", it) }
        icon?.let { paramMap.put("icon", it) }
        email?.let { paramMap.put("email", it) }
        gender?.let { paramMap.put("gender", it.toString()) }
        sign?.let { paramMap.put("sign", it) }
        birth?.let { paramMap.put("birth", it) }

        val body = HttpRequest.post(url)
            .headerMap(headerMap, false)
            .form(paramMap)
            .timeout(15 * 1000)
            .execute()
            .body()

        val jsonObject = JSONUtil.parseObj(body)
        return "200" == jsonObject["code"]
    }

}