package com.lyl.byyouside.model.config

import com.fasterxml.jackson.annotation.JsonFormat
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


    ) {

    var appConfig: String = ""

    var h5Config: String = ""


    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @CreatedDate
    var createTime: Date = Date()

}