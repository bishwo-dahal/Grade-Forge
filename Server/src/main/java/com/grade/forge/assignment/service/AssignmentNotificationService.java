package com.grade.forge.assignment.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.email.service.EmailService;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Sends "new assignment" email to enrolled students; shared by primary assignment create and section sync.
 */
@Service
@RequiredArgsConstructor
public class AssignmentNotificationService {

    private final EnrollmentRepository enrollmentRepository;
    private final EmailService emailService;

    public void notifyEnrolledNewAssignment(Assignment assignment) {
        List<Enrollment> enrolledStudents = enrollmentRepository.findByCourse_Id(assignment.getCourse().getId()).stream()
                .filter(enrollment -> EnrolledStatus.ENROLLED.equals(enrollment.getEnrolledStatus()))
                .toList();

        if (enrolledStudents.isEmpty()) {
            return;
        }

        String[] recipientEmails = enrolledStudents.stream()
                .map(enrollment -> enrollment.getStudent().getUser().getEmail())
                .toArray(String[]::new);

        String subject = "New Assignment: " + assignment.getName() + " Course: " + assignment.getCourse().getName();

        String courseName = assignment.getCourse().getName();
        String assignmentName = assignment.getName();
        String description = assignment.getDescription() != null
                ? assignment.getDescription() : "No description provided";
        String totalPoints = String.valueOf(assignment.getTotalPoints());

        final java.time.format.DateTimeFormatter humanDateTime =
                java.time.format.DateTimeFormatter.ofPattern("MMMM d yyyy h:mm a");
        String availableFrom = assignment.getAvailableFrom() != null
                ? assignment.getAvailableFrom().format(humanDateTime) : "Not specified";
        String dueDate = assignment.getDueDate() != null
                ? assignment.getDueDate().format(humanDateTime) : "Not specified";

        String countdown;
        if (assignment.getDueDate() == null) {
            countdown = "No deadline";
        } else {
            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                    java.time.LocalDate.now(),
                    assignment.getDueDate().toLocalDate()
            );

            if (daysRemaining > 1) {
                countdown = daysRemaining + " days";
            } else if (daysRemaining == 1) {
                countdown = "1 day";
            } else if (daysRemaining == 0) {
                countdown = "today";
            } else {
                countdown = Math.abs(daysRemaining) + " days ago";
            }
        }

        String content = String.format("""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">

<table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
       style="background-color:#9A2236;">
  <tr>
    <td style="padding:44px 48px 38px;">
      <table role="presentation" width="100%%">
        <tr>
          <td width="60" valign="middle">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);
                        border-radius:12px;text-align:center;line-height:48px;">
              <img src="https://grade-forge.s3.us-east-2.amazonaws.com/email_logo/logo.png"
                   width="45" height="45" style="display:block;border:0;" />
            </div>
          </td>
          <td style="padding-left:16px;color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">
            Grade Forge · ULM
          </td>
        </tr>
      </table>
      <div style="margin-top:20px;display:inline-block;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.3);color:#ffffff;font-size:11px;">
        %s
      </div>
      <h1 style="color:#ffffff;font-family:Georgia,serif;font-size:30px;margin-top:20px;">
        New Assignment <span style="color:#ffdcb4;">Posted</span>
      </h1>
    </td>
  </tr>
</table>

<table role="presentation" width="100%%">
  <tr>
    <td style="padding:44px 48px;">
      <p style="font-size:16px;color:#333;">Hello Class,</p>
      <p style="font-size:15px;color:#666;line-height:1.6;">
        A new assignment has been posted for <strong>%s</strong>.
        Please review details below.
      </p>
      <table role="presentation" width="100%%" style="margin-top:25px;border:1px solid #ddd;border-radius:10px;overflow:hidden;">
        <tr style="background-color:#9A2236;">
          <td style="padding:14px;color:#ffffff;font-size:12px;font-weight:bold;">Assignment Details</td>
        </tr>
        <tr>
          <td style="padding:16px;">
            <div style="font-size:11px;color:#999;">Title</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Description</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Total Points</div>
            <div style="font-size:14px;color:#222;">%s pts</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Available From</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Due Date</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%%" style="margin-top:25px;">
        <tr>
          <td style="padding:16px;background:#fff8ee;border:1px solid #f5d89a;border-radius:10px;color:#7a5000;font-size:13px;">
            <strong>Deadline:</strong> Within %s
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:30px;">
        <a href="https://www.gradeforge.tech"
           style="display:inline-block;background-color:#9A2236;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:30px;font-weight:bold;">
          Open Assignment →
        </a>
      </div>
    </td>
  </tr>
</table>
</body>
</html>
""",
                courseName,
                courseName,
                assignmentName,
                description,
                totalPoints,
                availableFrom,
                dueDate,
                countdown
        );

        emailService.sendEmailsWithHtml(recipientEmails, subject, content);
    }
}
