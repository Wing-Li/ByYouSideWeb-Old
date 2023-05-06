package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.model.vip.VipRecharge
import com.lyl.byyouside.model.vip.VipRechargeRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController
import java.util.*

/**
 * 会员充值记录
 */
@RestController
class VipRechargeController @Autowired constructor(
    private val vipRechargeRepository: VipRechargeRepository,
    private val userRepository: UserInfoRepository
) : ApiBaseController() {

    /**
     * 会员充值
     *
     * @param userId   会员id
     * @param money    出的钱数
     * @param vipGrade vip等级
     * @param duration 充值时长（天）
     * @param from     充值来源
     * @return
     */
    @PostMapping("/addVipRecharge")
    fun addVipRecharge(
        userId: Long,
        money: Double,
        vipGrade: Int,
        duration: Int,
        from: Int
    ): BaseCallBack<Any> {
        val user = userRepository.findById(userId)
        if (!user.isPresent) {
            // 用户不存在
            return failCallBack(StatusCode.USER_NAME_15001, StatusCode.USER_NAME_15001_TEXT)
        }

        // from = 3,是官方送的
        if (from != 3) {
            if (money < 0) {
                // 金额小于0
                return failCallBack(StatusCode.USER_NAME_15002, StatusCode.USER_NAME_15002_TEXT)
            }
        }

        val vipRecharge = VipRecharge(
            userId = userId,
            money = money,
            vipGrade = vipGrade,
            duration = duration,
            fromRecharge = from
        )
        // 将数据保存到数据库
        vipRechargeRepository.save(vipRecharge)

        // 给用户设置会员
        val userData = user.get()
        userData.vipGrade = vipGrade

        // 设置用户的到期时间
        // 先获取以前时间，查看他是否过期，没过期继续加。过期了，或者没有，从新设置
        val vipLimitDate = userData.vipLimitDate
        val nowTime = Date()
        if (vipLimitDate != null && vipLimitDate.time > nowTime.time) {
            // 以前冲过会员，并且还有没有过期，在他的时间往后加
            vipLimitDate.date = vipLimitDate.date + duration
            userData.vipLimitDate = vipLimitDate
        } else {
            // 以前没有冲过会员 或者 过期了，时间从现在开始算
            nowTime.date = nowTime.date + duration
            userData.vipLimitDate = nowTime
        }
        val resultUser = userRepository.save(userData)
        return successCallBack(userAdapter(resultUser))
    }
}