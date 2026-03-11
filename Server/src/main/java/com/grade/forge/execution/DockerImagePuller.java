package com.grade.forge.execution;

import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.programminglanguage.repository.ProgrammingLanguageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * On application startup, pulls all Docker images from the programming_languages table
 * so run-tests do not block on first pull. Runs in a background thread so startup is not delayed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(100)
public class DockerImagePuller implements ApplicationRunner {

    private final ProgrammingLanguageRepository programmingLanguageRepository;

    @Override
    public void run(ApplicationArguments args) {
        Thread puller = new Thread(this::pullAllLanguageImages, "docker-image-puller");
        puller.setDaemon(true);
        puller.start();
    }

    private void pullAllLanguageImages() {
        try {
            List<ProgrammingLanguage> languages = programmingLanguageRepository.findAll();
            Set<String> images = languages.stream()
                    .map(ProgrammingLanguage::getDockerImage)
                    .filter(img -> img != null && !img.isBlank())
                    .map(String::trim)
                    .collect(Collectors.toSet());

            if (images.isEmpty()) {
                log.info("No Docker images configured in programming_languages; skipping pre-pull.");
                return;
            }

            log.info("Pre-pulling {} Docker image(s) for run-tests: {}", images.size(), images);
            for (String image : images) {
                try {
                    ProcessBuilder pb = new ProcessBuilder("docker", "pull", image);
                    pb.redirectErrorStream(true);
                    Process process = pb.start();
                    String output = readFully(process.getInputStream());
                    int exit = process.waitFor();
                    if (exit == 0) {
                        log.info("Pulled image: {}", image);
                    } else {
                        log.warn("Failed to pull image {} (exit {}): {}", image, exit, output);
                    }
                } catch (Exception e) {
                    log.warn("Error pulling image {}: {}", image, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Docker image pre-pull failed: {}", e.getMessage());
        }
    }

    private static String readFully(InputStream in) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            return e.getMessage();
        }
    }
}
