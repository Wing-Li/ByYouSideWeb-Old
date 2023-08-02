package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.controller.chat.ChatYxImApi
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.model.vip.Vip
import com.lyl.byyouside.model.vip.VipRecharge
import com.lyl.byyouside.model.vip.VipRechargeRepository
import com.lyl.byyouside.model.vip.VipRepository
import com.lyl.byyouside.push.PushApi
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.util.*
import kotlin.jvm.optionals.getOrNull

/**
 * 会员充值记录
 */
@RestController
@Transactional
class VipRechargeController @Autowired constructor(
    private val vipRepository: VipRepository,
    private val vipRechargeRepository: VipRechargeRepository,
    private val userRepository: UserInfoRepository,
    private val chatYxImApi: ChatYxImApi,
) : ApiBaseController() {

    /**
     * 会员充值
     */
    @PostMapping("/vip/addRecharge")
    fun addVipRecharge(
        toUserId: Long?, // 给谁充值，可为空。默认给自己充值
        vipId: Long,
        money: BigDecimal,
        from: String, // 充值类型： ios/android/bind/admin
        bindFromUserId: Long?, // 如果 vipFrom == bind，此时有值。代表是谁绑定的
    ): BaseCallBack<Any> {
        val userId = toUserId ?: ContextHolder.userId

        val user = userRepository.findById(userId)
        if (!user.isPresent) {
            // 用户不存在
            return failCallBack(StatusCode.ERROR_15001, StatusCode.ERROR_15001_TEXT)
        }

        // from = admin,是官方送的
        if ("admin" != from) {
            if (money < BigDecimal.ZERO) {
                // 金额小于0
                return failCallBack(StatusCode.ERROR_15002, StatusCode.ERROR_15002_TEXT)
            }
        }

        val vipDB = vipRepository.findById(vipId)
        if (!vipDB.isPresent) {
            // VIP不存在
            return failCallBack(StatusCode.ERROR_15003, StatusCode.ERROR_15003_TEXT)
        }
        val vip = vipDB.get()

        val vipRecharge = VipRecharge(
            userId = userId,
            vip = vip,
            vipFrom = from,
            actualPrice = money
        )
        if ("bind" == from) vipRecharge.bindFromUserId = bindFromUserId
        // 保存购买记录
        vipRechargeRepository.save(vipRecharge)

        // 给用户设置会员
        val userData = user.get()
        userData.vipLevel = vip.level
        userData.vipFrom = from
        when (vip.status) {
            // 单人会员
            0 -> userData.bindCount = "0/0"
            // 双人会员
            2 -> userData.bindCount = "1/1"
        }

        // 设置用户的到期时间
        // 先获取以前时间，查看他是否过期，没过期继续加。过期了，或者没有，从新设置
        val vipLimitDate = userData.vipLimitDate
        val nowTime = Date()
        if (vipLimitDate != null && vipLimitDate.time > nowTime.time) {
            // 以前冲过会员，并且还有没有过期，在他的时间往后加
            vipLimitDate.month = vipLimitDate.month + vip.duration
            userData.vipLimitDate = vipLimitDate
        } else {
            // 以前没有冲过会员 或者 过期了，时间从现在开始算
            nowTime.month = nowTime.month + vip.duration
            userData.vipLimitDate = nowTime
        }


        // 给用户注册IM账号
        val accountId = chatYxImApi.getAccountId(userId)
        val accountToken = chatYxImApi.getAccountToken(userId)
        val resultStr = chatYxImApi.createImUser(
            accid = accountId,
            token = accountToken,
            name = userData.nickName,
            icon = userData.icon,
            email = userData.email,
            gender = userData.gender,
            sign = userData.introduction,
            birth = userData.birthday
        )
        if (!MyUtils.isEmpty(resultStr)) {
            println("给用户注册IM账号:$resultStr");
        }
        userData.imAccountId = accountId

        // 保存用户信息
        val resultUser = userRepository.save(userData)
        return successCallBack(userAdapter(resultUser))
    }

    /**
     * 绑定会员
     */
    @PostMapping("/vip/bindVip")
    fun bindVip(
        toUserId: Long,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        if (toUserId == userId) {
            // 不能绑定给自己
            return failCallBack(StatusCode.ERROR_15007, StatusCode.ERROR_15007_TEXT)
        }

        val myUser = userRepository.findById(userId).getOrNull()
        userAuth(myUser)?.let { return it }

        if (MyUtils.isEmpty(myUser?.bindCount)) {
            myUser!!.bindCount = "0/0"
            userRepository.save(myUser)
            // 您没有可绑定的名额
            return failCallBack(StatusCode.ERROR_15005, StatusCode.ERROR_15005_TEXT)
        }

        val split = myUser?.bindCount?.split("/") ?: listOf("0", "0")
        val num = split[0].toInt()
        val all = split[1].toInt()

        if (num <= 0 || num >= all) {
            // 您的名额已经用完
            return failCallBack(StatusCode.ERROR_15006, StatusCode.ERROR_15006_TEXT)
        }

        // 获取我最新地购买记录
        val vipRecharge = vipRechargeRepository.findTopByUserIdOrderByCreateTimeDesc(userId)
            ?: return failCallBack(StatusCode.ERROR_15008, StatusCode.ERROR_15008_TEXT)

        val result = addVipRecharge(
            toUserId = toUserId,
            vipId = vipRecharge.vip!!.id!!,
            money = BigDecimal.valueOf(0.0),
            from = "bind",
            bindFromUserId = userId,
        )
        if (result.code != 200) {
            // 如果充值异常，将异常返回
            return result
        }

        // 充值完，修改剩余数量
        myUser!!.bindCount = "${num - 1}/$all"
        userRepository.save(myUser)

        if (result.data is UserInfo) {
            val user = result.data as? UserInfo
            user?.deviceAlias?.let {
                // 通知提醒对方： myUser 为你开通了VIP
                PushApi().sendBindVip(
                    user.deviceType!!,
                    user.deviceAlias!!,
                    user.deviceAliasType!!,
                    myUser.id!!,
                    myUser.nickName,
                    myUser.icon
                )
            }
        }

        return successCallBack(userAdapter(myUser))
    }

    @PostMapping(value = ["/vip/create"])
    fun createVip(
        title: String,
        description: String?,
        level: Int,
        duration: Int,
        price: BigDecimal,
        status: Int,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId
        val userData = userRepository.findById(userId).getOrNull()
        userAuth(userData)?.let { return it }

        if ("admin" != userData?.status) {
            // 只有管理员才可以操作
            return failCallBack(StatusCode.ERROR_10013, StatusCode.ERROR_10013_TEXT)
        }

        val vip = Vip()
        title.let { vip.title = it }
        description?.let { vip.description = it }
        level.let { vip.level = it }
        duration.let { vip.duration = it }
        price.let { vip.price = it }
        status.let { vip.status = it }

        val save = vipRepository.save(vip)
        return successCallBack(save)
    }

    @PostMapping(value = ["/vip/update"])
    fun updateVip(
        vipId: Long,
        title: String?,
        description: String?,
        level: Int?,
        duration: Int?,
        price: BigDecimal?,
        status: Int?,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId
        val userData = userRepository.findById(userId).getOrNull()
        userAuth(userData)?.let { return it }

        if ("admin" != userData?.status) {
            // 只有管理员才可以操作
            return failCallBack(StatusCode.ERROR_10013, StatusCode.ERROR_10013_TEXT)
        }

        val vipDB = vipRepository.findById(vipId)
        if (!vipDB.isPresent) {
            // 此VIP类型不存在，请联系管理员
            return failCallBack(StatusCode.ERROR_15004, StatusCode.ERROR_15004_TEXT)
        }

        val vip = vipDB.get()
        title?.let { vip.title = it }
        description?.let { vip.description = it }
        level?.let { vip.level = it }
        duration?.let { vip.duration = it }
        price?.let { vip.price = it }
        status?.let { vip.status = it }

        val save = vipRepository.save(vip)
        return successCallBack(save)
    }

    @GetMapping(value = ["/vip/getRechargeAll"])
    fun getVipRechargeAll(): BaseCallBack<Any> {
        val vipRecharges = vipRechargeRepository.findAll()
        return successCallBack(vipRecharges)
    }

    @GetMapping(value = ["/vip/getRechargeByUserId"])
    fun getVipRechargeByUserId(
        userId: Long,
        page: Int, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<VipRecharge>> {
        val pageRequest = getBasePageRequest(page, size)
        val vipRecharges = vipRechargeRepository.findVipRechargesByUserIdOrderByCreateTimeDesc(userId, pageRequest)
        return successListCallBack(vipRecharges)
    }

    @GetMapping(value = ["/vip/getMyRecharge"])
    fun getMyVipRecharge(
        page: Int, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<VipRecharge>> {
        val userId = ContextHolder.userId
        val pageRequest = getBasePageRequest(page, size)
        val vipRecharges = vipRechargeRepository.findVipRechargesByUserIdOrderByCreateTimeDesc(userId, pageRequest)
        return successListCallBack(vipRecharges)
    }

    @GetMapping(value = ["/vip/getType"])
    fun getVipType(): BaseCallBack<Any> {
        val vips = vipRepository.findAll()
        return successCallBack(vips)
    }
}