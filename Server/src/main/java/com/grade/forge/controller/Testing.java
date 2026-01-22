package com.grade.forge.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class Testing {


    @GetMapping()
    public ResponseEntity<String> testing(){
        return new ResponseEntity<>("Testing", HttpStatus.OK);
    }



}
