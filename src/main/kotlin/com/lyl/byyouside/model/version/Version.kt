package com.lyl.byyouside.model.version

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

@Entity
@EntityListeners(AuditingEntityListener::class)
data class Version(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    var androidVersionName: String = "",
    var iosVersionName: String = "",

    var title: String = "",
    var description: String = "",

    var androidDownloadUrl: String = "",
    var iosDownloadUrl: String = "",
    var isForce: Boolean = false,

    ) {

    @CreatedDate
    @Column(nullable = false)
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var releaseDate: Date = Date()

}
