package com.lyl.byyouside.config

object StatusCode {
    const val ERROR_10000 = 10000
    const val ERROR_10000_TEXT = "网络异常，请稍后再试"

    // 比较公用的
    const val BASE_TITLE_EMPYT = 20000
    const val BASE_TITLE_EMPYT_TEXT = "标题不能为空"
    const val BASE_CONTENT_EMPYT = 20001
    const val BASE_CONTENT_EMPYT_TEXT = "内容不能为空"
    const val BASE_REQUEST_EMPYT = 20003
    const val BASE_REQUEST_EMPYT_TEXT = "请求的内容不存在"

    // 创建用户
    const val ERROR_10001 = 10001
    const val ERROR_10001_TEXT = "用户名必须是4-20位的字母/数字/下划线组合"
    const val ERROR_10002 = 10002
    const val ERROR_10002_TEXT = "密码必须在6-32位字符之间"
    const val ERROR_10003 = 10003
    const val ERROR_10003_TEXT = "昵称需为1-16位的中文/字母/数字/下划线/横线组合"
    const val ERROR_10004 = 10004
    const val ERROR_10004_TEXT = "用户名已经存在"
    const val ERROR_10009 = 10009
    const val ERROR_10009_TEXT = "邮箱已经存在！邮箱为修改密码必备，请慎重填写！"
    const val ERROR_10005 = 10005
    const val ERROR_10005_TEXT = "请检查邮箱是否正确"
    const val ERROR_10006 = 10006
    const val ERROR_10006_TEXT = "简介不能超过200个字"
    const val ERROR_10007 = 10007
    const val ERROR_10007_TEXT = "请填写邮箱"
    const val ERROR_10008 = 10008
    const val ERROR_10008_TEXT = "邮箱格式错误"
    const val ERROR_10010 = 10010
    const val ERROR_10010_TEXT = "验证码已发送，请耐心等待"
    const val ERROR_10011 = 10011
    const val ERROR_10011_TEXT = "验证码已过期，请重新发送"
    const val ERROR_10012 = 10012
    const val ERROR_10012_TEXT = "验证码错误，请仔细确认"
    const val ERROR_10013 = 10013
    const val ERROR_10013_TEXT = "只有管理员才可以操作"

    // 更新用户
    const val ERROR_11001 = 11001
    const val ERROR_11001_TEXT = "没有此用户"
    const val ERROR_11002 = 11002
    const val ERROR_11002_TEXT = "密码错误"
    const val ERROR_11003 = 11003
    const val ERROR_11003_TEXT = "用户名密码不能为空"

    // 修改密码 12
    // 查询用户 13
    const val ERROR_13001 = 11001
    const val ERROR_13001_TEXT = "您的账户被限制登录(天)："
    const val ERROR_13002 = 11002
    const val ERROR_13002_TEXT = "您的账户已申请注销，重新登录将会取消申请!（可以重复申请）"
    const val ERROR_13003 = 11003
    const val ERROR_13003_TEXT = "您的账户已注销！"
    const val ERROR_13004 = 11004
    const val ERROR_13004_TEXT = "您已经申请注销，请勿重复申请！"

    // 查询用户列表 14
    // 会员充值 15
    const val ERROR_15001 = 15001
    const val ERROR_15001_TEXT = "没有此用户，请确认用户信息"
    const val ERROR_15002 = 15002
    const val ERROR_15002_TEXT = "金额不能小于0元"
    const val ERROR_15003 = 15003
    const val ERROR_15003_TEXT = "您购买的VIP套餐已不存在，请联系管理员"
    const val ERROR_15004 = 15004
    const val ERROR_15004_TEXT = "此VIP类型不存在，请联系管理员"

    // 绑定密友 16
    const val ERROR_16001 = 16001
    const val ERROR_16001_TEXT = "用户信息异常，请重新登陆"
    const val ERROR_16002 = 16002
    const val ERROR_16002_TEXT = "对方用户信息有误"
    const val ERROR_16004 = 16004
    const val ERROR_16004_TEXT = "您的好友账户被限制登录(天)："
    const val ERROR_16003 = 16003
    const val ERROR_16003_TEXT = "你们已经是密友关系，无法重复操作"
    const val ERROR_16005 = 16005
    const val ERROR_16005_TEXT = "已经请求过了"
    const val ERROR_16006 = 16006
    const val ERROR_16006_TEXT = "对方永久拒绝您的请求"
    const val ERROR_16007 = 16007
    const val ERROR_16007_TEXT = "账户信息出错，请重新登录账号"
    const val ERROR_16008 = 16008
    const val ERROR_16008_TEXT = "好友关系不存在"
    const val ERROR_16009 = 16009
    const val ERROR_16009_TEXT = "你们已经是好友，无法重复操作"

    // 查询版本 17
    const val ERROR_17000 = 17000
    const val ERROR_17000_TEXT = "目前没有新版本发布"

    // 配置 18
    const val ERROR_18001 = 18001
    const val ERROR_18001_TEXT = "H5还没有基本配置，请联系管理员"
    const val ERROR_18002 = 18002
    const val ERROR_18002_TEXT = "App还没有基本配置，请联系管理员"

    // 设备信息 19
    const val ERROR_19000 = 19000
    const val ERROR_19000_TEXT = "该用户还没有上传过信息"
}