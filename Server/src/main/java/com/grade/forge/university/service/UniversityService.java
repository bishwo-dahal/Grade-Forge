package com.grade.forge.university.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.university.entity.University;
import com.grade.forge.university.repository.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UniversityService implements UniversityServiceInterface{

    @Autowired
    private UniversityRepository universityRepository;

    @Override
    public University createUniversity(University university) {
        university.setName(university.getName().toUpperCase());
        return universityRepository.save(university);
    }

    @Override
    public University disableUniversity(String name) {
        University university = universityRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("University not found with name: " + name));

        university.setActive(false);
        return universityRepository.save(university);
    }
}
