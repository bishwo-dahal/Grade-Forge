package com.grade.forge.configuration;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Forward client-side routes to the React shell. Exclude {@code api} (REST) and {@code docs}
     * (VitePress static site under {@code classpath:/static/docs/}); those are served as files.
     */
    @GetMapping(value = {"/", "/{path:^(?!api)(?!docs)(?!.*\\.).*}"})
    public String forward() {
        return "forward:/index.html";
    }
}
