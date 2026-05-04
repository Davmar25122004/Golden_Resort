package com.example.supabase.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeTypeUtils;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:noreply@goldenresort.com}")
    private String from;

    @Value("${app.mail.from-name:Golden Resort}")
    private String fromName;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    public EmailService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /** Envía un email con plantilla Thymeleaf. Si no hay SMTP configurado, solo logea. */
    public boolean enviarConPlantilla(String para, String asunto, String plantilla, Map<String, Object> variables) {
        if (mailSender == null || smtpUser == null || smtpUser.isBlank()) {
            log.warn("SMTP no configurado; email a {} (asunto: {}) omitido. Define SMTP_USER/SMTP_PASS.", para, asunto);
            return false;
        }
        long t0 = System.currentTimeMillis();
        try {
            Context ctx = new Context();
            if (variables != null) variables.forEach(ctx::setVariable);
            String html = templateEngine.process(plantilla, ctx);
            long tRender = System.currentTimeMillis();

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from, fromName);
            helper.setTo(para);
            helper.setSubject(asunto);
            helper.setText(html, true);

            if (variables != null && variables.get("qrPng") instanceof byte[] qrBytes && qrBytes.length > 0) {
                helper.addInline("qrImg", new ByteArrayResource(qrBytes), MimeTypeUtils.IMAGE_PNG_VALUE);
            }

            if (variables != null && variables.get("habitacionPng") instanceof byte[] habBytes && habBytes.length > 0) {
                helper.addInline("habitacionImg", new ByteArrayResource(habBytes), "image/jpeg");
            }
            long tBuild = System.currentTimeMillis();

            mailSender.send(msg);
            long tSend = System.currentTimeMillis();

            log.info("Email -> {} | render={}ms build={}ms send={}ms total={}ms",
                    para, tRender - t0, tBuild - tRender, tSend - tBuild, tSend - t0);
            return true;
        } catch (Exception e) {
            log.error("Error enviando email a {} (tras {}ms): {}", para, System.currentTimeMillis() - t0, e.getMessage());
            return false;
        }
    }
}
