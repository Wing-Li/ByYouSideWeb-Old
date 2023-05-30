package com.lyl.byyouside.model.friend

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface FriendRepository : JpaRepository<Friend, Long> {

    fun findFriendsByMyUser_IdAndStatusInOrderByUpdateTimeDesc(myUserId: Long, status: List<Int>): List<Friend>

    fun findFriendsByToUser_IdAndStatusInOrderByUpdateTimeDesc(toUserId: Long, status: List<Int>): List<Friend>

    fun findByMyUser_IdAndToUser_Id(myUserId: Long, toUserId: Long): Friend?

}