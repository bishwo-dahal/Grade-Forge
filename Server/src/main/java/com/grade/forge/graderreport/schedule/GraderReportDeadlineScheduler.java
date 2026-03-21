package com.grade.forge.graderreport.schedule;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.graderreport.entity.GraderReport;
import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.enums.GraderReportTriggerType;
import com.grade.forge.graderreport.repository.GraderReportRepository;
import com.grade.forge.graderreport.service.GraderReportQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Creates and enqueues one DEADLINE-triggered grader report per assignment whose deadline has passed,
 * if that assignment does not already have a DEADLINE report.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GraderReportDeadlineScheduler {

    private final AssignmentRepository assignmentRepository;
    private final GraderReportRepository graderReportRepository;
    private final GraderReportQueueService graderReportQueueService;

    @Value("${grader.report.deadline-schedule.enabled:true}")
    private boolean enabled;

    /**
     * Run every hour. Finds assignments past their (late) due date and enqueues one DEADLINE report per assignment
     * that does not yet have one.
     */
    @Scheduled(cron = "${grader.report.deadline-schedule.cron:0 0 * * * ?}")
    @Transactional
    public void runAfterDeadline() {
        if (!enabled) {
            log.trace("Grader report deadline scheduler disabled, skipping");
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Assignment> pastDeadline = assignmentRepository.findWithDeadlineBefore(now);
        if (pastDeadline.isEmpty()) {
            return;
        }

        int created = 0;
        for (Assignment assignment : pastDeadline) {
            if (graderReportRepository.existsByAssignment_IdAndTriggerType(assignment.getId(), GraderReportTriggerType.DEADLINE)) {
                continue;
            }
            GraderReport report = new GraderReport();
            report.setAssignment(assignment);
            report.setTriggerType(GraderReportTriggerType.DEADLINE);
            report.setStatus(GraderReportStatus.PENDING);
            report = graderReportRepository.save(report);
            graderReportQueueService.enqueueGraderReport(report.getId());
            created++;
            log.info("Enqueued DEADLINE grader report for assignment id={}", assignment.getId());
        }

        if (created > 0) {
            log.info("Grader report deadline run: {} new report(s) enqueued for assignments past deadline", created);
        }
    }
}
