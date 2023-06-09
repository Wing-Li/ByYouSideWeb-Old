package com.lyl.byyouside.model.device

import com.fasterxml.jackson.annotation.JsonFormat
import com.lyl.byyouside.model.user.UserInfo
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

/**
 * 伴友的设备信息
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class DeviceInfo(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "my_user_id")
    var user: UserInfo? = null,

    var deviceName: String = "",

    var screenStatus: String = "",
    var screenLevel: String = "",

    var batteryStatus: String = "",
    var batteryLevel: String = "",

    var volumeLevel: String = "",

    var bluetoothStatus: String = "",
    var bluetoothName: String = "",

    var wifiStatus: String = "",
    var wifiName: String = "",

    var gpsStatus: String = "",
    var locationFrom: String = "",
    var locationAddress: String = "",
    var locationLongitude: Double = 0.0,
    var locationLatitude: Double = 0.0,

    ) {

    @CreatedDate
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var createTime: Date = Date()

}