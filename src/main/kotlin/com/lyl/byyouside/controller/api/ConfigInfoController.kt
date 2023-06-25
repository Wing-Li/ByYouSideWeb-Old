package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.config.ConfigInfo
import com.lyl.byyouside.model.config.ConfigInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*

@RestController
class ConfigInfoController : ApiBaseController() {

    @Autowired
    private lateinit var configInfoRepository: ConfigInfoRepository

    @Autowired
    private lateinit var mConfig: Config

    @PostMapping(value = ["/config/create"])
    fun createConfig(
        appName: String?,
    ): BaseCallBack<Any> {
        val latestConfig = configInfoRepository.findTopByOrderByCreateTimeDesc()

        val config: ConfigInfo = latestConfig ?: ConfigInfo(
            environment = mConfig.active,
        )

        if (config.environment == null) config.environment = mConfig.active
        appName?.let { config.appName = it }

        val configDB = configInfoRepository.save(config)
        return successCallBack(configDB)
    }

    @GetMapping(value = ["/config/app"])
    fun appConfig(): BaseCallBack<Any> {
        val latestConfig: ConfigInfo? = configInfoRepository.findTopByOrderByCreateTimeDesc()

        return if (latestConfig == null) {
            failCallBack(StatusCode.ERROR_18002, StatusCode.ERROR_18002_TEXT)
        } else {
            successCallBack(latestConfig)
        }
    }

}