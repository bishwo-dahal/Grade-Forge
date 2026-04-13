package com.grade.forge.audit.service;

import com.grade.forge.audit.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupLoader implements ApplicationRunner {

    private static final Pattern LOG_FILE_PATTERN = Pattern.compile("^activity-(\\d{4}-\\d{2}-\\d{2})\\.log$");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private final LogService logService;
    private final S3Service s3Service;

    @Value("${app.audit.startup.days:30}")
    private int daysToLoad;

    @Override
    public void run(ApplicationArguments args) {
        syncRecentLogs();
    }

    public void syncRecentLogs() {
        Path historicalDir = logService.historicalDir();
        LocalDate today = TimeUtil.currentDateCentral();
        LocalDate oldestKept = today.minusDays(daysToLoad);

        for (int i = 1; i <= daysToLoad; i++) {
            LocalDate date = today.minusDays(i);
            String key = s3Service.keyForDate(date);
            Path targetFile = historicalDir.resolve("activity-" + date + ".log");

            boolean downloaded = s3Service.downloadLogFile(key, targetFile);
            if (!downloaded) {
                try {
                    Files.deleteIfExists(targetFile);
                } catch (IOException ex) {
                    log.warn("Failed to remove stale local log {}", targetFile, ex);
                }
            }
        }

        pruneOlderLocalLogs(historicalDir, oldestKept, today);

        log.info("Startup log loader attempted to fetch {} days of activity logs", daysToLoad);
    }

    private void pruneOlderLocalLogs(Path logsDir, LocalDate oldestKept, LocalDate today) {
        if (!Files.isDirectory(logsDir)) {
            return;
        }

        try (Stream<Path> stream = Files.list(logsDir)) {
            stream.filter(Files::isRegularFile)
                    .forEach(path -> maybeDeleteOutOfWindow(path, oldestKept, today));
        } catch (IOException ex) {
            log.warn("Failed to prune old local logs in {}", logsDir, ex);
        }
    }

    private void maybeDeleteOutOfWindow(Path path, LocalDate oldestKept, LocalDate today) {
        String fileName = path.getFileName().toString();
        Matcher matcher = LOG_FILE_PATTERN.matcher(fileName);
        if (!matcher.matches()) {
            return;
        }

        try {
            LocalDate fileDate = LocalDate.parse(matcher.group(1), DATE_FORMATTER);
            if (fileDate.isBefore(oldestKept) || fileDate.isAfter(today)) {
                Files.deleteIfExists(path);
            }
        } catch (Exception ex) {
            log.warn("Failed to evaluate local log retention for {}", path, ex);
        }
    }
}

