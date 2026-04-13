package com.grade.forge.audit.service;

import com.grade.forge.audit.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupLoader implements ApplicationRunner {

    private final LogService logService;
    private final S3Service s3Service;

    @Value("${app.audit.startup.days:30}")
    private int daysToLoad;

    @Override
    public void run(ApplicationArguments args) {
        Path historicalDir = logService.historicalDir();
        LocalDate today = TimeUtil.currentDateCentral();

        for (int i = 1; i <= daysToLoad; i++) {
            LocalDate date = today.minusDays(i);
            String key = s3Service.keyForDate(date);
            Path targetFile = historicalDir.resolve("activity-" + date + ".log");

            s3Service.downloadLogFile(key, targetFile);
        }

        log.info("Startup log loader attempted to fetch {} days of activity logs", daysToLoad);
    }
}

