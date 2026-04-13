package com.grade.forge.audit.service;

import com.grade.forge.audit.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final LogService logService;
    private final S3Service s3Service;

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
            deleteStaleLocalArchiveFiles(archiveFile.getParent());
        } catch (Exception ex) {
            log.error("Daily log rotation failed", ex);
        }
    }

    private void deleteStaleLocalArchiveFiles(Path logsDirectory) {
        try (Stream<Path> stream = Files.list(logsDirectory)) {
            stream.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().matches("activity-\\d{4}-\\d{2}-\\d{2}\\.log"))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ex) {
                            log.warn("Failed to delete stale local archive {}", path, ex);
                        }
                    });
        } catch (IOException ex) {
            log.warn("Failed while cleaning stale local archives", ex);
        }
    }
}


