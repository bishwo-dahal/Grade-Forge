package com.grade.forge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class ForgeApplication {

	public static void main(String[] args) {
				SpringApplication.run(ForgeApplication.class, args);

	}
}
