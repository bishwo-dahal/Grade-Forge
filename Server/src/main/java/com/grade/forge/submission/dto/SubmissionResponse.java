package com.grade.forge.submission.dto;

import com.grade.forge.submission.enums.SubmissionStatus;
import com.grade.forge.group.dto.GroupStudentResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResponse {
    private Long id;
    private Long assignmentId;
    private String assignmentName;
    private Long courseId;
    private String courseName;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private List<SubmissionFileResponse> files;
    private Double marks;
    private String feedback;
    private LocalDateTime submittedAt;
    private SubmissionStatus status;
    private Long subGroupId;
    private String subGroupName;
    private List<GroupStudentResponse> subGroupMembers;
}
