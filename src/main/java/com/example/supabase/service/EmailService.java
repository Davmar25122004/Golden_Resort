package com.example.supabase.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:hgoldenresort@gmail.com}")
    private String from;

    @Value("${app.mail.from-name:Golden Resort}")
    private String fromName;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    public EmailService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public boolean enviarConPlantilla(String para, String asunto, String plantilla, Map<String, Object> variables) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.warn("Brevo API key no configurada; email a {} omitido.", para);
            return false;
        }

        long t0 = System.currentTimeMillis();
        try {
            Context ctx = new Context();
            if (variables != null) variables.forEach(ctx::setVariable);
            String html = templateEngine.process(plantilla, ctx);

            String body = "{"
                + "\"sender\":{\"name\":\"" + escapeJson(fromName) + "\",\"email\":\"" + escapeJson(from) + "\"},"
                + "\"to\":[{\"email\":\"" + escapeJson(para) + "\"}],"
                + "\"subject\":\"" + escapeJson(asunto) + "\","
                + "\"htmlContent\":\"" + escapeJson(html) + "\""
                + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                log.info("Email Brevo -> {} | total={}ms", para, System.currentTimeMillis() - t0);
                return true;
            } else {
                log.error("Brevo API error {} -> {}: {}", response.statusCode(), para, response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Error enviando email a {} (tras {}ms): {}", para, System.currentTimeMillis() - t0, e.getMessage());
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
