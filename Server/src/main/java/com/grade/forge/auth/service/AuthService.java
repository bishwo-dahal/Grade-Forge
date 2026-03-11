package com.grade.forge.auth.service;

import com.grade.forge.auth.dto.LoginRequest;
import com.grade.forge.auth.dto.PasswordResetRequest;
import com.grade.forge.auth.dto.PasswordUpdateRequest;
import com.grade.forge.auth.dto.SignupRequest;
import com.grade.forge.auth.dto.response.AuthResponse;
import com.grade.forge.configuration.security.JWTHelper;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Objects;


@Service
@RequiredArgsConstructor
@Slf4j

public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTHelper jwtHelper;
    private final UserDetailsService userDetailsService;
    private final StudentRepository studentRepository;

    public AuthResponse login(LoginRequest loginRequest) {
        Users user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + loginRequest.getEmail()));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid password");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtHelper.generateToken(userDetails);
        // NOTE: Always compute this from DB state so student gating is consistent across logins and devices.
        boolean profileCompleted = resolveProfileCompletion(user);

        return AuthResponse.builder()
                .token(token)
                .userId(String.valueOf(user.getId()))
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .profileCompleted(profileCompleted)
                .message("Login successful")
                .build();
    }

    @Transactional
    public AuthResponse signup(SignupRequest signupRequest) {
        if (userRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }


        String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());

        Users newUser = new Users();
        // FIX: Resolve role once so signup cannot silently skip student profile creation when role is absent.
        Role resolvedRole = signupRequest.getRole() != null ? signupRequest.getRole() : Role.STUDENT;

        newUser.setName(signupRequest.getName());
        newUser.setEmail(signupRequest.getEmail());
        newUser.setPassword(encodedPassword);
        newUser.setRole(resolvedRole);
        log.info("Creating user with email={} role={}", newUser.getEmail(), newUser.getRole());
        Users savedUser = userRepository.save(newUser);

        // NOTE: Student signup supports:
        // NOTE: 1) base account only (creates user, profile not complete)
        // NOTE: 2) base account + CWID/major/canvas (creates user + student profile)
        if (resolvedRole == Role.STUDENT) {
            boolean hasCwid = hasText(signupRequest.getCwid());
            boolean hasMajor = hasText(signupRequest.getMajor());
            boolean hasCanvasUserId = hasText(signupRequest.getCanvasUserId());
            boolean hasAnyProfileField = hasCwid || hasMajor || hasCanvasUserId;
            boolean hasAllProfileFields = hasCwid && hasMajor && hasCanvasUserId;

            if (hasAnyProfileField && !hasAllProfileFields) {
                // FIX: Do not accept partial profile data at signup; either send all fields or none.
                throw new IllegalArgumentException("Provide CWID, major, and Canvas ID together.");
            }

            if (hasAllProfileFields) {
                String normalizedCwid = signupRequest.getCwid().trim();
                String normalizedMajor = signupRequest.getMajor().trim();
                String normalizedCanvasUserId = signupRequest.getCanvasUserId().trim();

                if (studentRepository.existsByCwid(normalizedCwid)) {
                    // IMPORTANT: CWID must stay unique in both immediate and deferred registration flows.
                    throw new IllegalArgumentException("Student already exists with CWID: " + normalizedCwid);
                }

                Student student = new Student();
                student.setUser(savedUser);
                student.setCwid(normalizedCwid);
                student.setMajor(normalizedMajor);
                student.setCanvasUserId(normalizedCanvasUserId);
                student.setPreferences(new HashMap<>());
                studentRepository.save(student);
                log.info("Created student profile for userId={} cwid={}", savedUser.getId(), normalizedCwid);
            } else {
                // NOTE: Account is created now; student must complete profile before entering dashboard.
                log.info("Student userId={} created without profile details; completion required before dashboard access.", savedUser.getId());
            }
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtHelper.generateToken(userDetails);
        boolean profileCompleted = resolveProfileCompletion(savedUser);
        log.debug("Generated signup token for userId={}", savedUser.getId());
        return AuthResponse.builder()
                .token(token)
                .userId(String.valueOf(savedUser.getId()))
                .email(savedUser.getEmail())
                .name(savedUser.getName())
                .role(savedUser.getRole())
                .profileCompleted(profileCompleted)
                .message("User registered successfully")
                .build();
    }

    public AuthResponse updatePassword(PasswordUpdateRequest updateRequest) {
        Users user = userRepository.findByEmail(updateRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with Email: " + updateRequest.getEmail()));

        if (!passwordEncoder.matches(updateRequest.getOldPassword(), user.getPassword())) {
            throw new BadCredentialsException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(updateRequest.getNewPassword()));
        Users updatedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(updatedUser.getEmail());
        String token = jwtHelper.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(String.valueOf(updatedUser.getId()))
                .email(updatedUser.getEmail())
                .name(updatedUser.getName())
                .role(updatedUser.getRole())
                .profileCompleted(resolveProfileCompletion(updatedUser))
                .message("Password updated successfully")
                .build();
    }

    public AuthResponse resetPassword(PasswordResetRequest resetRequest) {
        Users user = userRepository.findByEmail(resetRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + resetRequest.getEmail()));

        if(!Objects.equals(resetRequest.getResetToken(), "Gradeforge123")) {
            throw new BadCredentialsException("Invalid reset token");
        }

        user.setPassword(passwordEncoder.encode(resetRequest.getNewPassword()));
        Users updatedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(updatedUser.getEmail());
        String token = jwtHelper.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(String.valueOf(updatedUser.getId()))
                .email(updatedUser.getEmail())
                .name(updatedUser.getName())
                .role(updatedUser.getRole())
                .profileCompleted(resolveProfileCompletion(updatedUser))
                .message("Password reset successfully")
                .build();
    }

    private boolean resolveProfileCompletion(Users user) {
        // NOTE: Only student accounts are gated by profile completion.
        if (user.getRole() != Role.STUDENT) {
            return true;
        }

        // IMPORTANT: Profile is complete only when student row exists and all required fields are present.
        return studentRepository.findByUserId(user.getId())
                .map(student -> hasText(student.getCwid()) && hasText(student.getMajor()) && hasText(student.getCanvasUserId()))
                .orElse(false);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public Users getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}

