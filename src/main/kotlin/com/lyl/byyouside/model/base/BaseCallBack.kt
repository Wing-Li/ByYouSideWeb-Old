package com.lyl.byyouside.model.base

class BaseCallBack<T>(
    var code: Int,
    var message: String,
    var data: T?
) {
    var totalPages: Int? = null
    var currentPage: Int? = null
    var totalElements: Long? = null
    var size: Int? = null
    var isListLast: Boolean? = null
}