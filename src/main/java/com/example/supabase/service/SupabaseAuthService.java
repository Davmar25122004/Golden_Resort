package com.example.supabase.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class SupabaseAuthService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String anonKey;

    @Value("${supabase.redirect-url}")
    private String redirectUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings({"unchecked", "rawtypes"})
    public String signUp(String email, String password) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", anonKey);

        Map<String, Object> body = Map.of(
            "email", email,
            "password", password,
            "options", Map.of("emailRedirectTo", redirectUrl)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                supabaseUrl + "/auth/v1/signup", request, Map.class
            );
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Respuesta vacía de Supabase Auth.");
            }
            // Supabase returns the user id in "id" field
            return (String) responseBody.get("id");
        } catch (HttpClientErrorException e) {
            String msg = e.getResponseBodyAsString();
            if (msg.contains("already registered") || msg.contains("User already registered")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El email ya está registrado.");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error al registrar en Supabase: " + e.getMessage());
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public String getEmailFromToken(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", anonKey);
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                supabaseUrl + "/auth/v1/user",
                HttpMethod.GET,
                request,
                Map.class
            );
            Map<String, Object> body = response.getBody();
            if (body == null) return null;
            return (String) body.get("email");
        } catch (HttpClientErrorException e) {
            return null;
        }
    }
}
