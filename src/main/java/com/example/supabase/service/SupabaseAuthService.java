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

    /**
     * Registra un usuario en Supabase Auth. Si el usuario ya existe pero no ha verificado
     * su email, reenvía la verificación y devuelve el UID existente.
     *
     * @param existingUid UID de Supabase de un registro pendiente previo (puede ser null)
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public String signUp(String email, String password, String existingUid) {
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
            return (String) responseBody.get("id");
        } catch (HttpClientErrorException e) {
            String msg = e.getResponseBodyAsString();
            if (msg.contains("already registered") || msg.contains("User already registered")) {
                // El usuario ya existe en Supabase pero no se ha verificado:
                // reenviamos la verificación y reutilizamos el UID anterior
                if (existingUid != null) {
                    resendVerificationEmail(email);
                    return existingUid;
                }
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El email ya está registrado.");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error al registrar en Supabase: " + e.getMessage());
        }
    }

    /** Sobrecarga para compatibilidad — sin UID previo */
    public String signUp(String email, String password) {
        return signUp(email, password, null);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public void resendVerificationEmail(String email) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", anonKey);

        Map<String, Object> body = Map.of(
            "type", "signup",
            "email", email,
            "options", Map.of("emailRedirectTo", redirectUrl)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(supabaseUrl + "/auth/v1/resend", request, Map.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Demasiados intentos. Espera un momento antes de reenviar.");
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
