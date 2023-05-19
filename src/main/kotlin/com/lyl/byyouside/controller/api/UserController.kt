package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
class UserController @Autowired constructor(
    private val userRepository: UserInfoRepository
) : ApiBaseController() {

    /**
     * 创建用户
     */
    @PostMapping(value = ["/registerUser"])
    fun registerUser(
        userName: String,
        passWord: String,
        email: String
    ): BaseCallBack<Any> {
        if (MyUtils.isEmpty(userName) || !userName.matches(Regex(Config.REGEX_USERNAME))) {
            return failCallBack(StatusCode.USER_NAME_10001, StatusCode.USER_NAME_10001_TEXT)
        }
        if (MyUtils.isEmpty(passWord) || passWord.length > 32 || passWord.length < 6) {
            return failCallBack(StatusCode.USER_NAME_10002, StatusCode.USER_NAME_10002_TEXT)
        }
        if (MyUtils.isEmpty(email) || !email.matches(Regex(Config.REGEX_EMAIL))) {
            return failCallBack(StatusCode.USER_NAME_10005, StatusCode.USER_NAME_10005_TEXT)
        }

        // 用户名 不能重复
        val existsUser = userRepository.existsByUserName(userName)
        if (existsUser) {
            return failCallBack(StatusCode.USER_NAME_10004, StatusCode.USER_NAME_10004_TEXT)
        }

        return try {
            val user = UserInfo(
                userName = userName,
                password = passWord,
                email = email,
            )
            val save: UserInfo = userRepository.save(user)
            successCallBack(userAdapter(save))
        } catch (e: Exception) {
            failCallBack(StatusCode.USER_NAME_10000, StatusCode.USER_NAME_10000_TEXT)
        }
    }

    /**
     * 更新数据库字段，只要某个字段传了值，就更新数据库
     */
    @PostMapping(value = ["/updateUser"])
    fun updateUser(
        userId: Long,
        nickName: String?,
        gender: Int?,
        icon: String?,
        introduction: String?,
        birthday: String?,
        phone: String?,
        email: String?,
        province: String?,
        city: String?
    ): BaseCallBack<Any> {
        val user: UserInfo = userRepository.findById(userId).get()

        if (MyUtils.isEmpty(nickName) || nickName?.matches(Regex(Config.REGEX_NICAKNAME)) == false) {
            return failCallBack(StatusCode.USER_NAME_10003, StatusCode.USER_NAME_10003_TEXT)
        }

        nickName?.let { user.nickName = it }
        gender?.let { user.gender = it }
        icon?.let { user.icon = it }
        introduction?.let { user.introduction = it }
        birthday?.let { user.birthday = it }
        phone?.let { user.phone = it }
        email?.let { user.email = it }
        province?.let { user.province = it }
        city?.let { user.city = it }

        userRepository.save(user)
        return successCallBack(userAdapter(user))
    }

    /**
     * 登录
     *
     * @param userName 用户号 或  手机号
     * @param passWord 密码
     * @return 用户信息
     */
    @PostMapping(value = ["/login"])
    fun login(
        userName: String,
        passWord: String
    ): BaseCallBack<Any> {
        if (!MyUtils.isEmpty(userName) && !MyUtils.isEmpty(passWord)) {
            val user = userRepository.findByUserNameOrPhone(userName, userName)
            return if (user != null) {
                val closeDay = userCloseDay(user)
                if (closeDay > 0) {
                    // 账号被封
                    failCallBack(StatusCode.USER_NAME_13001, StatusCode.USER_NAME_13001_TEXT + closeDay)
                } else if (passWord == user.password) {
                    // 登录成功
                    successCallBack(userAdapter(user))
                } else {
                    // 密码不对
                    failCallBack(StatusCode.USER_NAME_11002, StatusCode.USER_NAME_11002_TEXT)
                }
            } else {
                failCallBack(StatusCode.USER_NAME_11001, StatusCode.USER_NAME_11001_TEXT)
            }
        }
        return failCallBack(StatusCode.USER_NAME_11003, StatusCode.USER_NAME_11003_TEXT)
    }

    /**
     * 获取所有用户
     */
    @PostMapping("/getAllUser")
    fun getAllUser(): BaseCallBack<Any> {
        return successCallBack(userRepository.findAll())
    }

    /**
     * 获取用户信息
     */
    @PostMapping("/getUser")
    fun getUser(userId: Long): BaseCallBack<Any> {
        val user = userRepository.findById(userId)
        return if (user.isPresent) {
            val user: UserInfo = user.get()
            val closeDay = userCloseDay(user)
            if (closeDay > 0) {
                // 账号被封
                failCallBack(StatusCode.USER_NAME_13001, StatusCode.USER_NAME_13001_TEXT + closeDay)
            } else {
                // 获取成功

//                // 如果当前是会员，检查会员是否过期
//                if (user.getVipGrade() >= 2) {
//                    val vipLimitDate: Long = user.getVipLimitDate().getTime()
//                    val nowTime = Date().time
//                    // 过期时间 小于 当前时间，将会员等级设计会普通
//                    if (vipLimitDate < nowTime) {
//                        user.setVipGrade(1)
//                        user = userRepository.save(user)
//                    }
//                }

                successCallBack(userAdapter(user))
            }
        } else {
            failCallBack(StatusCode.USER_NAME_11001, StatusCode.USER_NAME_11001_TEXT)
        }
    }
}