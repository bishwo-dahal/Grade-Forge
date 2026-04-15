package com.grade.forge.canvas.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CanvasAssignmentService {


    private final RestClient canvasRestClient;

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
                            "lock_at",assignmentEntity.getLateDueDate(),
                            "published", true
                    )
            );

            canvasRestClient.post()
                    .uri("/api/v1/courses/{courseId}/assignments", course.getCanvasCourseId())
                    .body(assignment)
                    .retrieve()
                    .body(String.class);
        }





}
