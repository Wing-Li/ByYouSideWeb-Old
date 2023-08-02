package com.lyl.byyouside.model.vip

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface VipRechargeRepository : JpaRepository<VipRecharge, Long> {

    fun findVipRechargesByUserIdOrderByCreateTimeDesc(userId: Long, pageable: Pageable): Page<VipRecharge>

    /**
     * 获取指定用户最新地购买记录
     */
    fun findTopByUserIdOrderByCreateTimeDesc(userId: Long): VipRecharge?

}