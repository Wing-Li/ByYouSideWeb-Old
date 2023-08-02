package com.lyl.byyouside.model.vip

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.math.BigDecimal
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vip_id", nullable = false)
    var vip: Vip? = null,

    /**
     * ios/android/bind/admin
     */
    var vipFrom: String = "",

    /**
     * 如果 vipFrom == "bind"，此时有值。 代表来自于谁的绑定
     */
    var bindFromUserId: Long? = null,

    @Column(nullable = false)
    var actualPrice: BigDecimal = BigDecimal.ZERO,

    ) {

    @CreatedDate
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(nullable = false)
    var createTime: Date = Date()

}