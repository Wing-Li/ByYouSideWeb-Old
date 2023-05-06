package com.lyl.byyouside.model.announcement

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AnnouncementRepository : JpaRepository<Announcement, Long> {

    fun findTopByOrderByCreateTimeDesc(): Announcement?

}