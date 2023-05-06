package com.lyl.byyouside.model.announcement

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import org.springframework.format.annotation.DateTimeFormat
import java.io.Serializable
import java.util.*

/**
 * 公告
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class Announcement(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    @Column(nullable = false)
    var userId: Long = 0,

    var title: String = "",

    var authorName: String = "管理员",

    @Column(columnDefinition = "TEXT")
    var content: String = "",

    ) {

    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @CreatedDate
    var createTime: Date = Date()

}