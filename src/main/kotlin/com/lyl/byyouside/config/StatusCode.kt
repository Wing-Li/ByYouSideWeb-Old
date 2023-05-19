package com.lyl.byyouside.config

object StatusCode {
    const val USER_NAME_10000 = 10000
    const val USER_NAME_10000_TEXT = "网络异常，请稍后再试"

    // 比较公用的
    const val BASE_TITLE_EMPYT = 20000
    const val BASE_TITLE_EMPYT_TEXT = "标题不能为空"
    const val BASE_CONTENT_EMPYT = 20001
    const val BASE_CONTENT_EMPYT_TEXT = "内容不能为空"
    const val BASE_REQUEST_EMPYT = 20003
    const val BASE_REQUEST_EMPYT_TEXT = "请求的内容不存在"

    // 创建用户
    const val USER_NAME_10001 = 10001
    const val USER_NAME_10001_TEXT = "用户名必须是4-20位的字母/数字/下划线组合"
    const val USER_NAME_10002 = 10002
    const val USER_NAME_10002_TEXT = "密码必须在6-32位字符之间"
    const val USER_NAME_10003 = 10003
    const val USER_NAME_10003_TEXT = "昵称需为1-16位的中文/字母/数字/下划线/横线组合"
    const val USER_NAME_10004 = 10004
    const val USER_NAME_10004_TEXT = "用户名已经存在"
    const val USER_NAME_10005 = 10005
    const val USER_NAME_10005_TEXT = "请检查邮箱是否正确"
    const val USER_NAME_10006 = 10006
    const val USER_NAME_10006_TEXT = "简介不能超过200个字"

    // 更新用户
    const val USER_NAME_11001 = 11001
    const val USER_NAME_11001_TEXT = "没有此用户"
    const val USER_NAME_11002 = 11002
    const val USER_NAME_11002_TEXT = "密码错误"
    const val USER_NAME_11003 = 11003
    const val USER_NAME_11003_TEXT = "用户名密码不能为空"

    // 修改密码 12
    // 查询用户 13
    const val USER_NAME_13001 = 11001
    const val USER_NAME_13001_TEXT = "您的账户被限制登录(天)："

    // 查询用户列表 14
    // 会员充值 15
    const val USER_NAME_15001 = 15001
    const val USER_NAME_15001_TEXT = "没有此用户，请确认用户信息"
    const val USER_NAME_15002 = 15002
    const val USER_NAME_15002_TEXT = "金额不能小于0元"
    const val USER_NAME_15003 = 15003
    const val USER_NAME_15003_TEXT = "此类型VIP不存在，请联系管理员"

    // 绑定密友 16
    const val USER_NAME_16000 = 16000
    const val USER_NAME_16000_TEXT = "绑定失败"
    const val USER_NAME_16001 = 16001
    const val USER_NAME_16001_TEXT = "您的用户信息有误"
    const val USER_NAME_16002 = 16002
    const val USER_NAME_16002_TEXT = "对方用户信息有误"
    const val USER_NAME_16003 = 16003
    const val USER_NAME_16003_TEXT = "你们已经是密友关系"

    // 查询版本 17
    const val USER_NAME_17000 = 17000
    const val USER_NAME_17000_TEXT = "目前没有新版本发布"

    // 配置 18
    const val USER_NAME_18001 = 18001
    const val USER_NAME_18001_TEXT = "H5还没有基本配置，请联系管理员"
    const val USER_NAME_18002 = 18002
    const val USER_NAME_18002_TEXT = "App还没有基本配置，请联系管理员"
}