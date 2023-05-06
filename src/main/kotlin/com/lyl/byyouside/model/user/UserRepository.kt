package com.lyl.byyouside.model.user

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, Long> {

    /**
     * 通过 用户名 或 手机 查询一个用户
     */
    fun findByUserNameOrPhone(userName: String?, phone: String?): User?

    /**
     * 通过 用户名 查询用户
     */
    fun findByUserName(userName: String?): User?

//    /**
//     * 查看 用户名 是否存在
//     */
//    fun existsByUserName(userName: String): Boolean
//
//    /**
//     * 查看 用户名 是否存在
//     */
//    fun countByUserName(userName: String): Int
}