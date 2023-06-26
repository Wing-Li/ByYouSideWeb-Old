package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.model.version.Version
import com.lyl.byyouside.model.version.VersionRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController
import kotlin.jvm.optionals.getOrNull


@RestController
class VersionController() : ApiBaseController() {

    @Autowired
    private lateinit var userInfoRepository: UserInfoRepository

    @Autowired
    private lateinit var versionRepository: VersionRepository

    @PostMapping(value = ["/version/add"])
    fun addVersion(
        title: String,
        description: String,
        androidVersionName: String,
        iosVersionName: String,
        androidDownloadUrl: String,
        iosDownloadUrl: String,
        isForce: Boolean,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId
        val userData = userInfoRepository.findById(userId).getOrNull()
        userAuth(userData)?.let { return it }

        if ("admin" != userData?.status) {
            // 只有管理员才可以操作
            return failCallBack(StatusCode.ERROR_10013, StatusCode.ERROR_10013_TEXT)
        }

        val versionData = Version(
            title = title,
            description = description,
            androidVersionName = androidVersionName,
            iosVersionName = iosVersionName,
            androidDownloadUrl = androidDownloadUrl,
            iosDownloadUrl = iosDownloadUrl,
            isForce = isForce,
        )

        val versionDB = versionRepository.save(versionData)
        return successCallBack(versionDB)
    }

    @GetMapping(value = ["/version/getLast"])
    fun getLastVersion(): BaseCallBack<Any> {
        val version = versionRepository.findFirstByOrderByReleaseDateDesc()

        return if (version != null) {
            successCallBack(version)
        } else {
            failCallBack(StatusCode.ERROR_17000, StatusCode.ERROR_17000_TEXT)
        }
    }
}
