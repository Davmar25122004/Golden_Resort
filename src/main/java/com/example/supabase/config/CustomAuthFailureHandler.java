package com.example.supabase.config;

import com.example.supabase.repository.PendingRegistrationRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class CustomAuthFailureHandler implements AuthenticationFailureHandler {

    @Autowired
    private PendingRegistrationRepository pendingRepository;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        String email = request.getParameter("username");

        if (email != null && !email.isBlank()) {
            boolean pendiente = pendingRepository.findByEmail(email.trim()).isPresent();
            if (pendiente) {
                String encodedEmail = URLEncoder.encode(email.trim(), StandardCharsets.UTF_8);
                response.sendRedirect("/?error=NOT_VERIFIED&email=" + encodedEmail);
                return;
            }
        }

        response.sendRedirect("/?error");
    }
}
