package com.lyl.byyouside.controller.api

import cn.hutool.core.util.RandomUtil
import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.controller.chat.ChatYxImApi
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.utils.EmailUtils
import com.lyl.byyouside.utils.JwtUtils
import com.lyl.byyouside.utils.MyUtils
import jakarta.annotation.Resource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import java.util.*
import kotlin.jvm.optionals.getOrNull

@RestController
class UserController @Autowired constructor(
    private val userRepository: UserInfoRepository,
    private val chatYxImApi: ChatYxImApi,
) : ApiBaseController() {


    /**
     * 密码加密
     */
    private fun encodePassword(passWord: String): String {
        val passwordEncoder: PasswordEncoder = BCryptPasswordEncoder()
        return passwordEncoder.encode(passWord)
    }

    /**
     * 创建用户
     */
    @PostMapping(value = ["/user/register"])
    fun registerUser(
        userName: String,
        passWord: String,
        email: String
    ): BaseCallBack<Any> {
        val lowerEmail = email.lowercase(Locale.getDefault())

        if (MyUtils.isEmpty(userName) || !userName.matches(Regex(Config.REGEX_USERNAME))) {
            return failCallBack(StatusCode.ERROR_10001, StatusCode.ERROR_10001_TEXT)
        }
        if (MyUtils.isEmpty(passWord) || passWord.length > 32 || passWord.length < 6) {
            return failCallBack(StatusCode.ERROR_10002, StatusCode.ERROR_10002_TEXT)
        }
        if (MyUtils.isEmpty(lowerEmail) || !lowerEmail.matches(Regex(Config.REGEX_EMAIL))) {
            return failCallBack(StatusCode.ERROR_10005, StatusCode.ERROR_10005_TEXT)
        }

        val encodedPassword: String = encodePassword(passWord)

        // 用户名 不能重复
        val existsUser = userRepository.existsByUserName(userName)
        if (existsUser) {// 用户名已经存在
            return failCallBack(StatusCode.ERROR_10004, StatusCode.ERROR_10004_TEXT)
        }

        // 邮箱不能重复
        val existsByEmail = userRepository.existsByEmail(lowerEmail)
        if (existsByEmail) {
            return failCallBack(StatusCode.ERROR_10009, StatusCode.ERROR_10009_TEXT)
        }

        return try {
            val user = UserInfo(
                userName = userName,
                password = encodedPassword,
                email = lowerEmail,
            )
            val save: UserInfo = userRepository.saveAndFlush(user)
            save.id?.let { save.token = JwtUtils.createToken(it) }
            successCallBack(userAdapter(save))
        } catch (e: Exception) {
            failCallBack(StatusCode.ERROR_10000, StatusCode.ERROR_10000_TEXT)
        }
    }

    /**
     * 登录
     *
     * @param userName 用户号 或 邮箱
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

        val user = userRepository.findByUserNameOrEmail(userName, userName)
        if (user == null) { // 没有此用户
            return failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }

        val isResult: Boolean = BCryptPasswordEncoder().matches(passWord, user.password)
        // 密码不对
        if (!isResult) {
            return failCallBack(StatusCode.ERROR_11002, StatusCode.ERROR_11002_TEXT)
        }
        // 校验
        userAuth(user)?.let { return it }
        // 生成 Token
        user.id?.let { user.token = JwtUtils.createToken(it) }

        // 登录成功
        return successCallBack(userAdapter(user))
    }

    /**
     * 修改密码时，发送邮箱 Code
     */
    @PostMapping("/user/resetPassSendEmailCode")
    fun resetPassSendEmailCode(
        userName: String?,
        email: String?,
    ): BaseCallBack<Any> {
        val lowerEmail = email?.lowercase(Locale.getDefault())

        var user: UserInfo? = null
        if (!MyUtils.isEmpty(userName)) { // 填写的是 userName
            user = userRepository.findByUserNameOrEmail(userName, null)
        } else if (!MyUtils.isEmpty(lowerEmail)) { // 填写的是 邮箱
            if (false == lowerEmail?.matches(Regex(Config.REGEX_EMAIL))) { // 邮箱格式错误
                return failCallBack(StatusCode.ERROR_10008, StatusCode.ERROR_10008_TEXT)
            }
            user = userRepository.findByUserNameOrEmail(null, lowerEmail)
        }

        if (user == null) { // 没有此用户
            return failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }

        user.codeDate?.let {
            if (System.currentTimeMillis() - it.time < 1 * 60 * 1000) {
                // 验证码已发送，请耐心等待
                return failCallBack(StatusCode.ERROR_10010, StatusCode.ERROR_10010_TEXT)
            }
        }

        val sendEmail = user.email
        // 随机生成四位数 验证码
        val verifyCode: String = RandomUtil.randomNumbers(4)
        // 发送验证码
        EmailUtils.sendVerifyCodeHtml(verifyCode, sendEmail)

        user.code = verifyCode;
        user.codeDate = Date()
        user.updateTime = Date()
        userRepository.save(user)

        return successCallBack("验证码已发送至：$sendEmail")
    }

    /**
     * 修改密码，验证 Code
     */
    @PostMapping("/user/resetPassVerifyCode")
    fun resetPassVerifyCode(
        userName: String?,
        email: String?,
        passWord: String,
        verifyCode: String,
    ): BaseCallBack<Any> {
        val lowerEmail = email?.lowercase(Locale.getDefault())

        var user: UserInfo? = null
        if (!MyUtils.isEmpty(userName)) { // 填写的是 userName
            user = userRepository.findByUserNameOrEmail(userName, null)
        } else if (!MyUtils.isEmpty(lowerEmail)) { // 填写的是 邮箱
            if (false == lowerEmail?.matches(Regex(Config.REGEX_EMAIL))) { // 邮箱格式错误
                return failCallBack(StatusCode.ERROR_10008, StatusCode.ERROR_10008_TEXT)
            }
            user = userRepository.findByUserNameOrEmail(null, lowerEmail)
        }

        if (user == null) { // 没有此用户
            return failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }

        user.codeDate?.let {
            if (System.currentTimeMillis() - it.time > 5 * 60 * 1000) {
                // 验证码已过期，请重新发送
                return failCallBack(StatusCode.ERROR_10011, StatusCode.ERROR_10011_TEXT)
            }
        }

        if (user.code?.equals(verifyCode) == false) {
            // 验证码错误，请仔细确认
            return failCallBack(StatusCode.ERROR_10012, StatusCode.ERROR_10012_TEXT)
        }

        user.password = encodePassword(passWord)
        user.code = null;
        user.codeDate = null
        user.updateTime = Date()
        userRepository.save(user)

        return successCallBack("密码修改成功，快去登录吧 (#^.^#)")
    }

    /**
     * 更新数据库字段，只要某个字段传了值，就更新数据库
     */
    @PostMapping(value = ["/user/update"])
    fun updateUser(
        nickName: String?,
        gender: Int?,
        icon: String?,
        introduction: String?,
        birthday: String?,
        email: String?,
        uploadIntervalTime: Int?,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId
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

            val lowerEmail = email?.lowercase(Locale.getDefault())
            if (!MyUtils.isEmpty(lowerEmail)) {
                if (lowerEmail?.matches(Regex(Config.REGEX_EMAIL)) == false) {
                    return failCallBack(StatusCode.ERROR_10005, StatusCode.ERROR_10005_TEXT)
                } else {
                    lowerEmail?.let { user.email = it }
                }
            }

            gender?.let { user.gender = it }
            icon?.let { user.icon = it }
            birthday?.let { user.birthday = it }
            uploadIntervalTime?.let { user.uploadIntervalTime = it }
            user.updateTime = Date()

            val userData = userRepository.save(user)

            // 更新IM的信息
            if (!MyUtils.isEmpty(userData.imAccountId)) {
                chatYxImApi.updateImUserInfo(
                    accid = userData.imAccountId!!,
                    name = nickName,
                    icon = icon,
                    email = email,
                    gender = gender,
                    sign = introduction,
                    birth = birthday
                )
            }

            return successCallBack(userAdapter(userData))
        }

        return successCallBack("")
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
            successCallBack(userAdapter(user))
        } else {
            failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }
    }

    /**
     * 获取我的信息
     */
    @PostMapping("/user/getMyInfo")
    fun getMyInfo(): BaseCallBack<Any> {
        val userId = ContextHolder.userId
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
        destroyReason: String,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId
        val userDB = userRepository.findById(userId)
        return if (userDB.isPresent) {
            val user: UserInfo = userDB.get()
            if (user.isDestroy == true) {
                return failCallBack(StatusCode.ERROR_13004, StatusCode.ERROR_13004_TEXT)
            } else {
                user.isDestroy = true
                user.destroyDate = Date()
                user.destroyReason = destroyReason
                user.updateTime = Date()

                val save = userRepository.save(user)
                successCallBack(userAdapter(save))
            }
        } else {
            failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }
    }

    /**
     * 取消 注销用户
     */
    @PostMapping("/user/cancelDestroy")
    fun cancelDestroyUser(
        userId: Long
    ): BaseCallBack<Any> {
        val userDB = userRepository.findById(userId)
        return if (userDB.isPresent) {
            val user: UserInfo = userDB.get()
            if (user.isDestroy == true) {
                user.isDestroy = false
                user.destroyDate = Date()
                user.destroyReason = ""
            }
            user.updateTime = Date()
            val save = userRepository.save(user)
            successCallBack(userAdapter(save))
        } else {
            failCallBack(StatusCode.ERROR_11001, StatusCode.ERROR_11001_TEXT)
        }
    }

}