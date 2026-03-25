package com.grade.forge.audit.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/university_admin")
@RequiredArgsConstructor
public class ActivityLogController {

    private static final String ACTIVE_LOG = "logs/activity.log";
    private static final String ARCHIVE_DIR = "logs/archived";
    private static final String ARCHIVE_PREFIX = "activity-";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ObjectMapper objectMapper;

    @GetMapping("/activity")
    public ResponseEntity<Map<String, Object>> getActivity(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "user", required = false) String user,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "start", required = false) String start,
            @RequestParam(value = "end", required = false) String end
    ) {
        List<Map<String, Object>> logs = new ArrayList<>();

        List<Path> filesToRead = resolveFiles(date);
        Instant startInstant = parseInstant(start);
        Instant endInstant = parseInstant(end);
        for (Path path : filesToRead) {
            readFile(path, user, role, status, startInstant, endInstant, logs);
        }

        logs.sort(Comparator.comparing((Map<String, Object> m) -> parseTimestamp(m.get("timestamp"))).reversed());

        int total = logs.size();
        int pages = size > 0 ? (int) Math.ceil(total / (double) size) : 0;
        int fromIndex = Math.max(0, page * size);
        int toIndex = size > 0 ? Math.min(total, fromIndex + size) : total;
        List<Map<String, Object>> pageContent = fromIndex <= toIndex ? logs.subList(fromIndex, toIndex) : List.of();

        Map<String, Object> response = Map.of(
                "logs", pageContent,
                "total", total,
                "page", page,
                "size", size,
                "pages", pages
        );

        return ResponseEntity.ok(response);
    }

    private List<Path> resolveFiles(String date) {
        if (date == null || date.isBlank()) {
            Path active = Path.of(ACTIVE_LOG);
            return Files.exists(active) ? List.of(active) : List.of();
        }
        LocalDate parsedDate = parseDateOrDateTime(date);
        if (parsedDate == null) {
            return List.of();
        }
        Path archiveDir = Path.of(ARCHIVE_DIR);
        if (!Files.isDirectory(archiveDir)) {
            return List.of();
        }
        String prefix = ARCHIVE_PREFIX + DATE_FORMATTER.format(parsedDate);
        try {
            return Files.list(archiveDir)
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().startsWith(prefix))
                    .sorted()
                    .toList();
        } catch (IOException ex) {
            return List.of();
        }
    }

    private void readFile(Path path, String user, String role, String status, Instant start, Instant end, List<Map<String, Object>> sink) {
        try (var lines = Files.lines(path)) {
            lines.map(this::safeParse)
                    .flatMap(Optional::stream)
                    .filter(entry -> matches(entry, "user", user))
                    .filter(entry -> matches(entry, "role", role))
                    .filter(entry -> matches(entry, "status", status))
                    .filter(entry -> withinTime(entry, start, end))
                    .forEach(sink::add);
        } catch (IOException ignored) {
            // Per requirements, missing or unreadable files yield empty results without error.
        }
    }

    private boolean withinTime(Map<String, Object> entry, Instant start, Instant end) {
        Instant ts = parseTimestamp(entry.get("timestamp"));
        if (start != null && ts.isBefore(start)) {
            return false;
        }
        if (end != null && ts.isAfter(end)) {
            return false;
        }
        return true;
    }

    private Optional<Map<String, Object>> safeParse(String line) {
        try {
            return Optional.of(objectMapper.readValue(line, MAP_TYPE));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private boolean matches(Map<String, Object> entry, String key, String expected) {
        if (expected == null || expected.isBlank()) {
            return true;
        }
        Object value = entry.get(key);
        return expected.equals(value != null ? value.toString() : null);
    }

    private Instant parseTimestamp(Object value) {
        if (value == null) {
            return Instant.MIN;
        }
        try {
            return Instant.parse(value.toString());
        } catch (Exception ex) {
            return Instant.MIN;
        }
    }

    private Instant parseInstant(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (Exception ex) {
            return null;
        }
    }

    private LocalDate parseDateOrDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw, DATE_FORMATTER);
        } catch (Exception ignore) {
        }
        try {
            return Instant.parse(raw).atZone(ZoneOffset.UTC).toLocalDate();
        } catch (Exception ignore) {
            return null;
        }
    }
}

