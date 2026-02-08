package com.grade.forge.classmgmt.service;

import com.grade.forge.classmgmt.repository.ClassRepository;
import com.grade.forge.classmgmt.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassService {

    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;

}

