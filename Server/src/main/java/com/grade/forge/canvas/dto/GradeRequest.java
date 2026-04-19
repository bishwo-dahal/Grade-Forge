package com.grade.forge.canvas.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class GradeRequest {

    private Submission submission;
    private Comment comment;

    @Data
    public static class Submission {
        private Object posted_grade;
    }

    @Data
    public static class Comment {
        private String text_comment;
    }
}


