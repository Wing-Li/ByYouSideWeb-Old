package com.lyl.byyouside.controller.init

import com.lyl.byyouside.controller.filter.UserTokenInterceptor
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebMvcConfiguration : WebMvcConfigurer {

    @Bean
    fun getUserTokenInterceptor(): UserTokenInterceptor {
        return UserTokenInterceptor()
    }

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(getUserTokenInterceptor())
    }
}