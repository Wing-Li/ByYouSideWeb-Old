package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.friend.FriendRepository
import com.lyl.byyouside.model.moment.Moments
import com.lyl.byyouside.model.moment.MomentsRepository
import com.lyl.byyouside.model.user.UserInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import java.util.*
import kotlin.jvm.optionals.getOrNull

@RestController
class MomentsController @Autowired constructor(
    private val momentsRepository: MomentsRepository,
    private val userInfoRepository: UserInfoRepository,
    private val friendRepository: FriendRepository,
) : ApiBaseController() {

    @PostMapping("/moments/create")
    fun createMoments(
        friendId: Long,
        content: String,
        date: Date?,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        val user = userInfoRepository.findById(userId).getOrNull()
        userAuth(user)?.let { return it }

        val friend = friendRepository.findById(friendId).getOrNull()
        if (friend?.myUser?.id != userId && friend?.toUser?.id != userId) {
            // 好友关系，不是自己的
            return failCallBack(StatusCode.ERROR_16010, StatusCode.ERROR_16010_TEXT)
        }

        val moments = Moments(
            friendId = friendId,
            content = content,
            user = user!!,
        )
        date?.let { moments.date = it }

        val save = momentsRepository.save(moments)
        return successCallBack(save)
    }

    @PostMapping("/moments/update")
    fun updateMoments(
        momentsId: Long,
        friendId: Long,
        content: String?,
        date: Date?,
    ): BaseCallBack<Any> {
        val momentsDB = momentsRepository.findById(momentsId)
        if (!momentsDB.isPresent) {
            // 此瞬间不存在
            return failCallBack(StatusCode.ERROR_21000, StatusCode.ERROR_21000_TEXT)
        }

        val userId = ContextHolder.userId
        val user = userInfoRepository.findById(userId).getOrNull()
        userAuth(user)?.let { return it }

        val friend = friendRepository.findById(friendId).getOrNull()
        if (friend?.myUser?.id != userId && friend?.toUser?.id != userId) {
            // 好友关系，不是自己的 // 用户关系异常，请重新登录后再次尝试
            return failCallBack(StatusCode.ERROR_16010, StatusCode.ERROR_16010_TEXT)
        }

        val moments = momentsDB.get()
        content?.let { moments.content = it }
        date?.let { moments.date = it }

        val save = momentsRepository.save(moments)

        return successCallBack(save)
    }

    @PostMapping("/moments/delete")
    fun deleteMoments(
        id: Long
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        val momentsDB = momentsRepository.findById(id)
        if (!momentsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_21000, StatusCode.ERROR_21000_TEXT)
        }

        val moments = momentsDB.get()
        if (userId != moments.user?.id) {
            // 此瞬间不是您写的，无法删除
            return failCallBack(StatusCode.ERROR_21001, StatusCode.ERROR_21001_TEXT)
        }

        momentsRepository.deleteById(id)

        return successCallBack("删除成功")
    }

    @GetMapping("/moments/get")
    fun getMomentsById(
        id: Long
    ): BaseCallBack<Any> {
        val momentsDB = momentsRepository.findById(id)
        if (!momentsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_21000, StatusCode.ERROR_21000_TEXT)
        }

        return successCallBack(momentsDB.get())
    }

    @GetMapping(value = ["/moments/list"])
    fun getAllMoments(
        friendId: Long,
        page: Int?, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<Moments>> {
        val myId = ContextHolder.userId

        // 通过我的好友ID，查询到两人的ID，再查询对方的关系ID
        val myFriend = friendRepository.findById(friendId).getOrNull()
        if (myFriend == null || myFriend.myUser?.id != myId) {
            // 账户信息出错，请重新登录账号
            throw RuntimeException(StatusCode.ERROR_16007_TEXT)
        }

        val myUserId = myFriend.myUser?.id ?: 0
        val toUserId = myFriend.toUser?.id ?: 0

        // 查询 他->我  的 好友关系
        val toFriend = friendRepository.findByMyUser_IdAndToUser_Id(toUserId, myUserId)
        if (toFriend == null || toFriend.toUser?.id != myId) {
            // 好友关系不存在
            throw RuntimeException(StatusCode.ERROR_16008_TEXT)
        }

        val friendIds = listOf(myFriend.id!!, toFriend.id!!)
        val pageRequest = getBasePageRequest(page, size)
        val findAll = momentsRepository.findMomentsByFriendIdInOrderByDateDesc(friendIds, pageRequest)
        return successListCallBack(findAll)
    }

}
