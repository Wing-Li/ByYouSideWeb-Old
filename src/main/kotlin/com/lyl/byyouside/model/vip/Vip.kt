package com.lyl.byyouside.model.vip

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.math.BigDecimal
import java.util.*

/**
 * VIP 类型
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class Vip(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long? = null,

    var title: String = "",
    var description: String = "",

    @Column(nullable = false)
    var level: Int = 1, //等级

    @Column(nullable = false)
    var duration: Int = 1, // 单位：月

    @Column(nullable = false)
    var price: BigDecimal = BigDecimal.ZERO, // 价格

    var status: Int = 0, // 0: 正常；  -1：关闭；   2：测试   3: 带有三天免费
) {
    @CreatedDate
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var createTime: Date = Date()
}
