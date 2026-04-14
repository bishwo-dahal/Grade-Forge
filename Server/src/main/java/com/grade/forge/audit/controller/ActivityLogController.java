package com.grade.forge.audit.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grade.forge.audit.service.LogService;
import com.grade.forge.audit.service.S3Service;
import com.grade.forge.audit.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.*;
import java.time.format.*;
import java.util.*;
import java.util.stream.Stream;

@RestController
@RequestMapping({"/api/v1/university_admin"})
@RequiredArgsConstructor
public class ActivityLogController {

    private static final Path LOG_DIR      = Path.of("logs");
    private static final String FILE_PREFIX = "activity-";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ObjectMapper objectMapper;
    private final LogService logService;
    private final S3Service s3Service;

    @PostMapping("/activity/upload")
    public ResponseEntity<Void> uploadCurrentActivityLogToS3() {
        Path activeLogFile = logService.activeLogFile();
        String key = s3Service.keyForDate(TimeUtil.currentDateCentral());
        boolean uploaded = s3Service.uploadLogFile(activeLogFile, key);

        if (!uploaded) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping("/activity")
    public ResponseEntity<Map<String, Object>> getActivity(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String user,
            @RequestParam(required = false)    String role,
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String date,
            @RequestParam(required = false)    String start,
            @RequestParam(required = false)    String end,
            @RequestParam(required = false, name = "tz") String timezone
    ) {
        ZoneId zone = resolveZone(timezone);
        boolean dateProvided = date != null && !date.isBlank();
        LocalDate effectiveDate = dateProvided ? parseDateOrDateTime(date) : TimeUtil.currentDateCentral();

        if (dateProvided && effectiveDate == null) {
            return empty(page, size);
        }

        Instant startInstant = parseTimeOnDate(start, effectiveDate, zone);
        Instant endInstant   = parseTimeOnDate(end,   effectiveDate, zone);

        if (startInstant != null && endInstant != null && endInstant.isBefore(startInstant)) {
            return empty(page, size);
        }

        List<Path> files = resolveFiles(effectiveDate, dateProvided);
        List<Map<String, Object>> logs = new ArrayList<>();

        for (Path path : files) {
            readFile(path, user, role, status, startInstant, endInstant, logs);
        }

        logs.sort(Comparator.comparing(
                (Map<String, Object> m) -> parseTimestamp(m.get("timestamp"))
        ).reversed());

        int total     = logs.size();
        int pages     = size > 0 ? (int) Math.ceil(total / (double) size) : 0;
        int fromIndex = Math.max(0, page * size);
        int toIndex   = size > 0 ? Math.min(total, fromIndex + size) : total;

        List<Map<String, Object>> pageContent = fromIndex <= toIndex
                ? logs.subList(fromIndex, toIndex)
                : List.of();

        return ResponseEntity.ok(Map.of(
                "logs",  pageContent,
                "total", total,
                "page",  page,
                "size",  size,
                "pages", pages
        ));
    }

    private List<Path> resolveFiles(LocalDate targetDate, boolean dateProvided) {
        String prefix = FILE_PREFIX + DATE_FMT.format(targetDate);
        List<Path> results = new ArrayList<>();
        Path activeToday = logService.activeLogFile();

        if (!dateProvided && Files.exists(activeToday)) {
            results.add(activeToday);
        }

        results.addAll(findFiles(LOG_DIR, prefix));

        if (results.isEmpty() && Files.exists(activeToday)) {
            results.add(activeToday);
        }

        return results.stream().distinct().sorted().toList();
    }

    private List<Path> findFiles(Path directory, String prefix) {
        if (!Files.isDirectory(directory)) return List.of();
        try (Stream<Path> stream = Files.list(directory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().startsWith(prefix))
                    .sorted()
                    .toList();
        } catch (IOException ex) {
            return List.of();
        }
    }

    private void readFile(Path path, String user, String role, String status,
                          Instant start, Instant end,
                          List<Map<String, Object>> sink) {
        try (Stream<String> lines = Files.lines(path)) {
            lines.map(this::safeParse)
                    .flatMap(Optional::stream)
                    .filter(e -> matches(e, "user",   user))
                    .filter(e -> matches(e, "role",   role))
                    .filter(e -> matches(e, "status", status))
                    .filter(e -> withinTime(e, start, end))
                    .forEach(sink::add);
        } catch (IOException ignored) {}
    }

    private boolean withinTime(Map<String, Object> entry, Instant start, Instant end) {
        Instant ts = parseTimestamp(entry.get("timestamp"));
        if (ts == Instant.MIN) return false;
        if (start != null && ts.isBefore(start)) return false;
        if (end   != null && ts.isAfter(end))    return false;
        return true;
    }

    private Optional<Map<String, Object>> safeParse(String line) {
        if (line == null || line.isBlank()) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(line, MAP_TYPE));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private boolean matches(Map<String, Object> entry, String key, String expected) {
        if (expected == null || expected.isBlank()) return true;
        Object value = entry.get(key);
        return expected.equals(value != null ? value.toString() : null);
    }

    // FIX: handles nanoseconds/microseconds e.g. 2026-03-26T06:44:07.969173Z
    private Instant parseTimestamp(Object value) {
        if (value == null) return Instant.MIN;
        try {
            String raw = value.toString();
            // Trim anything beyond 3 decimal places before Z
            raw = raw.replaceAll("(\\.\\d{3})\\d+(Z)$", "$1$2");
            return Instant.parse(raw);
        } catch (Exception ex) {
            return Instant.MIN;
        }
    }

    private LocalDate parseDateOrDateTime(String raw) {
        if (raw == null || raw.isBlank()) return null;
        List<DateTimeFormatter> formats = List.of(
                DATE_FMT,
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd")
        );
        for (DateTimeFormatter fmt : formats) {
            try { return LocalDate.parse(raw, fmt); } catch (Exception ignore) {}
        }
        try {
            return Instant.parse(raw).atZone(TimeUtil.CENTRAL).toLocalDate();
        } catch (Exception ignore) {
            return null;
        }
    }

    private Instant parseTimeOnDate(String timeRaw, LocalDate date, ZoneId zone) {
        if (timeRaw == null || timeRaw.isBlank() || date == null) return null;
        List<DateTimeFormatter> formats = List.of(
                DateTimeFormatter.ISO_LOCAL_TIME,
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("HH:mm").toFormatter(),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("HH:mm:ss").toFormatter(),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("hh:mm a").toFormatter(),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("hh:mm:ss a").toFormatter()
        );
        for (DateTimeFormatter fmt : formats) {
            try {
                return date.atTime(LocalTime.parse(timeRaw.trim(), fmt))
                        .atZone(zone)
                        .toInstant();
            } catch (Exception ignore) {}
        }
        return null;
    }

    private ZoneId resolveZone(String raw) {
        return TimeUtil.CENTRAL;
    }

    private ResponseEntity<Map<String, Object>> empty(int page, int size) {
        return ResponseEntity.ok(Map.of(
                "logs",  List.of(),
                "total", 0,
                "page",  page,
                "size",  size,
                "pages", 0
        ));
    }
}