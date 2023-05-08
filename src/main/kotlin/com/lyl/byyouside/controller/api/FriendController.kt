package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.friend.Friend
import com.lyl.byyouside.model.friend.FriendRepository
import com.lyl.byyouside.model.user.UserInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController
import java.lang.Exception


@RestController
class FriendController : ApiBaseController() {

    @Autowired
    private lateinit var userRepository: UserInfoRepository

    @Autowired
    private lateinit var friendRepository: FriendRepository

    /**
     * 绑定好友
     */
    @PostMapping(value = ["/bindFriend"])
    @Transactional
    fun bindFriend(
        myId: Long,
        toId: Long,
    ): BaseCallBack<Any> {
        val myUser = userRepository.findById(myId)
        if (!myUser.isPresent) {
            return failCallBack(StatusCode.USER_NAME_16001, StatusCode.USER_NAME_16001_TEXT)
        }

        val toUser = userRepository.findById(toId)
        if (!toUser.isPresent) {
            return failCallBack(StatusCode.USER_NAME_16002, StatusCode.USER_NAME_16002_TEXT)
        }

        val isBind = friendRepository.existsByMyUser_IdAndToUser_Id(myId, toId)
        if (isBind) {
            return failCallBack(StatusCode.USER_NAME_16003, StatusCode.USER_NAME_16003_TEXT)
        }

        val myUserData = myUser.get()
        val toUserData = toUser.get()

        val friendData = Friend(
            myUser = myUserData,
            toUser = toUserData,
        )

        val friendDB = friendRepository.save(friendData)

        return successCallBack(friendDB)
    }

    /**
     * 获取全部用户
     */
    @PostMapping(value = ["/getAllFriend"])
    fun getAllFriend(
    ): BaseCallBack<Any> {

        return try {
            val friendList = friendRepository.findAll()

            successCallBack(friendList)
        } catch (e: Exception) {
            failCallBack(StatusCode.USER_NAME_16000, StatusCode.USER_NAME_16000_TEXT)
        }
    }

    /**
     * 获取我的好友
     */
    @PostMapping(value = ["/getMyFriend"])
    fun getMyFriend(
        userId: Long
    ): BaseCallBack<Any> {

        return try {
            val friendList = friendRepository.findFriendsByMyUser_IdOrToUser_IdOrderByUpdateTimeDesc(userId, userId)

            successCallBack(friendList)
        } catch (e: Exception) {
            failCallBack(StatusCode.USER_NAME_16000, StatusCode.USER_NAME_16000_TEXT)
        }
    }
}