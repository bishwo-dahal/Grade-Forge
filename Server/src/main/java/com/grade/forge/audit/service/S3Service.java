package com.grade.forge.audit.service;

import com.grade.forge.storage.service.S3PresignedUrl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3PresignedUrl s3PresignedUrl;

    @Value("${cloud.aws.s3.bucketName}")
    private String bucketName;

    @Value("${app.audit.s3.prefix:logs}")
    private String logsPrefix;

    public String keyForDate(LocalDate date) {
        return logsPrefix + "/activity-" + date + ".log";
    }

    public boolean uploadLogFile(Path file, String key) {
        if (!Files.isRegularFile(file)) {
            return false;
        }
        return uploadViaPresignedPutUrl(file, key);
    }

    public boolean downloadLogFile(String key, Path destination) {
        try {
            Files.createDirectories(destination.getParent());
            return downloadViaPresignedUrl(key, destination);
        } catch (Exception ex) {
            log.error("Failed to download S3 key {} to {}", key, destination, ex);
            return false;
        }
    }

    private boolean downloadViaPresignedUrl(String key, Path destination) {
        HttpURLConnection connection = null;
        try {
            String url = s3PresignedUrl.generateDownloadUrl(bucketName, key);
            log.info("Download URL: {}", url);
            log.info("key: {} destnation: {}", key,destination);
            URL signedUrl = URI.create(url).toURL();

            connection = (HttpURLConnection) signedUrl.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10_000);
            connection.setReadTimeout(20_000);

            int status = connection.getResponseCode();
            if (status == 404) {
                log.error("{} url not found", key);
                return false;
            }
            if (status < 200 || status >= 300) {
                log.error("Presigned download failed for key {} with HTTP status {}", key, status);
                return false;
            }

            try (InputStream in = connection.getInputStream()) {
                Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (Exception ex) {
            log.error("Presigned download failed for key {} to {}", key, destination, ex);
            return false;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private boolean uploadViaPresignedPutUrl(Path file, String key) {
        HttpURLConnection connection = null;
        try {
            String signedUrl = s3PresignedUrl.generateUploadUrl(bucketName, key, "application/json");
            URL url = URI.create(signedUrl).toURL();

            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("PUT");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setConnectTimeout(10_000);
            connection.setReadTimeout(20_000);

            try (OutputStream out = connection.getOutputStream()) {
                Files.copy(file, out);
            }

            int status = connection.getResponseCode();
            return status >= 200 && status < 300;
        } catch (Exception ex) {
            log.error("Presigned upload fallback failed for file {} and key {}", file, key, ex);
            return false;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}






