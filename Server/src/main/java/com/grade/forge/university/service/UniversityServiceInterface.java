package com.grade.forge.university.service;

import com.grade.forge.university.entity.University;

public interface UniversityServiceInterface {

    University createUniversity(University university);

    University disableUniversity(String id);

}
