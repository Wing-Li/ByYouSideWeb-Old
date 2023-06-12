package com.lyl.byyouside.utils

import cn.hutool.core.lang.Dict
import cn.hutool.extra.mail.MailAccount
import cn.hutool.extra.mail.MailUtil
import cn.hutool.extra.template.TemplateConfig
import cn.hutool.extra.template.TemplateUtil


object EmailUtils {

    private var mEMailAccount: MailAccount = MailAccount()

    init {
        mEMailAccount.host = "smtp.163.com"
        mEMailAccount.isAuth = true
        mEMailAccount.isSslEnable = true
        mEMailAccount.socketFactoryClass = "javax.net.ssl.SSLSocketFactory"
        mEMailAccount.socketFactoryPort = 465
        mEMailAccount.port = 465

        mEMailAccount.from = "伴你左右 <bafangke520@163.com>"
        mEMailAccount.user = "bafangke520@163.com"
        mEMailAccount.pass = "WGLPSEPFQFEWVLHR"
        mEMailAccount.isDebug = false
    }

    fun sendCodeHtml(
        verifyCode: String,
        toEmail: String,
    ) {
        val engine = TemplateUtil.createEngine(TemplateConfig("templates", TemplateConfig.ResourceMode.CLASSPATH))
        val template = engine.getTemplate("EmailVerificationCode.html")

        val resultHtml: String = template.render(
            Dict.create().set("verifyCode", verifyCode.toCharArray().toList().map { it.toString() })
        )

        sendHtml(toEmail, "【伴你左右】验证码", resultHtml);
    }

    fun sendMessage(
        toEmail: String,
        title: String,
        content: String,
    ) {
        MailUtil.send(mEMailAccount, toEmail, title, content, false);
    }

    fun sendHtml(
        toEmail: String,
        title: String,
        htmlBody: String,
    ) {
        MailUtil.send(mEMailAccount, toEmail, title, htmlBody, true);
    }

    fun sendGroupMessage(
        toEmailList: List<String>,
        title: String,
        content: String,
    ) {
        MailUtil.send(mEMailAccount, toEmailList, title, content, false)
    }

    fun sendGroupHtml(
        toEmailList: List<String>,
        title: String,
        htmlBody: String,
    ) {
        MailUtil.send(mEMailAccount, toEmailList, title, htmlBody, true)
    }

}