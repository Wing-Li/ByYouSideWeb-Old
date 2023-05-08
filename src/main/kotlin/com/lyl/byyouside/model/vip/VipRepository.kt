package com.lyl.byyouside.model.vip

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface VipRepository : JpaRepository<Vip, Long> {

    fun existsByLevelIn(levels: List<Int>): Boolean
}
