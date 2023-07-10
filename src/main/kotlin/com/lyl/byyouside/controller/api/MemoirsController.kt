package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.friend.FriendRepository
import com.lyl.byyouside.model.memoirs.Memoirs
import com.lyl.byyouside.model.memoirs.MemoirsRepository
import com.lyl.byyouside.model.user.UserInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import java.util.*
import kotlin.jvm.optionals.getOrNull

@RestController
class MemoirsController @Autowired constructor(
    private val memoirsRepository: MemoirsRepository,
    private val userInfoRepository: UserInfoRepository,
    private val friendRepository: FriendRepository,
) : ApiBaseController() {

    @PostMapping("/memoirs/create")
    fun createMemoirs(
        friendId: Long,
        title: String,
        content: String,
        date: Date?,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        val user = userInfoRepository.findById(userId).getOrNull()
        userAuth(user)?.let { return it }

        val friend = friendRepository.findById(friendId).getOrNull()
        if (friend?.myUser?.id != userId && friend?.toUser?.id != userId) {
            // 好友关系，不是自己的
            return failCallBack(StatusCode.ERROR_20002, StatusCode.ERROR_20002_TEXT)
        }

        val memoirs = Memoirs(
            friendId = friendId,
            title = title,
            content = content,
            user = user!!,
        )
        date?.let { memoirs.date = it }

        val save = memoirsRepository.save(memoirs)
        return successCallBack(save)
    }

    @PostMapping("/memoirs/update")
    fun updateMemoirs(
        memoirsId: Long,
        friendId: Long,
        title: String?,
        content: String?,
        date: Date?,
    ): BaseCallBack<Any> {
        val memoirsDB = memoirsRepository.findById(memoirsId)
        if (!memoirsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_20000, StatusCode.ERROR_20000_TEXT)
        }

        val userId = ContextHolder.userId
        val user = userInfoRepository.findById(userId).getOrNull()
        userAuth(user)?.let { return it }

        val friend = friendRepository.findById(friendId).getOrNull()
        if (friend?.myUser?.id != userId && friend?.toUser?.id != userId) {
            // 好友关系，不是自己的 // 用户关系异常，请重新登录后再次尝试
            return failCallBack(StatusCode.ERROR_20002, StatusCode.ERROR_20002_TEXT)
        }

        val memoirs = memoirsDB.get()
        title?.let { memoirs.title = it }
        content?.let { memoirs.content = it }
        date?.let { memoirs.date = it }

        val save = memoirsRepository.save(memoirs)

        return successCallBack(save)
    }

    @PostMapping("/memoirs/delete")
    fun deleteMemoirs(
        id: Long
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        val memoirsDB = memoirsRepository.findById(id)
        if (!memoirsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_20000, StatusCode.ERROR_20000_TEXT)
        }

        val memoirs = memoirsDB.get()
        if (userId != memoirs.user?.id) {
            // 此回忆不是您写的，无法删除
            return failCallBack(StatusCode.ERROR_20001, StatusCode.ERROR_20001_TEXT)
        }

        memoirsRepository.deleteById(id)

        return successCallBack("删除成功")
    }

    @GetMapping("/memoirs/get")
    fun getMemoirsById(
        id: Long
    ): BaseCallBack<Any> {
        val memoirsDB = memoirsRepository.findById(id)
        if (!memoirsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_20000, StatusCode.ERROR_20000_TEXT)
        }

        return successCallBack(memoirsDB.get())
    }

    @GetMapping(value = ["/memoirs/list"])
    fun getAllMemoirs(
        friendId: Long,
        page: Int?, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<Memoirs>> {
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
        val findAll = memoirsRepository.findDiariesByFriendIdInOrderByDateDesc(friendIds, pageRequest)
        return successListCallBack(findAll)
    }

}
