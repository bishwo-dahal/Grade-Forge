package com.grade.forge.email.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;


@Service
@AllArgsConstructor
public class EmailService {

    private JavaMailSender mailSender;

    @Async
    public void sendEmailWithHtml(String to, String subject, String content) {

        MimeMessage mimeMessage = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);

            String html = """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="margin:0;padding:0;background:#f2f2f5;font-family:Arial,sans-serif;">

  <div style="max-width:820px;margin:0 auto;">

    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.10);">

      <!-- CONTENT -->
      <div>

        %s

      </div>

      <!-- DIVIDER -->
      <div style="height:1px;background:#e8e8e8;margin:0 20px 10px;"></div>

      <!-- HELP TEXT -->
      <div style="text-align:center;font-size:13px;color:#777;line-height:1.6;padding:0 40px 20px;">
        Need help? <a href="#" style="color:#8b1a2a;text-decoration:none;font-weight:bold;">Contact Support</a>
      </div>

      <!-- FOOTER -->
      <div style="background:#f7f7f7;border-top:1px solid #ebebeb;padding:20px 40px;">

        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0">
          <tr>

            <!-- LEFT -->
            <td align="left" valign="middle">
              <table>
                <tr>
                  <td>
                    <div style="
                      width:50px;
                      height:50px;
                      border-radius:50%%;
                      text-align:center;
                      line-height:50px;
                    ">
                      <img src="https://grade-forge.s3.us-east-2.amazonaws.com/email_logo/ulm_logo.png" width="40" height="40" style="border-radius:50%%;" />
                    </div>
                  </td>
                  <td style="padding-left:12px;">
                    <div style="font-size:13px;font-weight:bold;color:#222;">
                      Grade Forge
                    </div>
                    <div style="font-size:11px;color:#999;">
                      University of Louisiana Monroe
                    </div>
                  </td>
                </tr>
              </table>
            </td>

            <!-- RIGHT -->
            <td align="right" valign="middle">
              <div style="font-size:11px;color:#bbb;line-height:1.5;">
                Automated Notification<br>
                &copy; 2026 ULM · Grade Forge
              </div>
            </td>

          </tr>
        </table>

      </div>

    </div>
  </div>

</body>
</html>
""".formatted(content);

            helper.setText(html, true);
            helper.setFrom("gradeforgeulm@gmail.com");

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            System.out.println("Email Failed");
            throw new RuntimeException(e);
        }
    }

    @Async
    public void sendEmailsWithHtml(String[] recipients, String subject, String content) {
        for (String to : recipients) {
            sendEmailWithHtml(to, subject, content);
        }
    }



}
