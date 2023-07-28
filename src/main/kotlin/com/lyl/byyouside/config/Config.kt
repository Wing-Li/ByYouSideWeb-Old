package com.lyl.byyouside.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.stereotype.Component

//SpringBoot四种读取properties文件的方式 ： https://www.jianshu.com/p/05069c601059
@Component
class Config {

    companion object {
        // 正则
        val REGEX_USERNAME = "^[a-zA-Z0-9_]{4,20}$"
        val REGEX_EMAIL = "^\\w[-\\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\\.)+[A-Za-z]{2,14}$"
    }

    @Value("\${spring.profiles.active}")
    lateinit var active: String

    @Value("\${com.lyl.title}")
    lateinit var title: String

    @Value("\${com.lyl.description}")
    lateinit var description: String

    @Value("\${com.lyl.baseUrl}")
    lateinit var baseUrl: String

    @Bean
    fun objectMapper(): ObjectMapper {
        return ObjectMapper().disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
    }
}

