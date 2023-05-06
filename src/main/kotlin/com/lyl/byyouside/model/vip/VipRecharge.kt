package com.lyl.byyouside.model.vip

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

/**
 * 会员充值记录表
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class VipRecharge(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,


    @Column(nullable = false)
    var userId: Long = 0,

    @Column(nullable = false)
    var money: Double = 0.0,

    var vipGrade: Int = 1,
    var duration: Int = 1,
    var fromRecharge: Int = 0 // 3,是官方送的

) {

    @CreatedDate
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(nullable = false)
    var createTime: Date = Date()

}