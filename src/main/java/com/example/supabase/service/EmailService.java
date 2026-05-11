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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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

    @Value("${resend.api-key:}")
    private String resendApiKey;

    public EmailService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /** Envía un email con plantilla Thymeleaf. Usa Resend si hay API key, si no SMTP. */
    public boolean enviarConPlantilla(String para, String asunto, String plantilla, Map<String, Object> variables) {
        long t0 = System.currentTimeMillis();

        Context ctx = new Context();
        if (variables != null) variables.forEach(ctx::setVariable);
        String html = templateEngine.process(plantilla, ctx);

        if (resendApiKey != null && !resendApiKey.isBlank()) {
            return enviarConResend(para, asunto, html, t0);
        }

        if (mailSender == null || smtpUser == null || smtpUser.isBlank()) {
            log.warn("SMTP y Resend no configurados; email a {} omitido.", para);
            return false;
        }
        return enviarConSmtp(para, asunto, html, variables, t0);
    }

    private boolean enviarConResend(String para, String asunto, String html, long t0) {
        try {
            String fromField = fromName + " <" + from + ">";
            String body = "{\"from\":\"" + escapeJson(fromField) + "\","
                        + "\"to\":[\"" + escapeJson(para) + "\"],"
                        + "\"subject\":\"" + escapeJson(asunto) + "\","
                        + "\"html\":\"" + escapeJson(html) + "\"}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                log.info("Email Resend -> {} | total={}ms", para, System.currentTimeMillis() - t0);
                return true;
            } else {
                log.error("Resend error {} -> {}: {}", response.statusCode(), para, response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Error Resend a {} (tras {}ms): {}", para, System.currentTimeMillis() - t0, e.getMessage());
            return false;
        }
    }

    private boolean enviarConSmtp(String para, String asunto, String html, Map<String, Object> variables, long t0) {
        try {
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
            if (variables != null && variables.get("logoPng") instanceof byte[] logoBytes && logoBytes.length > 0) {
                helper.addInline("logoImg", new ByteArrayResource(logoBytes), MimeTypeUtils.IMAGE_PNG_VALUE);
            }

            mailSender.send(msg);
            log.info("Email SMTP -> {} | total={}ms", para, System.currentTimeMillis() - t0);
            return true;
        } catch (Exception e) {
            log.error("Error SMTP a {} (tras {}ms): {}", para, System.currentTimeMillis() - t0, e.getMessage());
            return false;
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
