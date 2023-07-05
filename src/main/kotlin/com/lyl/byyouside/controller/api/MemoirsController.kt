package com.lyl.byyouside.controller.api

import com.lyl.byyouside.config.ContextHolder
import com.lyl.byyouside.config.StatusCode
import com.lyl.byyouside.controller.base.ApiBaseController
import com.lyl.byyouside.model.base.BaseCallBack
import com.lyl.byyouside.model.memoirs.Memoirs
import com.lyl.byyouside.model.memoirs.MemoirsRepository
import com.lyl.byyouside.model.user.UserInfoRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import java.util.*
import kotlin.jvm.optionals.getOrNull

@RestController
class MemoirsController @Autowired constructor(
    private val memoirsRepository: MemoirsRepository,
    private val userInfoRepository: UserInfoRepository,
) : ApiBaseController() {

    @PostMapping("/memoirs/create")
    fun createMemoirs(
        friendId: Long,
        title: String,
        content: String,
        date: Date?,
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        val user = userInfoRepository.findById(userId).getOrNull()
        userAuth(user)?.let { return it }

        val memoirs = Memoirs(
            friendId = friendId,
            title = title,
            content = content,
            user = user!!,
        )
        date?.let { memoirs.date = it }

        val save = memoirsRepository.save(memoirs)
        return successCallBack(save)
    }

    @PostMapping("/memoirs/update")
    fun updateMemoirs(
        memoirsId: Long,
        title: String?,
        content: String?,
        date: Date?,
    ): BaseCallBack<Any> {
        val memoirsDB = memoirsRepository.findById(memoirsId)
        if (!memoirsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_20000, StatusCode.ERROR_20000_TEXT)
        }

        val memoirs = memoirsDB.get()
        title?.let { memoirs.title = it }
        content?.let { memoirs.content = it }
        date?.let { memoirs.date = it }

        val save = memoirsRepository.save(memoirs)

        return successCallBack(save)
    }

    @PostMapping("/memoirs/delete")
    fun deleteMemoirs(
        id: Long
    ): BaseCallBack<Any> {
        val userId = ContextHolder.userId

        val memoirsDB = memoirsRepository.findById(id)
        if (!memoirsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_20000, StatusCode.ERROR_20000_TEXT)
        }

        val memoirs = memoirsDB.get()
        if (userId != memoirs.user?.id) {
            // 此回忆不是您写的，无法删除
            return failCallBack(StatusCode.ERROR_20001, StatusCode.ERROR_20001_TEXT)
        }

        memoirsRepository.deleteById(id)

        return successCallBack("删除成功")
    }

    @GetMapping("/memoirs/get")
    fun getMemoirsById(
        id: Long
    ): BaseCallBack<Any> {
        val memoirsDB = memoirsRepository.findById(id)
        if (!memoirsDB.isPresent) {
            return failCallBack(StatusCode.ERROR_20000, StatusCode.ERROR_20000_TEXT)
        }

        return successCallBack(memoirsDB.get())
    }

    @GetMapping(value = ["/memoirs/list"])
    fun getAllMemoirs(
        friendId: Long,
        page: Int?, // page 从 1 开始
        size: Int?,
    ): BaseCallBack<MutableList<Memoirs>> {
        val pageRequest = getBasePageRequest(page, size)
        val findAll = memoirsRepository.findDiariesByFriendIdOrderByDateDesc(friendId, pageRequest)
        return successListCallBack(findAll)
    }

}
