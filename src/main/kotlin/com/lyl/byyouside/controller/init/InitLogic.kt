package com.lyl.byyouside.controller.init

import com.lyl.byyouside.controller.api.ConfigInfoController
import com.lyl.byyouside.model.vip.Vip
import com.lyl.byyouside.model.vip.VipRepository
import jakarta.annotation.PostConstruct
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.util.Arrays

@Component
class InitLogic {

    @Autowired
    private lateinit var vipRepository: VipRepository

    @Autowired
    private lateinit var configInfoController: ConfigInfoController

    @PostConstruct
    fun init() {
        initVipType()

        initConfig()
    }

    private fun initVipType() {
        // 13 代表 包年三天免费
        val levels = listOf(1, 3, 6, 12, 13)
        val existsByLevel = vipRepository.existsByDurationIn(levels)

        if (!existsByLevel) {
            vipRepository.deleteAll()

            val list = ArrayList<Vip>()

            val vip1 = Vip(
                level = 1,
                duration = 1,
                price = BigDecimal.valueOf(18.8),
                title = "连续包月",
                description = "",
                status = 0,
                identity = "com.lyl.byyourside.vip.month.1"
            )
            list.add(vip1)

            val vip2 = Vip(
                level = 1,
                duration = 3,
                price = BigDecimal.valueOf(46.0),
                title = "连续包季",
                description = "",
                status = 0,
                identity = "com.lyl.byyourside.vip.month.3"
            )
            list.add(vip2)

            val vip3 = Vip(
                level = 1,
                duration = 6,
                price = BigDecimal.valueOf(84.0),
                title = "连续半年",
                description = "",
                status = 0,
                identity = "com.lyl.byyourside.vip.month.6"
            )
            list.add(vip3)

            val vip4 = Vip(
                level = 1,
                duration = 12,
                price = BigDecimal.valueOf(158.0),
                title = "连续包年",
                description = "",
                status = 0,
                identity = "com.lyl.byyourside.vip.month.12"
            )
            list.add(vip4)

            val vip5 = Vip(
                level = 1,
                duration = 13,
                price = BigDecimal.valueOf(158.0),
                title = "连续包年",
                description = "免费体验三天",
                status = 0,
                identity = "com.lyl.byyourside.vip.month.12.3dfree"
            )
            list.add(vip5)

            val vip2_1 = Vip(
                level = 1,
                duration = 1,
                price = BigDecimal.valueOf(28.8),
                title = "双人包月",
                description = "",
                status = 2,
                identity = "com.lyl.byyourside.vip.month.duet.1"
            )
            list.add(vip2_1)

            val vip2_2 = Vip(
                level = 1,
                duration = 3,
                price = BigDecimal.valueOf(69.0),
                title = "双人包季",
                description = "",
                status = 2,
                identity = "com.lyl.byyourside.vip.month.duet.3"
            )
            list.add(vip2_2)

            val vip2_3 = Vip(
                level = 1,
                duration = 6,
                price = BigDecimal.valueOf(128.0),
                title = "双人半年",
                description = "",
                status = 2,
                identity = "com.lyl.byyourside.vip.month.duet.6"
            )
            list.add(vip2_3)

            val vip2_4 = Vip(
                level = 1,
                duration = 12,
                price = BigDecimal.valueOf(239.0),
                title = "双人包年",
                description = "巨划算",
                status = 2,
                identity = "com.lyl.byyourside.vip.month.duet.12"
            )
            list.add(vip2_4)

            val vip2_5 = Vip(
                level = 1,
                duration = 13,
                price = BigDecimal.valueOf(239.0),
                title = "双人包年",
                description = "免费体验三天",
                status = 2,
                identity = "com.lyl.byyourside.vip.month.duet.12.3dfree"
            )
            list.add(vip2_5)

            vipRepository.saveAll(list)

            println("初始化 VIP 会员类型")
        } else {
            println("VIP 会员类型 已经初始化")
        }
    }

    private fun initConfig() {
        configInfoController.initConfig(
            appName = "伴你左右",
            unCheckModel = false,
        )
    }

}