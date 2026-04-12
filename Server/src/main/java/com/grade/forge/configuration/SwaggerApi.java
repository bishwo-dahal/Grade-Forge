package com.grade.forge.configuration;


import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
        title="Grade Forge",
        version = "1.0.0.1",
        description = "Comprehensive AI-based code submission and grading system for Universities"
)
)

public class SwaggerApi {
}
