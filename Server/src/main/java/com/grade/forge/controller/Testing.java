package com.grade.forge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
@RequestMapping("/test")
public class Testing {

    // Inject the DataSource bean
    @Autowired
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<String> testing() {
        String data;

        try (Connection connection = dataSource.getConnection()) {
            System.out.println("✅ PostgreSQL connection SUCCESS");
            data = connection.getMetaData().getURL();
        } catch (Exception e) {
            System.err.println("❌ PostgreSQL connection FAILED");
            e.printStackTrace();
            return new ResponseEntity<>("Connection FAILED", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>("Connection SUCCESS "+ data, HttpStatus.OK);
    }
}
