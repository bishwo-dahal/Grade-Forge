package com.grade.forge.canvas.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.canvas.dto.CanvasStudentDto;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CanvasAssignmentService {


    private final RestClient canvasRestClient;
    private final ObjectMapper objectMapper;

    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;



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

        canvasRestClient.post()
                .uri("/api/v1/courses/{courseId}/assignments", course.getCanvasCourseId())
                .body(assignment)
                .retrieve()
                .body(String.class);
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
