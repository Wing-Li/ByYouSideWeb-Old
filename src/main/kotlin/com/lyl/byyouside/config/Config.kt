package com.lyl.byyouside.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.stereotype.Component

//SpringBoot四种读取properties文件的方式 ： https://www.jianshu.com/p/05069c601059
@Component
@ConfigurationProperties(prefix = "com.lyl")
class Config {

    companion object {
        var title: String? = null

        var description: String? = null

        var baseUrl: String? = null

        var imageHost: String? = null

        // 正则
        val REGEX_USERNAME = "^[a-zA-Z0-9_]{4,20}$"
        val REGEX_EMAIL = "^\\w[-\\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\\.)+[A-Za-z]{2,14}$"
        val REGEX_NICAKNAME = "^[A-Za-z0-9_\\-\\u4e00-\\u9fa5]{1,16}$"
    }


    @Bean
    fun objectMapper(): ObjectMapper {
        return ObjectMapper().disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
    }
}

