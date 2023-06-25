package com.lyl.byyouside.controller.init

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

    @PostConstruct
    fun init() {
        initVipType()
    }

    private fun initVipType() {
        val levels = listOf(1, 3, 6, 12)
        val existsByLevel = vipRepository.existsByLevelIn(levels)

        if (!existsByLevel) {
            val vip1 = Vip(
                level = 1,
                duration = 1,
                price = BigDecimal.valueOf(19.9),
                title = "连续包月",
            )
            vipRepository.save(vip1)

            val vip2 = Vip(
                level = 1,
                duration = 3,
                price = BigDecimal.valueOf(49.9),
                title = "连续包季",
                description = "最多人购买"
            )
            vipRepository.save(vip2)

            val vip3 = Vip(
                level = 1,
                duration = 6,
                price = BigDecimal.valueOf(94.9),
                title = "连续半年",
            )
            vipRepository.save(vip3)

            val vip4 = Vip(
                level = 1,
                duration = 12,
                price = BigDecimal.valueOf(159.9),
                title = "连续包年",
            )
            vipRepository.save(vip4)
        }
    }

}