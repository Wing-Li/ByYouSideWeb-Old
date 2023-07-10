package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.config.ConfigInfo
import com.lyl.byyouside.model.config.ConfigInfoRepository
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.model.vip.VipRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import kotlin.jvm.optionals.getOrNull

@RestController
class ConfigInfoController : ApiBaseController() {

    @Autowired
    private lateinit var userInfoRepository: UserInfoRepository

    @Autowired
    private lateinit var vipRepository: VipRepository

    @Autowired
    private lateinit var configInfoRepository: ConfigInfoRepository

    @Autowired
    private lateinit var mConfig: Config

    fun initConfig(
        appName: String?,
        unCheckModel: Boolean?,
    ) {
        val latestConfig = configInfoRepository.findTopByOrderByCreateTimeDesc()
        if (latestConfig == null) {
            val config = ConfigInfo(
                environment = mConfig.active,
            )

            appName?.let { config.appName = it }
            unCheckModel?.let { config.unCheckModel = it }

            configInfoRepository.save(config)

            println("初始化配置成功")
        } else {
            println("初始化配置 已经配置")
        }
    }

    @PostMapping(value = ["/config/create"])
    fun createConfig(
        appName: String?,
        unCheckModel: Boolean?,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId
        val userData = userInfoRepository.findById(userId).getOrNull()
        userAuth(userData)?.let { return it }

        if ("admin" != userData?.status) {
            // 只有管理员才可以操作
            return failCallBack(StatusCode.ERROR_10013, StatusCode.ERROR_10013_TEXT)
        }

        val latestConfig = configInfoRepository.findTopByOrderByCreateTimeDesc()

        val config: ConfigInfo = latestConfig ?: ConfigInfo(
            environment = mConfig.active,
        )

        if (config.environment == null) config.environment = mConfig.active
        appName?.let { config.appName = it }
        unCheckModel?.let { config.unCheckModel = it }

        val configDB = configInfoRepository.save(config)
        return successCallBack(configDB)
    }

    @GetMapping(value = ["/config/app"])
    fun appConfig(): BaseCallBack<Any> {
        val latestConfig: ConfigInfo? = configInfoRepository.findTopByOrderByCreateTimeDesc()

        return if (latestConfig == null) {
            failCallBack(StatusCode.ERROR_18002, StatusCode.ERROR_18002_TEXT)
        } else {
            val vips = vipRepository.findAll()
            latestConfig.vipTypeList = vips

            successCallBack(latestConfig)
        }
    }

}