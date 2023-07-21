package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.controller.chat.ChatYxImApi
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.model.vip.Vip
import com.lyl.byyouside.model.vip.VipRecharge
import com.lyl.byyouside.model.vip.VipRechargeRepository
import com.lyl.byyouside.model.vip.VipRepository
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
     *
     * @param userId   会员id
     * @param money    出的钱数
     * @param vipGrade vip等级
     * @param duration 充值时长（天）
     * @param from     充值来源  1：用户充值； 3：官方赠送
     * @return
     */
    @PostMapping("/vip/addRecharge")
    fun addVipRecharge(
        vipId: Long,
        money: BigDecimal,
        from: String
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

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
        // 保存购买记录
        vipRechargeRepository.save(vipRecharge)

        // 给用户设置会员
        val userData = user.get()
        userData.vipLevel = vip.level
        userData.vipFrom = from
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