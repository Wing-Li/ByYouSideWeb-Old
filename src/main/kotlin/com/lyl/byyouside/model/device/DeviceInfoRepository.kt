package com.lyl.byyouside.model.device

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface DeviceInfoRepository : JpaRepository<DeviceInfo, Long> {

    fun findDeviceInfosByUser_IdOrderByCreateTimeDesc(userId: Long, pageable: Pageable): Page<DeviceInfo>

    fun findFirstByUser_IdOrderByCreateTimeDesc(userId: Long): DeviceInfo?

}