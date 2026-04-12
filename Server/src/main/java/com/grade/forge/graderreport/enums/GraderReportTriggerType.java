package com.grade.forge.graderreport.enums;

/**
 * How this grader report was triggered.
 */
public enum GraderReportTriggerType {
    /** Run automatically after assignment (late) due date. */
    DEADLINE,
    /** Run when faculty clicks "Generate report". */
    MANUAL
}
