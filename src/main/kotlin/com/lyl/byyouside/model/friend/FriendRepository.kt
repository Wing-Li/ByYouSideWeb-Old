package com.lyl.byyouside.model.friend

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface FriendRepository : JpaRepository<Friend, Long> {

    fun findFriendsByMyUser_IdOrToUser_IdOrderByUpdateTimeDesc(myUserId: Long, toUserId: Long): List<Friend>

    fun existsByMyUser_IdAndToUser_Id(myUserId: Long, toUserId: Long): Boolean
}