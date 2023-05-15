package com.lyl.byyouside.model.config

import org.springframework.data.jpa.repository.JpaRepository

interface ConfigInfoRepository : JpaRepository<ConfigInfo, Long> {

    fun findTopByOrderByCreateTimeDesc(): ConfigInfo?

}