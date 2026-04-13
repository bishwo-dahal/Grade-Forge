package com.grade.forge.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ActivityLogService {

    private static final Logger activityLogger = LoggerFactory.getLogger("ACTIVITY_LOGGER");
    private static final ObjectMapper mapper = new ObjectMapper();

    public void log(Authentication authentication, String action, String details, String status) {
        String role = "unknown";
        String user = "anonymous";
        if (authentication != null) {
            user = authentication.getName();
            GrantedAuthority authority = authentication.getAuthorities() != null
                    && !authentication.getAuthorities().isEmpty()
                    ? authentication.getAuthorities().iterator().next()
                    : null;
            role = authority != null ? authority.getAuthority() : role;
        }
        log(role, user, action, details, status);
    }

    public void log(String role, String user, String action, String details, String status) {
        try {
            Map<String, String> entry = new LinkedHashMap<>();
            String timestamp = ZonedDateTime.now(ZoneId.of("America/Chicago"))
                    .truncatedTo(ChronoUnit.MILLIS)
                    .toString();

            // FIX: truncate to millis — removes nanoseconds that break Instant.parse()
            entry.put("timestamp", timestamp);
            entry.put("role",      role);
            entry.put("user",      user);
            entry.put("ip",        resolveClientIp());
            entry.put("action",    action);
            entry.put("details",   details);
            entry.put("status",    status);
            activityLogger.info(mapper.writeValueAsString(entry));
        } catch (Exception ignored) {}
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return "unknown";

            HttpServletRequest request = attributes.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",", 2)[0].trim();
            }
            String remoteAddr = request.getRemoteAddr();
            return remoteAddr != null ? remoteAddr : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}