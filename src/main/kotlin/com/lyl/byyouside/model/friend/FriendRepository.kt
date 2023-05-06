package com.lyl.byyouside.model.friend

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface FriendRepository : JpaRepository<Friend, Long> {

    fun findFriendsByMyUser_Id(userId: Long): List<Friend>
}