package com.grade.forge.graderreport.consumer;

import com.grade.forge.graderreport.dto.GraderReportMessage;
import com.grade.forge.graderreport.entity.GraderReport;
import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.repository.GraderReportRepository;
import com.grade.forge.graderreport.service.GraderReportRunnerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RabbitMQ consumer for grader-report jobs. Runs the grader pipeline and updates the GraderReport.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GraderReportConsumer {

    private final GraderReportRepository graderReportRepository;
    private final GraderReportRunnerService graderReportRunnerService;

    private final ConcurrentHashMap<Long, Boolean> processing = new ConcurrentHashMap<>();

    @RabbitListener(queues = "${execution.queue.grader-report-jobs}")
    @Transactional
    public void handleGraderReport(GraderReportMessage message) {
        Long reportId = message.getGraderReportId();
        if (reportId == null) {
            log.warn("Received grader-report message with null report id, ignoring");
            return;
        }

        if (processing.putIfAbsent(reportId, Boolean.TRUE) != null) {
            log.debug("GraderReport {} is already being processed, skipping duplicate delivery", reportId);
            return;
        }

        try {
            processReport(reportId);
        } finally {
            processing.remove(reportId);
        }
    }

    private void processReport(Long reportId) {
        Optional<GraderReport> reportOpt = graderReportRepository.findById(reportId);
        if (reportOpt.isEmpty()) {
            log.warn("GraderReport {} not found; acknowledging message", reportId);
            return;
        }

        GraderReport report = reportOpt.get();
        if (report.getStatus() != GraderReportStatus.PENDING) {
            log.debug("GraderReport {} already in status {}, nothing to do", reportId, report.getStatus());
            return;
        }

        graderReportRunnerService.run(report);
    }
}
