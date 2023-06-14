package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.version.Version
import com.lyl.byyouside.model.version.VersionRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController


@RestController
class VersionController() : ApiBaseController() {

    @Autowired
    private lateinit var versionRepository: VersionRepository

    @PostMapping(value = ["/version/add"])
    fun addVersion(
        androidVersionName: String,
        iosVersionName: String,
        title: String,
        description: String,
        androidDownloadUrl: String,
        iosDownloadUrl: String,
    ): BaseCallBack<Any> {
        val versionData = Version(
            androidVersionName = androidVersionName,
            iosVersionName = iosVersionName,
            title = title,
            description = description,
            androidDownloadUrl = androidDownloadUrl,
            iosDownloadUrl = iosDownloadUrl
        )

        val versionDB = versionRepository.save(versionData)
        return successCallBack(versionDB)
    }

    @GetMapping(value = ["/version/getLast"])
    fun getLastVersion(): BaseCallBack<Any> {
        val version = versionRepository.findByOrderByReleaseDateDesc()

        return if (version != null) {
            successCallBack(version)
        } else {
            failCallBack(StatusCode.ERROR_17000, StatusCode.ERROR_17000_TEXT)
        }
    }
}
