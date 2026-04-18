package com.grade.forge.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // VitePress under /docs — register before /** so /docs/* never falls through to the React SPA index.html.
        registry.addResourceHandler("/docs/**")
                .addResourceLocations("classpath:/static/docs/")
                .resourceChain(true)
                .addResolver(vitePressDocsResolver());

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource resource = location.createRelative(resourcePath);
                        if (resource.exists() && resource.isReadable()) {
                            return resource;
                        }
                        if (resourcePath.startsWith("api/")) {
                            return null;
                        }
                        // If this handler wins for /docs/* (mis-ordering), avoid serving the wrong SPA shell.
                        if (resourcePath.startsWith("docs/") || "docs".equals(resourcePath)) {
                            return null;
                        }
                        return location.createRelative("index.html");
                    }
                });
    }

    private static PathResourceResolver vitePressDocsResolver() {
        return new PathResourceResolver() {
            @Override
            protected Resource getResource(String resourcePath, Resource location) throws IOException {
                if (resourcePath == null || resourcePath.isEmpty() || "/".equals(resourcePath)) {
                    return location.createRelative("index.html");
                }
                Resource resource = location.createRelative(resourcePath);
                if (resource.exists() && resource.isReadable()) {
                    return resource;
                }
                if (!resourcePath.endsWith("/")) {
                    Resource indexUnder = location.createRelative(resourcePath + "/index.html");
                    if (indexUnder.exists() && indexUnder.isReadable()) {
                        return indexUnder;
                    }
                } else {
                    Resource indexUnder = location.createRelative(resourcePath + "index.html");
                    if (indexUnder.exists() && indexUnder.isReadable()) {
                        return indexUnder;
                    }
                }
                return location.createRelative("index.html");
            }
        };
    }
}
