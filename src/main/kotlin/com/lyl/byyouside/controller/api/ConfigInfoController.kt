package com.lyl.byyouside.controller.api

import com.alibaba.fastjson.JSONObject
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.config.ConfigInfo
import com.lyl.byyouside.model.config.ConfigInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import java.lang.Exception

@RestController
class ConfigInfoController : ApiBaseController() {

    @Autowired
    private lateinit var configInfoRepository: ConfigInfoRepository

    @PostMapping(value = ["/config/create"])
    fun createConfig(
        @RequestBody h5Map: Map<String, Any>,
        @RequestBody appMap: Map<String, Any>,
    ): BaseCallBack<Any> {
        val config: ConfigInfo = ConfigInfo().apply {
            appConfig = JSONObject.toJSONString(appMap)
            h5Config = JSONObject.toJSONString(h5Map)
        }

        val configDB = configInfoRepository.save(config)
        return successCallBack(configDB)
    }

    @PostMapping(value = ["/config/update"])
    fun updateConfig(
        configType: String,
        @RequestBody map: Map<String, Any>
    ): BaseCallBack<Any> {
        val latestConfig = configInfoRepository.findTopByOrderByCreateTimeDesc()

        val config: ConfigInfo = if (latestConfig != null) {
            latestConfig
        } else {
            ConfigInfo().apply {
                appConfig = if ("app" == configType) JSONObject.toJSONString(map) else ""
                h5Config = if ("h5" == configType) JSONObject.toJSONString(map) else ""
            }
        }

        val configDB = configInfoRepository.save(config)
        return successCallBack(configDB)
    }

    @GetMapping(value = ["/config/h5"])
    fun h5Config(): BaseCallBack<Any> {
        return try {
            val latestConfig = configInfoRepository.findTopByOrderByCreateTimeDesc()
            if (latestConfig != null) {
                val map: Map<String, Any> = JSONObject.parse(latestConfig.h5Config) as? HashMap<String, Any> ?: HashMap()
                successCallBack(map)
            } else {
                failCallBack(StatusCode.ERROR_18001, StatusCode.ERROR_18001_TEXT)
            }
        } catch (e: Exception) {
            failCallBack(StatusCode.ERROR_18001, StatusCode.ERROR_18001_TEXT)
        }
    }

    @GetMapping(value = ["/config/app"])
    fun appConfig(): BaseCallBack<Any> {
        return try {
            val latestConfig = configInfoRepository.findTopByOrderByCreateTimeDesc()
            if (latestConfig != null) {
                val map: Map<String, Any> = JSONObject.parse(latestConfig.h5Config) as? HashMap<String, Any> ?: HashMap()
                successCallBack(map)
            } else {
                failCallBack(StatusCode.ERROR_18002, StatusCode.ERROR_18002_TEXT)
            }
        } catch (e: Exception) {
            failCallBack(StatusCode.ERROR_18002, StatusCode.ERROR_18002_TEXT)
        }
    }

}