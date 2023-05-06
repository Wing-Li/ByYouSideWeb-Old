package com.lyl.byyouside.model.vip

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface VipRechargeRepository : JpaRepository<VipRecharge, Long> {

}