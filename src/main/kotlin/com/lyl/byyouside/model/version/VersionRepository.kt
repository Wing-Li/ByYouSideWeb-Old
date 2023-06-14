package com.lyl.byyouside.model.version

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface VersionRepository : JpaRepository<Version, Long> {

    fun findFirstByOrderByReleaseDateDesc(): Version?
}
