package com.grade.forge.faculty.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FacultyService implements FacultyServiceInterface {

    private final FacultyRepository facultyRepository;

    public FacultyService(FacultyRepository facultyRepository) {
        this.facultyRepository = facultyRepository;
    }

    @Override
    public Faculty createFaculty(Faculty faculty) {
        return facultyRepository.save(faculty);
    }

    @Override
    public Optional<Faculty> getFacultyById(Long id) {
        return facultyRepository.findById(id);
    }

    @Override
    public Faculty updateFaculty(Long id, Faculty facultyDetails) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));

        if (facultyDetails.getName() != null) {
            faculty.setName(facultyDetails.getName());
        }
        if (facultyDetails.getEmail() != null) {
            faculty.setEmail(facultyDetails.getEmail());
        }
        if (facultyDetails.getDepartment() != null) {
            faculty.setDepartment(facultyDetails.getDepartment());
        }
        if (facultyDetails.getQualifications() != null) {
            faculty.setQualifications(facultyDetails.getQualifications());
        }
        if (facultyDetails.getPhoneNumber() != null) {
            faculty.setPhoneNumber(facultyDetails.getPhoneNumber());
        }
        if (facultyDetails.getOfficeLocation() != null) {
            faculty.setOfficeLocation(facultyDetails.getOfficeLocation());
        }

        return facultyRepository.save(faculty);
    }

    @Override
    public Faculty disableFaculty(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));
        faculty.setActive(false);
        return facultyRepository.save(faculty);
    }


    @Override
    public List<Faculty> getAllFacultyByDepartment(String department) {
        return facultyRepository.findByDepartment(department);
    }

    @Override
    public List<Faculty> getAllActiveFaculty() {
        return facultyRepository.findByActive(true);
    }

    @Override
    public void deleteFaculty(Long id) {
        if (!facultyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Faculty not found with id: " + id);
        }
        facultyRepository.deleteById(id);
    }
}



