package com.grade.forge.coursemgmt.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SectionCourseCreateRequest {

    /** Section label, e.g. A, B, 02 (required). */
    private String section;

    /** Defaults to parent name when omitted or blank. */
    private String name;

    /** Defaults to parent course code when omitted or blank. */
    private String courseCode;
}
