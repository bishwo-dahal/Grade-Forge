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

    public EnrollmentResponse enrollStudentInCourse(Long studentId, Long courseId,Long canvasId) {
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


            Student canvasStudent = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

            if(canvasStudent != null && !canvasId.toString().equals(canvasStudent.getCanvasUserId())) {
                canvasStudent.setCanvasUserId(canvasId.toString());
               Student s = studentRepository.save(canvasStudent);
                System.out.println(s.getCanvasUserId());
            }




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
</head>

<body style="margin:0; padding:0; background-color:#ffffff;">

<!-- HEADER -->
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
       style="background-color:#9A2236;">
  <tr>
    <td style="padding:44px 48px 38px;">

      <table role="presentation" width="100%%">
        <tr>

          <td width="60" valign="middle">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);
                        border-radius:12px; text-align:center; line-height:48px;">
              <img src="https://grade-forge.s3.us-east-2.amazonaws.com/email_logo/logo.png"
                   width="45" height="45" />
            </div>
          </td>

          <td style="padding-left:16px;">
            <div style="color:#ffffff; font-size:13px; font-weight:600;
                        letter-spacing:0.12em; text-transform:uppercase;">
              Grade Forge · ULM
            </div>
          </td>

        </tr>
      </table>

      <div style="margin-top:20px; display:inline-block;
                  padding:5px 12px; border-radius:20px;
                  border:1px solid rgba(255,255,255,0.3);
                  color:#ffffff; font-size:11px;">
        %s
      </div>

      <h1 style="color:#ffffff; font-family:Georgia, serif;
                 font-size:30px; margin-top:20px;">
        New Course <span style="color:#ffdcb4;">Enrollment</span>
      </h1>

    </td>
  </tr>
</table>

<!-- BODY -->
<table role="presentation" width="100%%">
  <tr>
    <td style="padding:44px 48px; font-family:Arial;">

      <p style="font-size:16px; color:#333;">Hello %s,</p>

      <p style="font-size:15px; color:#666; line-height:1.6;">
        You have been enrolled in <strong>%s</strong>.
        You can now access your course materials and start learning.
      </p>

      <!-- CARD -->
      <table role="presentation" width="100%%"
             style="margin-top:25px; border:1px solid #ddd; border-radius:10px; overflow:hidden;">

        <tr style="background-color:#9A2236;">
          <td style="padding:14px; color:#ffffff; font-size:12px; font-weight:bold;">
            Enrollment Details
          </td>
        </tr>

        <tr>
          <td style="padding:16px;">
            <div style="font-size:11px; color:#999;">Course</div>
            <div style="font-size:14px; color:#222;">%s</div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px; border-top:1px solid #eee;">
            <div style="font-size:11px; color:#999;">Student</div>
            <div style="font-size:14px; color:#222;">%s</div>
          </td>
        </tr>

      </table>

      <!-- BUTTON -->
      <div style="text-align:center; margin-top:30px;">

        <a href="https://www.gradeforge.tech"
           style="display:inline-block;
                  background-color:#9A2236;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 36px;
                  border-radius:30px;
                  font-weight:bold;">
          Open Dashboard →
        </a>

        <div style="margin-top:10px; font-size:12px; color:#aaa;">
          Log in to Grade Forge to start learning
        </div>

      </div>

    </td>
  </tr>
</table>

</body>
</html>
""",
                courseName,
                name,
                courseName,
                courseName,
                name
        );

        emailService.sendEmailsWithHtml(
                new String[]{email},
                "New Course Enrollment - " + courseName,
                content
        );
    }




}
