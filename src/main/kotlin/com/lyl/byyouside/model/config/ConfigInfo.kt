package com.lyl.byyouside.model.config

import com.fasterxml.jackson.annotation.JsonFormat
import com.lyl.byyouside.model.vip.Vip
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

@Entity
@EntityListeners(AuditingEntityListener::class)
data class ConfigInfo(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    // 环境
    var environment: String? = null,

    ) {

    /**
     * App名称
     */
    var appName: String? = null

    /**
     * 审核模式
     * false: 默认，审核模式;  true：正常模式
     */
    var unCheckModel: Boolean? = false

    /**
     * 会员列表
     */
    @Transient
    var vipTypeList: List<Vip>? = null


    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @CreatedDate
    var createTime: Date = Date()

}