package com.grade.forge.enrollment.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.email.service.EmailService;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.enrollment.dto.EnrollmentResponse;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.student.entity.Student;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public EnrollmentResponse waitListCurrentStudentInCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return waitListStudentInCourse(student, courseId);
    }

    public EnrollmentResponse dropCurrentStudentFromCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return dropStudentFromCourse(student, courseId);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCurrentStudentEnrollments(String userEmail) {
        Student student = getStudentByUserEmail(userEmail);
        return getEnrollmentsForStudent(student);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCourseEnrollments(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        return enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EnrollmentResponse waitListStudentInCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Enrollment existingEnrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElse(null);

        if (existingEnrollment == null) {
            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setEnrolledStatus(EnrolledStatus.WAITLIST);
            enrollment.setEnrolledAt(LocalDateTime.now());

            Enrollment saved = enrollmentRepository.save(enrollment);
            return mapToResponse(saved);
        }
        else{
            existingEnrollment.setEnrolledAt(LocalDateTime.now());
            existingEnrollment.setEnrolledStatus(EnrolledStatus.WAITLIST);
            Enrollment saved = enrollmentRepository.save(existingEnrollment);
            return mapToResponse(saved);
        }


    }

    private EnrollmentResponse dropStudentFromCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + studentId + " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.DROPPED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    public EnrollmentResponse enrollCurrentStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentById(studentId);
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + student.getId()+ " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    public EnrollmentResponse dropStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentById(studentId);
        return dropStudentFromCourse(student, courseId);
    }


    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCurrentStudentWaitlistedEnrollments(String userEmail) {
        Student student = getStudentByUserEmail(userEmail);
        return enrollmentRepository.findByStudent_Id(student.getId()).stream()
                .filter(enrollment -> EnrolledStatus.WAITLIST.equals(enrollment.getEnrolledStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    protected List<EnrollmentResponse> getEnrollmentsForStudent(Student student) {
        Long studentId = student.getId();
        return enrollmentRepository.findByStudent_Id(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Student getStudentByUserEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + email));
    }

    private Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        Student student = enrollment.getStudent();
        String studentName = student != null && student.getUser() != null ? student.getUser().getName() : null;
        Course course = enrollment.getCourse();
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(student != null ? student.getId() : null)
                .studentName(studentName)
                .courseId(course != null ? course.getId() : null)
                .courseName(course != null ? course.getName() : null)
                .enrolledAt(enrollment.getEnrolledAt())
                .enrolledStatus(enrollment.getEnrolledStatus())
                .grade(enrollment.getGrade())
                .studentEmail(enrollment.getStudent().getUser().getEmail())
                .build();
    }

    public EnrollmentResponse enrollStudentInCourse(Long studentId, Long courseId) {
        if (studentId == null || courseId == null) {
            throw new IllegalArgumentException("studentId and courseId are required");
        }
        Student student = getStudentById(studentId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId())
                .orElseGet(() -> {
                    Enrollment e = new Enrollment();
                    e.setStudent(student);
                    e.setCourse(course);
                    return e;
                });

        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        enrollment.setEnrolledAt(LocalDateTime.now());

        Enrollment saved = enrollmentRepository.save(enrollment);

        // Send emails to all enrolled students (non-blocking)
        try {
            sendEnrolledNotificationEmails(saved);
        } catch (Exception e) {
            System.err.println("Failed to send Enrolled notification emails: " + e.getMessage());
        }

        return mapToResponse(saved);
    }


    private void sendEnrolledNotificationEmails(Enrollment enrollment) {

        Course course = enrollment.getCourse();
        Users user = enrollment.getStudent().getUser();

        String email = user.getEmail();
        String name = user.getName();
        String courseName = course.getName();

        String content = String.format("""
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          .email-header {
            background: linear-gradient(135deg, #6b0f1a 0%%, #8b1a2a 40%%, #a0243a 100%%);
            padding: 44px 48px 38px;
            position: relative;
            overflow: hidden;
          }

          .email-header::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse 70%% 80%% at 90%% 10%%, rgba(255,255,255,0.08) 0%%, transparent 60%%);
          }

          .header-top {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 28px;
            position: relative;
          }

          .logo-mark {
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
          }

          .brand-name {
            color: rgba(255,255,255,0.9);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .course-badge {
            display: inline-block;
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.75);
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 5px 12px;
            border-radius: 20px;
            margin-bottom: 12px;
            position: relative;
          }

          .email-header h1 {
            font-family: Georgia, serif;
            font-size: 30px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.25;
            position: relative;
          }

          .email-header h1 span {
            color: rgba(255,220,180,0.9);
          }

          .email-body {
            padding: 44px 48px 36px;
            background: #fff;
            font-family: Arial, sans-serif;
          }

          .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 10px;
          }

          .intro {
            font-size: 15px;
            color: #666;
            line-height: 1.65;
            margin-bottom: 32px;
          }

          .details-card {
            background: #fafafa;
            border: 1px solid #ebebeb;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 32px;
          }

          .details-card-header {
            background: linear-gradient(90deg, #8b1a2a, #a0243a);
            padding: 14px 24px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .details-card-header svg {
            width: 16px;
            height: 16px;
            fill: rgba(255,255,255,0.8);
          }

          .details-card-header span {
            font-size: 11.5px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.9);
          }

          .detail-row {
            padding: 16px 24px;
            border-bottom: 1px solid #ebebeb;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-size: 11px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
          }

          .detail-value {
            font-size: 14.5px;
            color: #222;
            font-weight: 500;
          }

          .cta-section {
            text-align: center;
            margin-top: 32px;
          }

          .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #6b0f1a 0%%, #a0243a 100%%);
            color: #fff !important;
            text-decoration: none !important;
            font-size: 14px;
            font-weight: 600;
            padding: 15px 36px;
            border-radius: 50px;
            box-shadow: 0 6px 24px rgba(107,15,26,0.30);
          }

          .cta-sub {
            margin-top: 10px;
            font-size: 12.5px;
            color: #aaa;
          }

        </style>
        </head>

        <body>

        <div class="email-header">

          <div class="header-top">
            <div class="logo-mark">
              <img src="cid:logoHeader" width="48" height="44" alt="Grade Forge">
            </div>
            <div class="brand-name"> &nbsp; Grade Forge · ULM</div>
          </div>

          <div class="course-badge">%s</div>

          <h1>New Course <span>Enrollment</span></h1>

        </div>

        <div class="email-body">

          <p class="greeting">Hello %s,</p>

          <p class="intro">
            You have been enrolled in <strong>%s</strong>.
            You can now access your course materials and start learning.
          </p>

          <div class="details-card">

            <div class="details-card-header">
              <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
              <span>Enrollment Details</span>
            </div>

            <div class="detail-row">
              <div class="detail-label">Course</div>
              <div class="detail-value">%s</div>
            </div>

            <div class="detail-row">
              <div class="detail-label">Student</div>
              <div class="detail-value">%s</div>
            </div>

          </div>

          <div class="cta-section">
            <a class="cta-btn" href="http://52.14.92.121:8080">Open Dashboard →</a>
            <div class="cta-sub">Log in to Grade Forge to start learning</div>
          </div>

        </div>

        </body>
        </html>
        """,
                courseName, // badge
                name,       // greeting
                courseName, // intro
                courseName, // course detail
                name         // student detail
        );

        emailService.sendEmailsWithHtml(
                new String[]{email},
                "New Course Enrollment - " + courseName,
                content
        );
    }




}
