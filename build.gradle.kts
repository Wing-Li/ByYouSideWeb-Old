import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.1.0-SNAPSHOT"
    id("io.spring.dependency-management") version "1.1.0"
    kotlin("jvm") version "1.8.20"
    kotlin("plugin.spring") version "1.8.20"
}

apply {
    plugin("war")
    plugin("application")
}


group = "com.lyl.byyouside"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

java.manifest {
    val map = HashMap<String, String>()
    map["Main-Class"] = "com.lyl.byyouside.ByYouSideApplication"
    attributes(map)
}

repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
    maven { url = uri("https://repo.spring.io/snapshot") }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("com.h2database:h2")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

tasks.withType<Jar> {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    manifest {
        attributes["Main-Class"] = "com.lyl.byyouside.ByYouSideApplication"
    }
}
