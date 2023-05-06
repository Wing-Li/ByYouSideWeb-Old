package com.lyl.byyouside.model.user

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import org.hibernate.annotations.UpdateTimestamp
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.io.Serializable
import java.util.*

/**
 * 用户表
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,


    @Column(unique = true, nullable = false, length = 20)
    var userName: String = "",

    @Column(nullable = false)
    var password: String = "",

    @Column(nullable = false, length = 20)
    var nickName: String = "",

    var icon: String = "",

    @Column(nullable = false)
    var gender: Int = 0,

    @Column(length = 200)
    var introduction: String = "",

    var birthday: String = "",

    @Column(length = 11)
    var phone: String = "",
    var email: String = "",

    var province: String = "",
    var city: String = "",

    var vipGrade: Int? = 0,

    var closeDate: Long? = 0, // 封号时间


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "friend",
        joinColumns = [JoinColumn(name = "my_user_id")],
        inverseJoinColumns = [JoinColumn(name = "to_user_id")]
    )
    var friends: MutableList<User> = mutableListOf()

) : Serializable {

    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var vipLimitDate: Date? = null // 会员过期时间

    @CreatedDate
    @Column(nullable = false)
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var createTime: Date = Date()

    @UpdateTimestamp
    @Column(nullable = false)
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    var updateTime: Date = Date()


    fun addFriend(friend: User) {
        friends.add(friend)
        friend.friends.add(this)
    }

    fun removeFriend(friend: User) {
        friends.remove(friend)
        friend.friends.remove(this)
    }

}