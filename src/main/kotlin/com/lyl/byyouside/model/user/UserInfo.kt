package com.lyl.byyouside.model.user

import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.*
import org.hibernate.annotations.UpdateTimestamp
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

/**
 * 用户表
 *
 * 'user' 是 H2 的关键字，不能使用 user 作为表名
 *
 */
@Entity
@EntityListeners(AuditingEntityListener::class)
data class UserInfo(

    @Id
    @GeneratedValue(generator = "user_seq", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "user_seq", sequenceName = "USER_SEQ", allocationSize = 1, initialValue = 10000)
    @Column(unique = true)
    var id: Long? = null,


    @Column(unique = true, nullable = false, length = 20)
    var userName: String = "",
    var email: String = "",

    @JsonIgnore
    @Column(nullable = false)
    var password: String = "",

    @Column(length = 20)
    var nickName: String = "",

    var icon: String = "",

    var gender: Int = 0,

    @Column(length = 200)
    var introduction: String? = "",

    var birthday: String? = "",

    var vipLevel: Int? = 0,
    var vipFrom: String? = null, // ios android admin ,当充值类型为 ios 时，充值时间就不准确了。

    /**
     * 封号时间, 封号天数
     */
    var closeDate: Int? = 0,

    // 用户注销
    var isDestroy: Boolean? = null,
    var destroyDate: Date? = null,
    @JsonIgnore
    var destroyReason: String? = null,

    // 设备信息更新时，顺便更新用户表里的数据，方便获取
    var locationAddress: String? = "",
    var locationLongitude: Double? = 0.0,
    var locationLatitude: Double? = 0.0,
    var locationTime: Date? = null,

    // 修改密码时的验证码
    @JsonIgnore
    var code: String? = null,
    @JsonIgnore
    var codeDate: Date? = null,

    // 云信IM 的用户名，密码为 用户名+用户名
    var imAccountId: String? = null,

    // 身份 admin: 管理员
    @JsonIgnore
    var status: String? = null,

    ) {

    var token = ""

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

}