package com.grade.forge.configuration;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the VitePress entry for bare {@code /docs} and {@code /docs/}. The resource handler
 * alone can throw {@link org.springframework.web.servlet.resource.NoResourceFoundException} for
 * those URLs on some Spring MVC versions; forwarding to {@code /docs/index.html} is reliable.
 */
@Controller
public class DocsRootController {

    @GetMapping({"/docs", "/docs/"})
    public String docsRoot() {
        return "forward:/docs/index.html";
    }
}
