package com.grade.forge;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableRabbit
public class ForgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ForgeApplication.class, args);
    }
}
