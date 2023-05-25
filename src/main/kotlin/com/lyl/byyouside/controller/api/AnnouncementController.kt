package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.announcement.Announcement
import com.lyl.byyouside.model.announcement.AnnouncementRepository
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 公告
 */
@RestController
class AnnouncementController @Autowired constructor(
    private val announcementRepository: AnnouncementRepository
) : ApiBaseController() {

    /**
     * 添加公告
     *
     * @param title      标题
     * @param authorName 作者名
     * @param content    内容
     * @return
     */
    @PostMapping("/announcement/add")
    fun addAnnouncement(
        title: String?,
        authorName: String?,
        content: String?
    ): BaseCallBack<Any> {

        // 标题和内容不能为空
        if (MyUtils.isEmpty(title)) {
            return failCallBack(StatusCode.BASE_TITLE_EMPYT, StatusCode.BASE_TITLE_EMPYT_TEXT)
        }
        if (MyUtils.isEmpty(content)) {
            return failCallBack(StatusCode.BASE_CONTENT_EMPYT, StatusCode.BASE_CONTENT_EMPYT_TEXT)
        }
        val announcement = Announcement(
            title = title!!,
            content = content ?: "",
            authorName = authorName ?: "",
        )
        announcementRepository.save(announcement)

        return successCallBack("添加成功")
    }

    /**
     * 获取所有的公告
     */
    @GetMapping("/announcement/getAll")
    fun getAllAnnouncement(): BaseCallBack<Any> {
        val all = announcementRepository.findAll()
        return successCallBack(all)
    }

    /**
     * 获取最后一条公告
     */
    @GetMapping("/announcement/getLast")
    fun getLastAnnouncement(): BaseCallBack<Any> {
        val announcement = announcementRepository.findTopByOrderByCreateTimeDesc()
        return if (announcement != null) {
            successCallBack(announcement)
        } else {
            failCallBack(StatusCode.BASE_REQUEST_EMPYT, StatusCode.BASE_REQUEST_EMPYT_TEXT)
        }
    }
}