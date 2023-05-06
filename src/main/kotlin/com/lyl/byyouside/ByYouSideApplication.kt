package com.lyl.byyouside

import jakarta.annotation.PostConstruct
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.ServletComponentScan
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import java.util.*


// 常用注解解释：https://blog.csdn.net/sulia1234567890/article/details/122298586

@SpringBootApplication
@EnableJpaAuditing
class ByYouSideApplication {

    @PostConstruct
    fun setDefaultTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Shanghai"))
    }
}

fun main(args: Array<String>) {
    runApplication<ByYouSideApplication>(*args)
}
