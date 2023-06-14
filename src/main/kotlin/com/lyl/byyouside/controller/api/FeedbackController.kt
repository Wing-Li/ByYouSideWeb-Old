package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.device.DeviceInfo
import com.lyl.byyouside.model.feedback.Feedback
import com.lyl.byyouside.model.feedback.FeedbackRepository
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 意见反馈
 */
@RestController
@Transactional
class FeedbackController : ApiBaseController() {

    @Autowired
    private lateinit var feedbackRepository: FeedbackRepository

    @PostMapping(value = ["/feedback/add"])
    fun addFeedback(
        content: String
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        if (MyUtils.isEmpty(content)) {
            return failCallBack(StatusCode.BASE_CONTENT_EMPYT, StatusCode.BASE_CONTENT_EMPYT_TEXT)
        }

        val feedback = Feedback(
            userId = userId,
            feedbackDetails = content,
        )
        feedbackRepository.save(feedback)

        return successCallBack("提交成功")
    }

    @GetMapping(value = ["/feedback/get"])
    fun getFeedback(
        page: Int, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<Feedback>> {
        val pageRequest = getBasePageRequest(page, size)
        val page = feedbackRepository.findAll(pageRequest)
        return successListCallBack(page)
    }

}