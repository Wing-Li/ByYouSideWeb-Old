package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.device.DeviceInfo
import com.lyl.byyouside.model.device.DeviceInfoRepository
import com.lyl.byyouside.model.user.UserInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController
import java.util.*

/**
 * 伴友设备信息
 */
@RestController
@Transactional
class DeviceInfoController @Autowired constructor(
    private val deviceInfoRepository: DeviceInfoRepository,
    private val userRepository: UserInfoRepository
) : ApiBaseController() {

    /**
     * 新增设备信息信息
     */
    @PostMapping("/device/add")
    fun addVipRecharge(
        userId: Long,
        deviceName: String?,
        screenStatus: String?,
        screenLevel: String?,
        batteryStatus: String?,
        batteryLevel: String?,
        volumeLevel: String?,
        bluetoothStatus: String?,
        bluetoothName: String?,
        wifiStatus: String?,
        wifiName: String?,
        gpsStatus: String?,
        locationFrom: String?,
        locationAddress: String?,
        locationLongitude: Double?,
        locationLatitude: Double?,
    ): BaseCallBack<Any> {
        val userDB = userRepository.findById(userId)
        if (!userDB.isPresent) {
            // 用户不存在
            return failCallBack(StatusCode.ERROR_15001, StatusCode.ERROR_15001_TEXT)
        }
        val user = userDB.get()

        val deviceInfo = DeviceInfo(
            user = user
        )

        // 保存信息时，同步地理位置到用户表里
        deviceName?.let { deviceInfo.deviceName = it }
        screenStatus?.let { deviceInfo.screenStatus = it }
        screenLevel?.let { deviceInfo.screenLevel = it }
        batteryStatus?.let { deviceInfo.batteryStatus = it }
        batteryLevel?.let { deviceInfo.batteryLevel = it }
        volumeLevel?.let { deviceInfo.volumeLevel = it }
        bluetoothStatus?.let { deviceInfo.bluetoothStatus = it }
        bluetoothName?.let { deviceInfo.bluetoothName = it }
        wifiStatus?.let { deviceInfo.wifiStatus = it }
        wifiName?.let { deviceInfo.wifiName = it }
        gpsStatus?.let { deviceInfo.gpsStatus = it }
        locationFrom?.let { deviceInfo.locationFrom = it }
        locationAddress?.let {
            deviceInfo.locationAddress = it
            user.locationAddress = it
        }
        locationLongitude?.let {
            deviceInfo.locationLongitude = it
            user.locationLongitude = it
        }
        locationLatitude?.let {
            deviceInfo.locationLatitude = it
            user.locationLatitude = it
        }
        user.locationTime = deviceInfo.createTime

        userRepository.save(user)
        val deviceInfoDB = deviceInfoRepository.save(deviceInfo)
        return successCallBack(deviceInfoDB)
    }

    @GetMapping(value = ["/device/getAll"])
    fun getDeviceAll(): BaseCallBack<Any> {
        val findAll = deviceInfoRepository.findAll()
        return successCallBack(findAll)
    }

    @GetMapping(value = ["/device/getByUserId"])
    fun getDeviceByUserId(
        userId: Long,
        page: Int, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<DeviceInfo>> {
        val pageRequest = getBasePageRequest(page, size)
        val deviceInfoPage = deviceInfoRepository.findDeviceInfosByUser_IdOrderByCreateTimeDesc(userId, pageRequest)
        return successListCallBack(deviceInfoPage)
    }

    @GetMapping(value = ["/device/getLastByUserId"])
    fun getDeviceLastByUserId(
        userId: Long,
    ): BaseCallBack<Any> {
        val deviceInfo = deviceInfoRepository.findFirstByUser_IdOrderByCreateTimeDesc(userId)
        if (deviceInfo == null) {
            return failCallBack(StatusCode.ERROR_19000, StatusCode.ERROR_19000_TEXT)
        } else {
            return successCallBack(deviceInfo)
        }
    }
}