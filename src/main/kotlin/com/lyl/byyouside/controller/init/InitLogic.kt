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
                price = BigDecimal.valueOf(19.9),
                title = "连续包月",
            )
            list.add(vip1)

            val vip2 = Vip(
                level = 1,
                duration = 3,
                price = BigDecimal.valueOf(49.9),
                title = "连续包季",
                description = "最多人购买"
            )
            list.add(vip2)

            val vip3 = Vip(
                level = 1,
                duration = 6,
                price = BigDecimal.valueOf(94.9),
                title = "连续半年",
            )
            list.add(vip3)

            val vip4 = Vip(
                level = 1,
                duration = 12,
                price = BigDecimal.valueOf(159.9),
                title = "连续包年",
            )
            list.add(vip4)

            val vip5 = Vip(
                level = 1,
                duration = 13,
                price = BigDecimal.valueOf(159.9),
                title = "连续包年",
                description = "免费体验三天",
                status = 3,
            )
            list.add(vip5)

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