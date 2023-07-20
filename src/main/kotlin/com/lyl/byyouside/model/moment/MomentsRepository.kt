package com.lyl.byyouside.model.moment

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface MomentsRepository : JpaRepository<Moments, Long> {

    fun findMomentsByFriendIdInOrderByDateDesc(friendId: List<Long>, pageable: Pageable): Page<Moments>

    fun deleteByFriendIdIn(friendIds: List<Long>): Int

}