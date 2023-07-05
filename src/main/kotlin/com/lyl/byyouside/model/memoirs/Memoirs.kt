package com.lyl.byyouside.model.memoirs

import com.fasterxml.jackson.annotation.JsonFormat
import com.lyl.byyouside.model.user.UserInfo
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

@Entity
@EntityListeners(AuditingEntityListener::class)
data class Memoirs(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    var title: String = "",
    var content: String = "",

    @Column(nullable = false)
    var friendId: Long = 0L,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: UserInfo? = null,

    ) {

    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var date: Date = Date()

    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @CreatedDate
    var createTime: Date = Date()

}