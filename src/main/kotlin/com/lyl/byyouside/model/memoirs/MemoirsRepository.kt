package com.lyl.byyouside.model.memoirs

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MemoirsRepository : JpaRepository<Memoirs, Long> {

    fun findMemoirsByFriendIdInOrderByDateDesc(friendId: List<Long>, pageable: Pageable): Page<Memoirs>

    fun deleteByFriendIdIn(friendIds: List<Long>): Int
}