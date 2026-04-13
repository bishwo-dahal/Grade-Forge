package com.grade.forge.audit.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grade.forge.audit.util.TimeUtil;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogService {

    private static final Logger activityLogger = LoggerFactory.getLogger("ACTIVITY_LOGGER");
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private static final Path LOG_DIR = Path.of("logs");
    private static final Path HISTORICAL_DIR = LOG_DIR;

    private final ObjectMapper objectMapper;

    @PostConstruct
    void initPaths() {
        try {
            Files.createDirectories(LOG_DIR);
            Files.createDirectories(HISTORICAL_DIR);
            Path todayFile = activeLogFile();
            if (!Files.exists(todayFile)) {
                Files.writeString(todayFile, "", StandardOpenOption.CREATE);
            }
        } catch (IOException ex) {
            log.error("Failed to initialize logging paths", ex);
        }
    }

    public void log(String role, String user, String action, String details, String status) {
        try {
            Map<String, String> entry = new LinkedHashMap<>();
            Instant instant = TimeUtil.nowCentralMillis();
            ZonedDateTime timestampCentral = instant.atZone(TimeUtil.CENTRAL).truncatedTo(ChronoUnit.MILLIS);
            String timestamp = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(timestampCentral);

            entry.put("timestamp", timestamp);
            entry.put("role", role);
            entry.put("user", user);
            entry.put("ip", resolveClientIp());
            entry.put("action", action);
            entry.put("details", details);
            entry.put("status", status);

            activityLogger.info(objectMapper.writeValueAsString(entry));
        } catch (Exception ex) {
            log.error("Failed to write activity log entry", ex);
        }
    }

    public List<Map<String, Object>> readTodayLogs() {
        return readJsonLines(activeLogFile());
    }

    public List<Map<String, Object>> readHistoricalLogs() {
        List<Map<String, Object>> results = new ArrayList<>();
        if (!Files.isDirectory(HISTORICAL_DIR)) {
            return results;
        }

        try (Stream<Path> stream = Files.list(HISTORICAL_DIR)) {
            stream.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().startsWith("activity-"))
                    .sorted()
                    .forEach(path -> results.addAll(readJsonLines(path)));
        } catch (IOException ex) {
            log.error("Failed to read historical logs", ex);
        }

        return results;
    }

    public Path activeLogFile() {
        return logFileForDate(TimeUtil.currentDateCentral());
    }

    public Path logFileForDate(LocalDate date) {
        return LOG_DIR.resolve("activity-" + date + ".log");
    }

    public Path historicalDir() {
        return HISTORICAL_DIR;
    }

    private List<Map<String, Object>> readJsonLines(Path file) {
        List<Map<String, Object>> results = new ArrayList<>();
        if (!Files.isRegularFile(file)) {
            return results;
        }

        try (Stream<String> lines = Files.lines(file)) {
            lines.map(this::safeParse)
                    .flatMap(Optional::stream)
                    .forEach(results::add);
        } catch (IOException ex) {
            log.error("Failed to read log file {}", file, ex);
        }
        return results;
    }

    private Optional<Map<String, Object>> safeParse(String line) {
        if (line == null || line.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(line, MAP_TYPE));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return "unknown";
            }

            HttpServletRequest request = attributes.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",", 2)[0].trim();
            }
            String remoteAddr = request.getRemoteAddr();
            return remoteAddr != null ? remoteAddr : "unknown";
        } catch (Exception ex) {
            return "unknown";
        }
    }
}





