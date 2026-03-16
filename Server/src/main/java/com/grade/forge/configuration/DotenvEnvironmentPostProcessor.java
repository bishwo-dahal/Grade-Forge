package com.grade.forge.configuration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envFile = resolveEnvFile();
        if (envFile == null) {
            return;
        }

        Map<String, Object> dotenvProperties = new LinkedHashMap<>();
        try {
            for (String line : Files.readAllLines(envFile)) {
                String trimmedLine = line.trim();
                if (trimmedLine.isEmpty() || trimmedLine.startsWith("#")) {
                    continue;
                }

                int equalsIndex = trimmedLine.indexOf('=');
                if (equalsIndex <= 0) {
                    continue;
                }

                String key = trimmedLine.substring(0, equalsIndex).trim();
                String value = trimmedLine.substring(equalsIndex + 1).trim();
                if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) {
                    value = value.substring(1, value.length() - 1);
                }

                // NOTE: Keep shell env vars, JVM system props, and existing Spring config higher priority than .env fallback values.
                if (environment.containsProperty(key) || dotenvProperties.containsKey(key)) {
                    continue;
                }
                dotenvProperties.put(key, value);
            }
        } catch (Exception exception) {
            System.err.println("Warning: could not load .env: " + exception.getMessage());
            return;
        }

        if (!dotenvProperties.isEmpty()) {
            // FIX: Register .env before application.properties placeholders are resolved, including during SpringBootTest startup.
            environment.getPropertySources().addLast(new MapPropertySource("dotenvProperties", dotenvProperties));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    // NOTE: Support running backend from Server/ or repo root so local IDE runs and Maven tests resolve the same .env file.
    private Path resolveEnvFile() {
        Path workingDirectory = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        List<Path> candidates = List.of(
                workingDirectory.resolve(".env"),
                workingDirectory.resolve("Server").resolve(".env")
        );
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
