package com.grade.forge.canvas.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.canvas.dto.CanvasAssignmentResponseDto;
import com.grade.forge.canvas.dto.CanvasStudentDto;
import com.grade.forge.canvas.dto.GradeRequest;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CanvasAssignmentService {


    private final RestClient canvasRestClient;
    private final ObjectMapper objectMapper;

    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;



    public void publishAssignment(Long courseId, Long assignmentId) {
        // Implement logic to publish assignment to Canvas using canvasRestClient
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Assignment assignmentEntity = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (course.getCanvasCourseId() == null) {
            throw new ResourceNotFoundException("Canvas course id is not configured for course: " + courseId);
        }

        Map<String, Object> assignment = Map.of(
                "assignment", Map.of(
                        "name", assignmentEntity.getName(),
                        "description", assignmentEntity.getDescription(),
                        "points_possible", assignmentEntity.getTotalPoints(),
                        "due_at", assignmentEntity.getDueDate(),
                        "lock_at", assignmentEntity.getLateDueDate(),
                        "published", true
                )
        );

        CanvasAssignmentResponseDto assignmentResponse =canvasRestClient.post()
                .uri("/api/v1/courses/{courseId}/assignments", course.getCanvasCourseId())
                .body(assignment)
                .retrieve()
                .body(CanvasAssignmentResponseDto.class);

        if (assignmentResponse == null) {
            throw new IllegalStateException("Canvas did not return an assignment response");
        }

        Long canvasAssignmentId = Objects.requireNonNull(
                assignmentResponse.getId(),
                "Canvas did not return an assignment id"
        );
        assignmentEntity.setCanvasAssignmentId(canvasAssignmentId);
        assignmentRepository.save(assignmentEntity);
    }


    public List<CanvasStudentDto> getCourseStudents(Long courseId) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        if (course.getCanvasCourseId() == null) {
            throw new ResourceNotFoundException("Canvas course id is not configured for course: " + courseId);
        }

        String response = canvasRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/courses/{courseId}/users")
                        .queryParam("enrollment_type[]", "student")
                        .queryParam("include[]", "enrollments")
                        .queryParam("enrollment_state[]", "active")
                        .build(course.getCanvasCourseId()))
                .retrieve()
                .body(String.class);

        if (response == null || response.isBlank()) {
            return List.of();
        }

        try {
            JsonNode root = objectMapper.readTree(response);
            List<CanvasStudentDto> students = new ArrayList<>();

            for (JsonNode node : root) {
                JsonNode studentEnrollment = findStudentEnrollment(node.path("enrollments"));
                students.add(CanvasStudentDto.builder()
                        .id(node.path("id").asLong())
                        .name(node.path("name").asText(null))
                        .loginId(node.path("login_id").asText(null))
                        .state(studentEnrollment.path("enrollment_state").asText(null))
                        .createdAt(studentEnrollment.path("created_at").asText(null))
                        .build());
            }

            return students;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to parse Canvas student response", exception);
        }
    }

    public String postStudentGrade(Long courseId, Long assignmentId, Long studentId, Double points, String feedback) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (course.getCanvasCourseId() == null || course.getCanvasCourseId().isBlank()) {
            throw new ResourceNotFoundException("Canvas course id is not configured for course: " + courseId);
        }

        if (assignment.getCanvasAssignmentId() == null) {
            throw new ResourceNotFoundException("Canvas assignment id is not configured for assignment: " + assignmentId);
        }

        if (student.getCanvasUserId() == null || student.getCanvasUserId().isBlank()) {
            throw new ResourceNotFoundException("Canvas user id is not configured for student: " + studentId);
        }

        if (points == null) {
            throw new IllegalArgumentException("Points are required");
        }

        GradeRequest requestBody = new GradeRequest();
        GradeRequest.Submission submission = new GradeRequest.Submission();
        submission.setPosted_grade(points);
        requestBody.setSubmission(submission);

        if (feedback != null && !feedback.isBlank()) {
            GradeRequest.Comment comment = new GradeRequest.Comment();
            comment.setText_comment(feedback);
            requestBody.setComment(comment);
        }

        String response = canvasRestClient.put()
                .uri("/api/v1/courses/{courseId}/assignments/{assignmentId}/submissions/{userId}",
                        course.getCanvasCourseId(), assignment.getCanvasAssignmentId(), student.getCanvasUserId())
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return response != null ? response : "success";
    }

    private JsonNode findStudentEnrollment(JsonNode enrollments) {
        if (!enrollments.isArray()) {
            return MissingNode.getInstance();
        }

        for (JsonNode enrollment : enrollments) {
            if ("StudentEnrollment".equals(enrollment.path("type").asText())) {
                return enrollment;
            }
        }

        return MissingNode.getInstance();
    }


}
