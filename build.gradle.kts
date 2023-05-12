import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("java")
    id("application")

    id("org.springframework.boot") version "3.0.6"
    id("io.spring.dependency-management") version "1.1.0"
    id("org.jetbrains.kotlin.jvm") version "1.8.20"
    id("org.jetbrains.kotlin.plugin.spring") version "1.8.20"
    id("org.jetbrains.kotlin.plugin.jpa") version "1.8.20"

    id("com.github.johnrengelman.shadow") version "5.2.0"
}

group = "com.lyl.byyouside"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

//repositories {
//    maven { url = uri("https://maven.aliyun.com/repository/central") }
//    maven { url = uri("https://maven.aliyun.com/repository/public") }
//    maven { url = uri("https://maven.aliyun.com/repository/google") }
//    maven { url = uri("https://maven.aliyun.com/repository/gradle-plugin") }
//    maven { url = uri("https://maven.aliyun.com/repository/spring") }
//    maven { url = uri("https://maven.aliyun.com/repository/spring-plugin") }
//    maven { url = uri("https://maven.aliyun.com/repository/apache-snapshots") }
//
//    mavenCentral()
//    maven { url = uri("https://repo.spring.io/milestone") }
//    maven { url = uri("https://repo.spring.io/snapshot") }
//}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.h2database:h2")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

tasks.withType<Jar> {
    //禁掉jar task
    enabled = false
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    manifest {
        attributes["Main-Class"] = "com.lyl.byyouside.ByYouSideApplicationKt"
    }
}

tasks.withType<ShadowJar> {
    enabled = true
    baseName = "byyourside"
    version = "1.0.0"
    //classifier是生成jar包的后缀
    classifier = System.currentTimeMillis().toString()
    project.setProperty("mainClassName", "com.lyl.byyouside.ByYouSideApplicationKt")
}
