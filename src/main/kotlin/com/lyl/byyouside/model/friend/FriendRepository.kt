package com.lyl.byyouside.model.friend

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface FriendRepository : JpaRepository<Friend, Long> {

    fun findFriendsByMyUser_IdAndStatusInOrderByUpdateTimeDesc(myUserId: Long, status: List<Int>, pageable: Pageable): Page<Friend>

    fun findFriendsByToUser_IdAndStatusInOrderByUpdateTimeDesc(toUserId: Long, status: List<Int>, pageable: Pageable): Page<Friend>

    /**
     * 通过 两人ID 获取好友状态
     */
    fun findByMyUser_IdAndToUser_Id(myUserId: Long, toUserId: Long): Friend?

    /**
     * 获取当前的最好伴友。 我的id、是好友、是最好的朋友
     */
    fun findTopByMyUser_IdAndStatusAndCheckBestFriend(myUserId: Long, status: Int, isBestFriend: Boolean): Friend?

}