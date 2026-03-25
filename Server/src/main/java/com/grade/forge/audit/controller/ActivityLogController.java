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

        boolean dateProvided = date != null && !date.isBlank();
        LocalDate effectiveDate = dateProvided ? parseDateOrDateTime(date) : LocalDate.now(ZoneOffset.UTC);
        if (dateProvided && effectiveDate == null) {
            return empty(page, size);
        }

        List<Path> filesToRead = resolveFiles(effectiveDate, dateProvided);
        Instant startInstant = parseTimeOnDate(start, effectiveDate);
        Instant endInstant = parseTimeOnDate(end, effectiveDate);
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

    private List<Path> resolveFiles(LocalDate parsedDate, boolean dateProvided) {
        if (!dateProvided) {
            Path active = Path.of(ACTIVE_LOG);
            return Files.exists(active) ? List.of(active) : List.of();
        }
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

    private LocalDate parseDateOrDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        // Accept common date formats and full ISO date-times; return date portion in UTC.
        List<DateTimeFormatter> dateFormats = List.of(
                DATE_FORMATTER,
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd")
        );
        for (DateTimeFormatter fmt : dateFormats) {
            try {
                return LocalDate.parse(raw, fmt);
            } catch (Exception ignore) {
                // try next
            }
        }
        try {
            return Instant.parse(raw).atZone(ZoneOffset.UTC).toLocalDate();
        } catch (Exception ignore) {
            return null;
        }
    }

    private Instant parseTimeOnDate(String timeRaw, LocalDate date) {
        if (timeRaw == null || timeRaw.isBlank() || date == null) {
            return null;
        }
        // Try ISO first (e.g., 23:41 or 23:41:05), then common 12/24-hour patterns case-insensitively.
        List<DateTimeFormatter> timeFormats = List.of(
                java.time.format.DateTimeFormatter.ISO_LOCAL_TIME,
                new java.time.format.DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("HH:mm").toFormatter(),
                new java.time.format.DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("HH:mm:ss").toFormatter(),
                new java.time.format.DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("hh:mm a").toFormatter(),
                new java.time.format.DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("hh:mm:ss a").toFormatter()
        );
        for (DateTimeFormatter fmt : timeFormats) {
            try {
                return date.atTime(java.time.LocalTime.parse(timeRaw.trim(), fmt)).toInstant(ZoneOffset.UTC);
            } catch (Exception ignore) {
                // try next
            }
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> empty(int page, int size) {
        Map<String, Object> response = Map.of(
                "logs", List.of(),
                "total", 0,
                "page", page,
                "size", size,
                "pages", 0
        );
        return ResponseEntity.ok(response);
    }
}

