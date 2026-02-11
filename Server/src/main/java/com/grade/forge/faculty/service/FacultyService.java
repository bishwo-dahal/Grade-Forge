package com.grade.forge.faculty.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.dto.FacultyCreateRequest;
import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class FacultyService implements FacultyServiceInterface {

    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    public FacultyService(FacultyRepository facultyRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.facultyRepository = facultyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional // This ensures that if any part of the method fails (like saving the faculty after saving the user), the entire transaction will be rolled back, preventing orphaned user records without corresponding faculty records.
    public FacultyResponse createFaculty(FacultyCreateRequest facultyCreateRequest) {
        // Check if email already exists
        if (userRepository.findByEmail(facultyCreateRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with email " + facultyCreateRequest.getEmail() + " already exists");
        }

        Users user = new Users();
        user.setEmail(facultyCreateRequest.getEmail());
        user.setPassword(passwordEncoder.encode(facultyCreateRequest.getPassword()));
        user.setRole(Role.FACULTY);
        user.setName(facultyCreateRequest.getName());

//        User Saving is done first because of the foreign key constraint with faculty. Faculty has a user_id column that references the users table, so we need to have the user saved first to get the generated id to set in the faculty entity.
        Users savedUser = userRepository.save(user);

        Faculty faculty = new Faculty();
        faculty.setName(facultyCreateRequest.getName());
        faculty.setDepartment(facultyCreateRequest.getDepartment().toUpperCase());
        faculty.setEmail(facultyCreateRequest.getEmail());
        faculty.setQualifications(facultyCreateRequest.getQualifications());
        faculty.setPhoneNumber(facultyCreateRequest.getPhoneNumber());
        faculty.setOfficeLocation(facultyCreateRequest.getOfficeLocation());
        faculty.setActive(true);
        faculty.setUser(savedUser);

//        Faculty Saving
        Faculty savedFaculty = facultyRepository.save(faculty);

        // ---- Response Mapping ----
        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(savedFaculty.getId());
        response.setName(savedFaculty.getName());
        response.setDepartment(savedFaculty.getDepartment());
        response.setQualifications(savedFaculty.getQualifications());
        response.setPhoneNumber(savedFaculty.getPhoneNumber());
        response.setOfficeLocation(savedFaculty.getOfficeLocation());
        response.setActive(savedFaculty.getActive());

        response.setUserId(savedUser.getId());
        response.setEmail(savedUser.getEmail());
        response.setRole(savedUser.getRole().toString());

        return response;

    }

    @Override
    public FacultyResponse getFacultyById(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));

        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(faculty.getId());
        response.setName(faculty.getName());
        response.setDepartment(faculty.getDepartment());
        response.setQualifications(faculty.getQualifications());
        response.setPhoneNumber(faculty.getPhoneNumber());
        response.setOfficeLocation(faculty.getOfficeLocation());
        response.setActive(faculty.getActive());

        response.setUserId(faculty.getUser().getId());
        response.setEmail(faculty.getUser().getEmail());
        response.setRole(faculty.getUser().getRole().toString());

        return response;
    }

    @Override
    public FacultyResponse updateFaculty(Long id, Faculty facultyDetails) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));

        if (facultyDetails.getName() != null) {
            faculty.setName(facultyDetails.getName());
        }
        if (facultyDetails.getEmail() != null) {
            // Check if the new email is different from current email and if it already exists
            if (!facultyDetails.getEmail().equals(faculty.getEmail())) {
                if (userRepository.findByEmail(facultyDetails.getEmail()).isPresent()) {
                    throw new IllegalArgumentException("User with email " + facultyDetails.getEmail() + " already exists");
                }
                faculty.setEmail(facultyDetails.getEmail());
                // Also update the user's email
                Users user = faculty.getUser();
                user.setEmail(facultyDetails.getEmail());
                userRepository.save(user);
            }
        }
        if (facultyDetails.getDepartment() != null) {
            faculty.setDepartment(facultyDetails.getDepartment().toUpperCase());
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

        Faculty savedFaculty = facultyRepository.save(faculty);

        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(savedFaculty.getId());
        response.setName(savedFaculty.getName());
        response.setDepartment(savedFaculty.getDepartment());
        response.setQualifications(savedFaculty.getQualifications());
        response.setPhoneNumber(savedFaculty.getPhoneNumber());
        response.setOfficeLocation(savedFaculty.getOfficeLocation());
        response.setActive(savedFaculty.getActive());

        response.setUserId(savedFaculty.getUser().getId());
        response.setEmail(savedFaculty.getUser().getEmail());
        response.setRole(savedFaculty.getUser().getRole().toString());

        return response;
    }

    @Override
    public FacultyResponse disableFaculty(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));
        faculty.setActive(false);
        Faculty savedFaculty = facultyRepository.save(faculty);

        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(savedFaculty.getId());
        response.setName(savedFaculty.getName());
        response.setDepartment(savedFaculty.getDepartment());
        response.setQualifications(savedFaculty.getQualifications());
        response.setPhoneNumber(savedFaculty.getPhoneNumber());
        response.setOfficeLocation(savedFaculty.getOfficeLocation());
        response.setActive(savedFaculty.getActive());

        response.setUserId(savedFaculty.getUser().getId());
        response.setEmail(savedFaculty.getUser().getEmail());
        response.setRole(savedFaculty.getUser().getRole().toString());

        return response;
    }


    @Override
    public List<FacultyResponse> getAllFacultyByDepartment(String department) {
        List<Faculty> faculties = facultyRepository.findByDepartment(department);
        return faculties.stream().map(faculty -> {
            FacultyResponse response = new FacultyResponse();
            response.setFacultyId(faculty.getId());
            response.setName(faculty.getName());
            response.setDepartment(faculty.getDepartment());
            response.setQualifications(faculty.getQualifications());
            response.setPhoneNumber(faculty.getPhoneNumber());
            response.setOfficeLocation(faculty.getOfficeLocation());
            response.setActive(faculty.getActive());

            response.setUserId(faculty.getUser().getId());
            response.setEmail(faculty.getUser().getEmail());
            response.setRole(faculty.getUser().getRole().toString());

            return response;
        }).toList();
    }

    @Override
    public List<FacultyResponse> getAllFaculty() {
        List<Faculty> faculties = facultyRepository.findAll();
        return faculties.stream().map(faculty -> {
            FacultyResponse response = new FacultyResponse();
            response.setFacultyId(faculty.getId());
            response.setName(faculty.getName());
            response.setDepartment(faculty.getDepartment());
            response.setQualifications(faculty.getQualifications());
            response.setPhoneNumber(faculty.getPhoneNumber());
            response.setOfficeLocation(faculty.getOfficeLocation());
            response.setActive(faculty.getActive());

            response.setUserId(faculty.getUser().getId());
            response.setEmail(faculty.getUser().getEmail());
            response.setRole(faculty.getUser().getRole().toString());

            return response;
        }).toList();
    }

    @Override
    public List<FacultyResponse> getAllActiveFaculty() {
        List<Faculty> faculties = facultyRepository.findByActive(true);
        return faculties.stream().map(faculty -> {
            FacultyResponse response = new FacultyResponse();
            response.setFacultyId(faculty.getId());
            response.setName(faculty.getName());
            response.setDepartment(faculty.getDepartment());
            response.setQualifications(faculty.getQualifications());
            response.setPhoneNumber(faculty.getPhoneNumber());
            response.setOfficeLocation(faculty.getOfficeLocation());
            response.setActive(faculty.getActive());

            response.setUserId(faculty.getUser().getId());
            response.setEmail(faculty.getUser().getEmail());
            response.setRole(faculty.getUser().getRole().toString());

            return response;
        }).toList();
    }

    @Override
    @Transactional
    public void deleteFaculty(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));

        Users user = faculty.getUser();

        // Delete faculty first (due to foreign key constraint)
        facultyRepository.deleteById(id);

        // Then delete the associated user
        if (user != null) {
            userRepository.deleteById(user.getId());
        }
    }
}



