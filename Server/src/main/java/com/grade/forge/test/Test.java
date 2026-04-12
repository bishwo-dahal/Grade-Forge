package com.grade.forge.test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;

@RestController
@RequestMapping("/test")
public class Test {

    @Autowired
    private DataSource dataSource;

    @GetMapping
    public String test() {
        String databaseUrl;
        try(var connection = dataSource.getConnection()) {
            databaseUrl = connection.getMetaData().getURL();
        } catch (Exception e) {
            return "Failed to connect to the database."+ " Error: " + e.getMessage();
        }

        return "Your Java application is running!"+ " Database URL: " + databaseUrl;
    }
}
