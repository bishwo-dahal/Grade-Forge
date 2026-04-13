package com.grade.forge.audit.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final LogService logService;

    public void log(Authentication authentication, String action, String details, String status) {
        String role = "unknown";
        String user = "anonymous";
        if (authentication != null) {
            user = authentication.getName();
            GrantedAuthority authority = !authentication.getAuthorities().isEmpty()
                    ? authentication.getAuthorities().iterator().next()
                    : null;
            role = authority != null ? authority.getAuthority() : role;
        }
        log(role, user, action, details, status);
    }

    public void log(String role, String user, String action, String details, String status) {
        logService.log(role, user, action, details, status);
    }
}