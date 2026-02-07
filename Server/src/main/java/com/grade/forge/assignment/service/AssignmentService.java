package com.grade.forge.assignment.service;

import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.assignment.repository.RubricRepository;
import com.grade.forge.assignment.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final RubricRepository rubricRepository;
    private final TestCaseRepository testCaseRepository;

}

