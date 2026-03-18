package com.grade.forge;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
@EnableRabbit
public class ForgeApplication {

    public static void main(String[] args) {
        // REFACTOR: Restore the original bootstrap .env loader here so backend startup has one environment-loading path.
        loadEnvIfPresent();
        SpringApplication.run(ForgeApplication.class, args);
    }

    /**
     * Load .env from the current working directory into system properties so that
     * ${SPRING_DATASOURCE_URL} etc. in application.properties are resolved.
     * Only sets a property if not already set (env vars / -D from shell win).
     * No-op if .env is missing (e.g. in production where env is set by the host).
     */
    private static void loadEnvIfPresent() {
        Path envFile = Paths.get(System.getProperty("user.dir", ".")).resolve(".env");
        if (!Files.isRegularFile(envFile)) {
            return;
        }
        try {
            for (String line : Files.readAllLines(envFile)) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eq = line.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) {
                    value = value.substring(1, value.length() - 1);
                }
                if (System.getProperty(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: could not load .env: " + e.getMessage());
        }
    }
}
