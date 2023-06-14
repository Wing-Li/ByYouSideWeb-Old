package com.lyl.byyouside.model.feedback

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

/**
 * 投诉建议
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class Feedback(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    var userId: Long,
    var feedbackDetails: String,

    @CreatedDate
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var createTime: Date = Date()
)