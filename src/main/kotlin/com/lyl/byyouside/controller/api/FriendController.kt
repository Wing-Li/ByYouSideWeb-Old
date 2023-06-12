package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.Config
import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.friend.Friend
import com.lyl.byyouside.model.friend.FriendRepository
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.model.user.UserInfoRepository
import com.lyl.byyouside.utils.MyUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.domain.Page
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import kotlin.jvm.optionals.getOrNull


@RestController
@Transactional
class FriendController : ApiBaseController() {

    @Autowired
    private lateinit var userRepository: UserInfoRepository

    @Autowired
    private lateinit var friendRepository: FriendRepository

    /**
     * 请求好友
     */
    @PostMapping(value = ["/friend/request"])
    fun requestFriend(
        toId: Long, // 被请求的人
    ): BaseCallBack<Any> {
        val myId = ContextHolder.userId

        // 检查自己和对方的关系
        val friend = friendRepository.findByMyUser_IdAndToUser_Id(myId, toId)
        if (friend != null) {
            when (friend.status) {
                // 已经请求过了
                0 -> return failCallBack(StatusCode.ERROR_16005, StatusCode.ERROR_16005_TEXT)
                // 你们已经是密友关系
                1 -> return failCallBack(StatusCode.ERROR_16003, StatusCode.ERROR_16003_TEXT)
                // 对方永久拒绝您的请求
                -2 -> return failCallBack(StatusCode.ERROR_16006, StatusCode.ERROR_16006_TEXT)
            }
        }

        // 检查对方是否请求过自己
        val toRequestFriend = friendRepository.findByMyUser_IdAndToUser_Id(toId, myId)
        if (toRequestFriend != null) {
            toRequestFriend.status = 1;
            friendRepository.save(toRequestFriend)

            // 对方已经添加过自己。此条请求，直接将双方加为好友
            val myFriendData = Friend(
                myUser = toRequestFriend.toUser,
                toUser = toRequestFriend.myUser,
                status = 1,
            )
            val myFriendDB = friendRepository.save(myFriendData)
            return successCallBack(myFriendDB)

        } else {
            // 没有请求过，则创建请求记录
            val myUser: UserInfo? = userRepository.findById(myId).getOrNull()
            userAuth(myUser)?.let { return it }

            val toUser: UserInfo? = userRepository.findById(toId).getOrNull()
            userAuth(toUser)?.let { return it }

            val friendData = Friend(
                myUser = myUser,
                toUser = toUser,
                status = 0,
            )
            val friendDB = friendRepository.save(friendData)
            return successCallBack(friendDB)
        }
    }

    /**
     * 同意请求
     */
    @PostMapping(value = ["/friend/agreeRequest"])
    fun agreeFriendRequest(
        friendId: Long,
    ): BaseCallBack<Any> {
        val myId = ContextHolder.userId

        val myUser = userRepository.findById(myId).getOrNull()
        userAuth(myUser)?.let { return it }


        // 他 -> 我
        val toAmeFriend = friendRepository.findById(friendId).getOrNull()
        if (toAmeFriend == null) {
            // 好友关系不存在
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }

        if (toAmeFriend.toUser?.id != myId) {
            // 信息出错，请重新登录账号
            return failCallBack(StatusCode.ERROR_16007, StatusCode.ERROR_16007_TEXT)
        }

        if (toAmeFriend.status == 1) {
            // 你们已经是密友关系
            return failCallBack(StatusCode.ERROR_16003, StatusCode.ERROR_16003_TEXT)
        }

        toAmeFriend.status = 1
        friendRepository.save(toAmeFriend)

        // 我 -> 他
        val myFriendData = Friend(
            myUser = myUser,
            toUser = toAmeFriend.myUser,
            status = 1,
        )
        val friendDB = friendRepository.save(myFriendData)

        return successCallBack(friendDB)
    }

