package com.lyl.byyouside.controller.chat

import cn.hutool.core.util.RandomUtil
import cn.hutool.http.HttpRequest
import cn.hutool.json.JSONUtil
import com.lyl.byyouside.config.Config
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import java.util.*

@Component
class ChatYxImApi {


    @Autowired
    private lateinit var mConfig: Config

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

    /**
     * 创建用户
     */
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
        // 用户已存在，则更新用户信息
        val isUserExist = getUserInfo(listOf(accid))
        if (isUserExist) {
            val isUpdateSuccess = updateImUserInfo(accid, name, icon, email, gender, sign, birth)
            return if (isUpdateSuccess) "" else "用户已存在，但信息更新失败";
        }

        val url = "https://api.netease.im/nimserver/user/create.action"
        val headerMap = buildBaseHeader()

        // 设置请求的参数， 全部转为 String类型，包括 Boolean
        val paramMap = HashMap<String, Any>()
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
        return if ("200" == jsonObject["code"] || 200 == jsonObject["code"]) {
            ""
        } else {
            jsonObject["desc"]?.toString() ?: "注册IM出错"
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

    /**
     * 更新用户信息
     */
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
        val paramMap = HashMap<String, Any>()
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
        return "200" == jsonObject["code"] || 200 == jsonObject["code"]
    }

    /**
     * 获取用户信息
     */
    fun getUserInfo(
        accids: List<String>
    ): Boolean {
        val url = "https://api.netease.im/nimserver/user/getUinfos.action"
        val headerMap = buildBaseHeader()

        val jsonArray = JSONUtil.createArray()
        accids.forEach { jsonArray.put(it) }
        val toJsonStr = JSONUtil.toJsonStr(jsonArray) // 这里需要是 json

        // 设置请求的参数， 全部转为 String类型，包括 Boolean
        val paramMap = HashMap<String, Any>()
        paramMap.put("accids", toJsonStr)

        val body = HttpRequest.post(url)
            .headerMap(headerMap, false)
            .form(paramMap)
            .timeout(15 * 1000)
            .execute()
            .body()

        // {"uinfos":[{"valid":true,"gender":0,"name":"Wing_Li","accid":"dev_bnzy_10010","mute":false,"email":"609101522@qq.com"}],"code":200}
        val jsonObject = JSONUtil.parseObj(body)
        return "200" == jsonObject["code"] || 200 == jsonObject["code"]
    }

    fun getUserId(account: String?): Long {
        return account?.replace("bnzy_", "")?.toLong() ?: -1
    }

    fun getAccountId(userId: Long): String {
        return "${if ("dev" == mConfig.active) "dev_" else "prod_"}bnzy_$userId";
    }

    fun getAccountToken(userId: Long): String {
        return "${getAccountId(userId)}${getAccountId(userId)}";
    }
}