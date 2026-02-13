package com.grade.forge;

import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ForgeApplication {

	public static void main(String[] args) {
				SpringApplication.run(ForgeApplication.class, args);

	}

	@Bean
	CommandLineRunner seedUsers(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder
	) {
		return args -> {

			createIfNotExists(
					userRepository,
					passwordEncoder,
					"System Admin",
					"system@gmail.com",
					"admin123",
					Role.SYSTEM_ADMIN
			);

			createIfNotExists(
					userRepository,
					passwordEncoder,
					"University Testing",
					"university@gmail.com",
					"university",
					Role.UNIVERSITY_ADMIN
			);

			createIfNotExists(
					userRepository,
					passwordEncoder,
					"Faculty Test",
					"faculty@gmail.com",
					"faculty",
					Role.FACULTY
			);

			createIfNotExists(
					userRepository,
					passwordEncoder,
					"Student Test",
					"student@gmail.com",
					"student",
					Role.STUDENT
			);
		};
	}

	private void createIfNotExists(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			String name,
			String email,
			String rawPassword,
			Role role
	) {
		if (userRepository.findByEmail(email).isPresent()) {
			return;
		}

		Users user = new Users();
		user.setName(name);
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(rawPassword));
		user.setRole(role);
		userRepository.save(user);

		System.out.println("✅ Created " + role + " → " + email);
	}

}
