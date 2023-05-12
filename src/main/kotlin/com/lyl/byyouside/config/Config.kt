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
    }


    @Bean
    fun objectMapper(): ObjectMapper {
        return ObjectMapper().disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
    }
}

