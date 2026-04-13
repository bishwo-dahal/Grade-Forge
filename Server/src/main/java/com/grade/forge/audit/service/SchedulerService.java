package com.grade.forge.audit.service;

import com.grade.forge.audit.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final LogService logService;
    private final S3Service s3Service;
    private final StartupLoader startupLoader;

    @Scheduled(cron = "${app.audit.rotation.cron:0 5 0 * * *}", zone = "America/Chicago")
    public void rotateAndUploadLogs() {
        LocalDate yesterday = TimeUtil.currentDateCentral().minusDays(1);
        Path archiveFile = logService.logFileForDate(yesterday);

        try {
            Files.createDirectories(archiveFile.getParent());
            if (!Files.exists(archiveFile)) {
                return;
            }

            String key = s3Service.keyForDate(yesterday);
            boolean uploaded = s3Service.uploadLogFile(archiveFile, key);
            if (!uploaded) {
                return;
            }

            Files.deleteIfExists(archiveFile);
        } catch (Exception ex) {
            log.error("Daily log rotation failed", ex);
        } finally {
            startupLoader.syncRecentLogs();
        }
    }
}



