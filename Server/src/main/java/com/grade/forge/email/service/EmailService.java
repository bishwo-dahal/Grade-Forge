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
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: #f2f2f5;
        font-family: 'DM Sans', Arial, sans-serif;
        padding: 40px 20px;
      }
      .email-wrapper { max-width: 620px; width: 100%%; margin: 0 auto; }
      .email-card {
        background: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 8px 40px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
      }
      .email-body { padding: 0 48px 36px; background: #fff; }
      /* DIVIDER */
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #e8e8e8 30%%, #e8e8e8 70%%, transparent);
        margin: 0 0 28px;
      }
      /* HELP TEXT */
      .help-text { font-size: 14px; color: #777; line-height: 1.65; text-align: center; margin-bottom: 28px; }
      .help-text a { color: #8b1a2a; font-weight: 500; text-decoration: none; }
      /* FOOTER */
      .email-footer {
        background: #f7f7f7;
        border-top: 1px solid #ebebeb;
        padding: 28px 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .footer-brand { display: flex; align-items: center; gap: 14px; }
      .footer-logo-wrap {
        width: 52px; height: 52px;
        border-radius: 50%%;
        background: linear-gradient(135deg, #6b0f1a, #a0243a);
        display: flex; align-items: center; justify-content: center;
        padding: 5px;
        flex-shrink: 0;
      }
      .footer-logo-wrap img { width: 100%%; height: 100%%; border-radius: 50%%; object-fit: contain; }
      .footer-brand-name { font-size: 13px; font-weight: 700; color: #222; }
      .footer-brand-sub { font-size: 11px; color: #999; margin-top: 2px; }
      .footer-meta { text-align: right; font-size: 11px; color: #bbb; line-height: 1.6; }
    </style>
    </head>
    <body>
    <div class="email-wrapper">
      <div class="email-card">

        %s

        <div class="email-footer">
          <div class="footer-brand">
            <div class="footer-logo-wrap">
              <img src="cid:logo" alt="ULM Logo" />
            </div>
            <div>
              <div class="footer-brand-name">Grade Forge</div>
              <div class="footer-brand-sub">University of Louisiana Monroe</div>
            </div>
          </div>
          <div class="footer-meta">
            This is an automated notification.<br>
            &copy; 2026 ULM &middot; Grade Forge Platform
          </div>
        </div>

      </div>
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
