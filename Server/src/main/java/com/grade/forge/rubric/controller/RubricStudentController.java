package com.grade.forge.rubric.controller;


import com.grade.forge.rubric.dto.RubricResponse;
import com.grade.forge.rubric.service.RubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/rubrics")
@RequiredArgsConstructor
public class RubricStudentController {

    private final RubricService rubricService;

    @GetMapping("/{id}")
    public ResponseEntity<RubricResponse> getRubric(@PathVariable Long id) {
        RubricResponse response = rubricService.getRubric(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
