package com.lyl.byyouside.config

object ContextHolder {
    var context = ThreadLocal<Long>()
    var userId: Long
        get() = context.get()
        set(userId) {
            context.set(userId)
        }

    fun shutdown() {
        context.remove()
    }
}