package com.lyl.byyouside.model.friend

import com.fasterxml.jackson.annotation.JsonFormat
import com.lyl.byyouside.model.user.UserInfo
import jakarta.persistence.*
import org.hibernate.annotations.UpdateTimestamp
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

/**
 * 密友
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class Friend(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "my_user_id")
    var myUser: UserInfo? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id")
    var toUser: UserInfo? = null,

    ) {

    @CreatedDate
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var createTime: Date = Date()

    @UpdateTimestamp
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var updateTime: Date = Date()

}