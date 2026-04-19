package com.grade.forge.canvas.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class CanvasConfiguration {

    @org.springframework.beans.factory.annotation.Value("${canvas.base-url}")
    private String baseUrl;

    @Value("${canvas.token}")
    private String token;

    @Bean
    public RestClient canvasRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + token)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}