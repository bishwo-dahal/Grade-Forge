package com.grade.forge.submission.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Serves the on-disk authorship ML model artifact for university admins when {@code ml.authorship-model.path} is set.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/university_admin/authorship-model")
public class UniversityAdminAuthorshipModelController {

    @Value("${ml.authorship-model.path:}")
    private String authorshipModelPath;

    @GetMapping
    public ResponseEntity<?> download() {
        if (authorshipModelPath == null || authorshipModelPath.isBlank()) {
            return notConfigured("Model path is empty. Set ml.authorship-model.path or ML_AUTHORSHIP_MODEL_PATH.");
        }
        Path file = Paths.get(authorshipModelPath.trim()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(file)) {
            log.warn("Authorship model path is not a regular file: {}", file);
            return notConfigured(
                    "No trained model file yet at the configured path. Run Train model from University admin → ML training data, or wait for training to finish.");
        }
        try {
            long size = Files.size(file);
            Resource resource = new FileSystemResource(file);
            String filename = file.getFileName().toString().replace("\"", "");
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentLength(size)
                    .body(resource);
        } catch (Exception e) {
            log.warn("Failed to read authorship model file", e);
            return notConfigured("Could not read the model file.");
        }
    }

    private static ResponseEntity<Map<String, String>> notConfigured(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", message));
    }
}