    /**
     * 拒绝请求
     */
    @PostMapping(value = ["/friend/rejectRequest"])
    fun rejectFriendRequest(
        friendId: Long, // 密友ID
        isPermanentRefusal: Boolean?, // 是否永久拒绝
    ): BaseCallBack<Any> {
        val myId = ContextHolder.userId

        val toAmeFriend = friendRepository.findById(friendId).getOrNull()
        if (toAmeFriend == null) {
            // 好友关系不存在
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }
        if (toAmeFriend.status == 1) {
            return failCallBack(StatusCode.ERROR_16009, StatusCode.ERROR_16009_TEXT)
        }
        if (toAmeFriend.toUser?.id != myId) {
            return failCallBack(StatusCode.ERROR_16007, StatusCode.ERROR_16007_TEXT)
        }

        if (isPermanentRefusal == true) {
            toAmeFriend.status = -2
        } else {
            toAmeFriend.status = -1
        }
        val save = friendRepository.save(toAmeFriend)

        return successCallBack(save)
    }

    /**
     * 删除好友
     */
    @PostMapping(value = ["/friend/delete"])
    fun deleteFriend(
        friendId: Long, // 密友ID
    ): BaseCallBack<Any> {
        val myId = ContextHolder.userId

        var myUserId = 0L
        var toUserId = 0L

        // 删除自己记录
        val myFriendDB = friendRepository.findById(friendId)
        if (myFriendDB.isPresent) {
            val myFriend = myFriendDB.get()
            myUserId = myFriend.myUser?.id ?: 0
            toUserId = myFriend.toUser?.id ?: 0

            if (myId != myUserId) { // 不是操作自己的信息
                return failCallBack(StatusCode.ERROR_16007, StatusCode.ERROR_16007_TEXT)
            }

            friendRepository.delete(myFriend)
        }

        // 删除对方记录
        val toFriend = friendRepository.findByMyUser_IdAndToUser_Id(toUserId, myUserId)
        if (toFriend != null) {
            friendRepository.delete(toFriend)
        }

        return successCallBack("删除简单，朋友难得。千万不要因为一些小事，失去一个要好的朋友！")
    }

    /**
     * 修改密友备注
     */
    @PostMapping(value = ["/friend/update"])
    fun updateFriend(
        friendId: Long, // 密友ID
        friendAlias: String,
    ): BaseCallBack<Any> {
        val myId = ContextHolder.userId

        val friendDB = friendRepository.findById(friendId)
        if (!friendDB.isPresent) {
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }
        val friend = friendDB.get()

        if (myId != friend.myUser?.id) { // 不是操作自己的信息
            return failCallBack(StatusCode.ERROR_16007, StatusCode.ERROR_16007_TEXT)
        }

        if (MyUtils.isEmpty(friendAlias) || !friendAlias.matches(Regex(Config.REGEX_NICAKNAME))) {
            return failCallBack(StatusCode.ERROR_10003, StatusCode.ERROR_10003_TEXT)
        }
        friend.friendAlias = friendAlias

        friendRepository.save(friend);

        return successCallBack("修改成功")
    }

    /**
     * 获取我的好友
     */
    @PostMapping(value = ["/friend/getMyFriend"])
    fun getMyFriend(
        @RequestParam status: List<Int>?, // -2: 拒绝且不再添加 -1: 拒绝 0: 等待； 1: 同意
        page: Int, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<Friend>> {
        val userId = ContextHolder.userId

        val pageRequest = getBasePageRequest(page, size)
        val friendPage: Page<Friend> =
            if (status == null) { // 不传，则 获取我的好友
                friendRepository.findFriendsByMyUser_IdAndStatusInOrderByUpdateTimeDesc(userId, listOf(1), pageRequest)
            } else {
                friendRepository.findFriendsByMyUser_IdAndStatusInOrderByUpdateTimeDesc(userId, status, pageRequest)
            }

        return successListCallBack(friendPage)
    }

    /**
     * 获取请求我的好友，谁加了我
     */
    @PostMapping(value = ["/friend/getRequestMeFriend"])
    fun getRequestMeFriend(
        @RequestParam status: List<Int>?, // -2: 拒绝且不再添加 -1: 拒绝 0: 等待； 1: 同意
        page: Int, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<Friend>> {
        val userId = ContextHolder.userId

        val pageRequest = getBasePageRequest(page, size)
        val friendPage: Page<Friend> =
            if (status == null) { // 不传，则 获取未同意的好友请求
                friendRepository.findFriendsByToUser_IdAndStatusInOrderByUpdateTimeDesc(userId, listOf(-2, -1, 0), pageRequest)
            } else {
                friendRepository.findFriendsByToUser_IdAndStatusInOrderByUpdateTimeDesc(userId, status, pageRequest)
            }

        return successListCallBack(friendPage)
    }
}