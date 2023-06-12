package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import java.util.*
import kotlin.jvm.optionals.getOrNull

@RestController
class UserController @Autowired constructor(
    private val userRepository: UserInfoRepository
) : ApiBaseController() {

    /**
     * 创建用户
     */
    @PostMapping(value = ["/user/register"])
    fun registerUser(
        userName: String,
        passWord: String,
        email: String
    ): BaseCallBack<Any> {
        if (MyUtils.isEmpty(userName) || !userName.matches(Regex(Config.REGEX_USERNAME))) {
            return failCallBack(StatusCode.ERROR_10001, StatusCode.ERROR_10001_TEXT)
        }
        if (MyUtils.isEmpty(passWord) || passWord.length > 32 || passWord.length < 6) {
            return failCallBack(StatusCode.ERROR_10002, StatusCode.ERROR_10002_TEXT)
        }
        if (MyUtils.isEmpty(email) || !email.matches(Regex(Config.REGEX_EMAIL))) {
            return failCallBack(StatusCode.ERROR_10005, StatusCode.ERROR_10005_TEXT)
        }

        val passwordEncoder: PasswordEncoder = BCryptPasswordEncoder()
        val encodedPassword: String = passwordEncoder.encode(passWord)

        // 用户名 不能重复
        val existsUser = userRepository.existsByUserName(userName)
        if (existsUser) {
            return failCallBack(StatusCode.ERROR_10004, StatusCode.ERROR_10004_TEXT)
        }

        return try {
            val user = UserInfo(
                userName = userName,
                password = encodedPassword,
                email = email,
            )
            val save: UserInfo = userRepository.save(user)
            successCallBack(userAdapter(save))
        } catch (e: Exception) {
            failCallBack(StatusCode.ERROR_10000, StatusCode.ERROR_10000_TEXT)
        }
    }

    /**
     * 更新数据库字段，只要某个字段传了值，就更新数据库
     */
    @PostMapping(value = ["/user/update"])
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
        val user = userRepository.findById(userId).getOrNull()
        userAuth(user)?.let { return it }

        user?.let {
            if (!MyUtils.isEmpty(nickName)) {
                if (nickName?.matches(Regex(Config.REGEX_NICAKNAME)) == false) {
                    return failCallBack(StatusCode.ERROR_10003, StatusCode.ERROR_10003_TEXT)
                } else {
                    nickName?.let { user.nickName = it }
                }
            }

            if (!MyUtils.isEmpty(introduction)) {
                if ((introduction?.length ?: 0) > 200) {
                    return failCallBack(StatusCode.ERROR_10006, StatusCode.ERROR_10006_TEXT)
                } else {
                    introduction?.let { user.introduction = it }
                }
            }

            if (!MyUtils.isEmpty(email)) {
                if (email?.matches(Regex(Config.REGEX_EMAIL)) == false) {
                    return failCallBack(StatusCode.ERROR_10005, StatusCode.ERROR_10005_TEXT)
                } else {
                    email?.let { user.email = it }
                }
            }

            gender?.let { user.gender = it }
            icon?.let { user.icon = it }
            birthday?.let { user.birthday = it }
            phone?.let { user.phone = it }
            province?.let { user.province = it }
            city?.let { user.city = it }

            val save = userRepository.save(user)
            return successCallBack(userAdapter(save))
        }

        return successCallBack("")
    }

    /**
     * 登录
     *
     * @param userName 用户号 或  手机号
     * @param passWord 密码
     * @return 用户信息
     */
    @PostMapping(value = ["/user/login"])
    fun login(
        userName: String,
        passWord: String
    ): BaseCallBack<Any> {
        if (MyUtils.isEmpty(userName) || MyUtils.isEmpty(passWord)) {
            return failCallBack(StatusCode.ERROR_11003, StatusCode.ERROR_11003_TEXT)
        }

        val user = userRepository.findByUserNameOrPhone(userName, userName)
        userAuth(user)?.let { return it }

        if (user == null) {
            return failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }

        val passwordEncoder: PasswordEncoder = BCryptPasswordEncoder()
        val isResult: Boolean = passwordEncoder.matches(passWord, user.password)
        return if (isResult) {
            // 登录成功
            successCallBack(userAdapter(user))
        } else {
            // 密码不对
            failCallBack(StatusCode.ERROR_11002, StatusCode.ERROR_11002_TEXT)
        }

    }

    /**
     * 获取所有用户
     */
    @PostMapping("/user/getAll")
    fun getAllUser(): BaseCallBack<Any> {
        return successCallBack(userRepository.findAll())
    }

    /**
     * 获取用户信息
     */
    @PostMapping("/user/getUser")
    fun getUser(userId: Long): BaseCallBack<Any> {
        val userDB = userRepository.findById(userId)

        return if (userDB.isPresent) {
            val user: UserInfo = userDB.get()
            userAuth(user)?.let { return it }

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
        } else {
            failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }
    }

    /**
     * 注销用户
     */
    @PostMapping("/user/destroy")
    fun destroyUser(
        userId: Long,
        destroyReason: String,
    ): BaseCallBack<Any> {
        val userDB = userRepository.findById(userId)
        return if (userDB.isPresent) {
            val user: UserInfo = userDB.get()
            if (user.isDestroy == true) {
                return failCallBack(StatusCode.ERROR_13004, StatusCode.ERROR_13004_TEXT)
            } else {
                user.isDestroy = true
                user.destroyDate = Date()
                user.destroyReason = destroyReason

                val save = userRepository.save(user)
                successCallBack(userAdapter(save))
            }
        } else {
            failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }
    }
}