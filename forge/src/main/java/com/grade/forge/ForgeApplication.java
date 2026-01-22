package com.grade.forge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class ForgeApplication {

	public static void main(String[] args) {

		ConfigurableApplicationContext context =
				SpringApplication.run(ForgeApplication.class, args);

		try {
			DataSource dataSource = context.getBean(DataSource.class);
			try (Connection connection = dataSource.getConnection()) {
				System.out.println("✅ PostgreSQL connection SUCCESS");
				System.out.println("Connected to: " +
						connection.getMetaData().getURL());
			}
		} catch (Exception e) {
			System.err.println("❌ PostgreSQL connection FAILED");
			e.printStackTrace();
		}
	}
}
