package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.User
import com.lyl.byyouside.model.user.UserRepository
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
class UserController @Autowired constructor(
    private val userRepository: UserRepository
) : ApiBaseController() {

    /**
     * 创建用户
     *
     * @param userName 账户名
     * @param password 密码
     * @param nickName 昵称
     * @param gender 性别
     * @return 返回用户信息
     */
    @PostMapping(value = ["/registerUser"])
    fun registerUser(
        userName: String,
        password: String,
        nickName: String,
        gender: Int
    ): BaseCallBack<Any> {
        // 检查 用户名、密码、昵称、性别 是否符合规范
        if (MyUtils.isEmpty(userName) || userName.length > 32 || userName.length < 2) {
            return failCallBack(StatusCode.USER_NAME_10001, StatusCode.USER_NAME_10001_TEXT)
        }
        if (MyUtils.isEmpty(password) || password.length > 32 || password.length < 8) {
            return failCallBack(StatusCode.USER_NAME_10002, StatusCode.USER_NAME_10002_TEXT)
        }
        if (MyUtils.isEmpty(nickName) || nickName.length > 16) {
            return failCallBack(StatusCode.USER_NAME_10003, StatusCode.USER_NAME_10003_TEXT)
        }

        // 用户名 不能重复
        val checkUser = userRepository.findByUserName(userName)
        if (checkUser == null) {
            return failCallBack(StatusCode.USER_NAME_10004, StatusCode.USER_NAME_10004_TEXT)
        }

        return try {
            val user = User(
                userName = userName,
                password = password,
                nickName = nickName,
                gender = gender
            )
            val save: User = userRepository.save(user)
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
        icon: String?,
        introduction: String?,
        birthday: String?,
        phone: String?,
        email: String?,
        province: String?,
        city: String?
    ): BaseCallBack<Any> {
        val user: User = userRepository.findById(userId).get()

        nickName?.let { user.nickName = it }
        icon?.let { user.icon = icon }
        introduction?.let { user.introduction = introduction }
        birthday?.let { user.birthday = birthday }
        phone?.let { user.phone = phone }
        email?.let { user.email = email }
        province?.let { user.province = province }
        city?.let { user.city = city }

        userRepository.save(user)
        return successCallBack(userAdapter(user))
    }

    /**
     * 登录
     *
     * @param userName 用户号 或  手机号
     * @param password 密码
     * @return 用户信息
     */
    @PostMapping(value = ["/login"])
    fun login(userName: String?, password: String): BaseCallBack<Any> {
        if (!MyUtils.isEmpty(userName) && !MyUtils.isEmpty(password)) {
            val user = userRepository.findByUserNameOrPhone(userName, userName)
            return if (user != null) {
                val closeDay = userCloseDay(user)
                if (closeDay > 0) {
                    // 账号被封
                    failCallBack(StatusCode.USER_NAME_13001, StatusCode.USER_NAME_13001_TEXT + closeDay)
                } else if (password == user.password) {
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
            val user: User = user.get()
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