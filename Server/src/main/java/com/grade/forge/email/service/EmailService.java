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
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);

            String html = """
                    <html>
                        <body>
                            %s
                    
                            <p>If you have any questions, feel free to reach out to your instructor.</p>
                    
                            <br>
                    
                            <div style="text-align:center;">
                                <table style="margin: 0 auto;">
                                    <tr>
                                        <td style="text-align:right; padding-right:10px;">
                                            <p style="margin:0;">
                                                Best regards,<br>
                                                <strong>Grade Forge</strong>
                                            </p>
                                        </td>
                                        <td>
                                            <img src='cid:logo' width='70'/>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                    
                        </body>
                    </html>
                    """.formatted(content);

            helper.setText(html, true);
            helper.addInline("logo", new ClassPathResource("logo/ulm_logo.png"));
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
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
