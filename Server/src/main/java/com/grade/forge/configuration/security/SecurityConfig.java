package com.grade.forge.configuration.security;

import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@AllArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private JWTAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private JWTAuthenticationFilter jwtAuthenticationFilter;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception{
        httpSecurity.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(request->
                        request
                                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/signup").permitAll()
                                .requestMatchers(
                                        "/v3/api-docs/**",
                                        "/swagger-ui/**",
                                        "/swagger-ui.html",
                                        "/test"
                                ).permitAll()
                                .requestMatchers(req -> !req.getRequestURI().startsWith("/api")).permitAll()
                                .requestMatchers("/api/v1/student/*").hasAnyAuthority("STUDENT","FACULTY","UNIVERSITY_ADMIN","SYSTEM_ADMIN")
                                .requestMatchers("/api/v1/faculty/courses/*","/api/v1/faculty/semester/").hasAuthority("FACULTY")
                                .requestMatchers("/api/v1/faculty/rubrics/**","/api/search/students").hasAuthority("FACULTY")
                                .requestMatchers("/api/v1/university_admin/*").hasAuthority("UNIVERSITY_ADMIN")
                                .requestMatchers("/api/v1/system_admin/university/*").hasAuthority("SYSTEM_ADMIN")
                                .anyRequest().authenticated()
                );

        httpSecurity.sessionManagement(session->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        httpSecurity.exceptionHandling(e->e.authenticationEntryPoint(jwtAuthenticationEntryPoint));
        httpSecurity.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception{
        return configuration.getAuthenticationManager();
    }
}
