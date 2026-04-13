package com.grade.forge.audit.service;

import com.grade.forge.audit.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final LogService logService;
    private final S3Service s3Service;
    private final StartupLoader startupLoader;

    @Scheduled(cron = "${app.audit.rotation.cron}", zone = "America/Chicago")
    public void rotateAndUploadLogs() {
        LocalDate yesterday = TimeUtil.currentDateCentral().minusDays(1);
        Path archiveFile = logService.logFileForDate(yesterday);
        log.info("Audit scheduler triggered for {} with source file {}", yesterday, archiveFile);

        try {
            Files.createDirectories(archiveFile.getParent());
            if (!Files.exists(archiveFile)) {
                log.warn("No archive file found for {} at {}", yesterday, archiveFile);
                return;
            }

            String key = s3Service.keyForDate(yesterday);
            boolean uploaded = s3Service.uploadLogFile(archiveFile, key);
            if (!uploaded) {
                log.error("Scheduled audit upload failed for key {}", key);
                return;
            }

            Files.deleteIfExists(archiveFile);
            CompletableFuture.runAsync(
                    startupLoader::syncRecentLogs,
                    CompletableFuture.delayedExecutor(1, TimeUnit.MINUTES)
            );
            log.info("Scheduled audit upload completed; queued S3 refresh after 1 minute");
        } catch (Exception ex) {
            log.error("Daily log rotation failed", ex);
        }
    }
}



