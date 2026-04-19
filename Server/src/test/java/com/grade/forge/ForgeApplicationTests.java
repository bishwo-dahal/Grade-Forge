package com.grade.forge;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import(ForgeApplicationTests.MailTestConfig.class)
class ForgeApplicationTests {

	@TestConfiguration
	static class MailTestConfig {
		@Bean
		JavaMailSender javaMailSender() {
			JavaMailSenderImpl sender = new JavaMailSenderImpl();
			sender.setHost("127.0.0.1");
			sender.setPort(2525);
			return sender;
		}
	}

	@Test
	void contextLoads() {
	}

}
