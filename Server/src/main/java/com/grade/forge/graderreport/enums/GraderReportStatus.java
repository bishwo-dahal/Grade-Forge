package com.grade.forge.graderreport.enums;

/**
 * Lifecycle status of a grader report run.
 */
public enum GraderReportStatus {
    /** Report created, waiting to be processed. */
    PENDING,
    /** Grader pipeline is running. */
    RUNNING,
    /** Finished successfully; result_json is set. */
    COMPLETED,
    /** Run failed; error_message is set. */
    FAILED
}
