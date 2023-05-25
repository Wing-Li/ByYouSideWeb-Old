package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.friend.Friend
import com.lyl.byyouside.model.friend.FriendRepository
import com.lyl.byyouside.model.user.UserInfo
import com.lyl.byyouside.model.user.UserInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.PostMapping
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
        myId: Long, // 请求方
        toId: Long, // 被请求的人
    ): BaseCallBack<Any> {
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

        val myUser: UserInfo? = userRepository.findById(myId).getOrNull()
        userAuth(myUser)?.let { return it }

        val toUser = userRepository.findById(toId).getOrNull()
        userAuth(toUser)?.let { return it }

        val friendData = Friend(
            myUser = myUser,
            toUser = toUser,
            status = 0,
        )

        val friendDB = friendRepository.save(friendData)

        return successCallBack(friendDB)
    }

    /**
     * 同意请求
     */
    @PostMapping(value = ["/friend/agreeRequest"])
    fun agreeFriendRequest(
        myId: Long, // 被请求的人
        toId: Long, // 请求方
        friendId: Long,
    ): BaseCallBack<Any> {
        val myUser = userRepository.findById(myId).getOrNull()
        userAuth(myUser)?.let { return it }

        val toUser = userRepository.findById(toId).getOrNull()
        userAuth(toUser)?.let { return it }

        val toFriend = friendRepository.findById(friendId).getOrNull()
        if (toFriend == null) {
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }

        if (toFriend.toUser?.id != myId) {
            return failCallBack(StatusCode.ERROR_16007, StatusCode.ERROR_16007_TEXT)
        }

        if (toFriend.status == 1) {
            return failCallBack(StatusCode.ERROR_16003, StatusCode.ERROR_16003_TEXT)
        }

        toFriend.status = 1
        friendRepository.save(toFriend)

        // 我 -> 他
        val myFriendData = Friend(
            myUser = myUser,
            toUser = toUser,
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
        myId: Long, // 被请求的人
        toId: Long, // 请求方
        friendId: Long, // 密友ID
        isPermanentRefusal: Boolean?, // 是否永久拒绝
    ): BaseCallBack<Any> {
        val toFriend = friendRepository.findById(friendId).getOrNull()
        if (toFriend == null) {
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }
        if (toFriend.toUser?.id != myId) {
            return failCallBack(StatusCode.ERROR_16007, StatusCode.ERROR_16007_TEXT)
        }

        if (isPermanentRefusal == true) {
            toFriend.status = -2
        } else {
            toFriend.status = -1
        }
        val save = friendRepository.save(toFriend)

        return successCallBack(save)
    }

    /**
     * 删除好友
     */
    @PostMapping(value = ["/friend/delete"])
    fun deleteFriend(
        friendId: Long, // 密友ID
    ): BaseCallBack<Any> {
        val friendDB = friendRepository.findById(friendId)
        if (!friendDB.isPresent) {
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }
        val friend = friendDB.get()

        friendRepository.delete(friend);

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
        val friendDB = friendRepository.findById(friendId)
        if (!friendDB.isPresent) {
            return failCallBack(StatusCode.ERROR_16008, StatusCode.ERROR_16008_TEXT)
        }
        val friend = friendDB.get()
        friend.friendAlias = friendAlias

        friendRepository.save(friend);

        return successCallBack("修改成功")
    }

    /**
     * 获取我的好友
     */
    @PostMapping(value = ["/getMyFriend"])
    fun getMyFriend(
        userId: Long
    ): BaseCallBack<Any> {
        val friendList = friendRepository.findFriendsByMyUser_IdOrderByUpdateTimeDesc(userId)

        return successCallBack(friendList)
    }
}