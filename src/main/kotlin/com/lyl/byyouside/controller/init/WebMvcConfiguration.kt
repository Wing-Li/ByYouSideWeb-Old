package com.lyl.byyouside.controller.init

import com.lyl.byyouside.controller.filter.UserTokenInterceptor
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebMvcConfiguration : WebMvcConfigurer {

    @Autowired
    private lateinit var userTokenInterceptor: UserTokenInterceptor

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(userTokenInterceptor)
    }
}