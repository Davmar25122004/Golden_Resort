package com.example.supabase.controller;

import com.example.supabase.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
public class PasswordResetController {

    private final PasswordResetService resetService;

    public PasswordResetController(PasswordResetService resetService) {
        this.resetService = resetService;
    }

    /** Formulario para solicitar el reset (llamado desde el modal de login via AJAX) */
    @PostMapping("/api/auth/reset-password/solicitar")
    @ResponseBody
    public Map<String, Object> solicitar(@RequestBody Map<String, String> body,
                                         HttpServletRequest request) {
        String email = body.getOrDefault("email", "").trim();
        if (email.isEmpty()) {
            return Map.of("ok", false, "mensaje", "El email es obligatorio.");
        }

        String baseUrl = request.getScheme() + "://" + request.getServerName()
                + (request.getServerPort() != 80 && request.getServerPort() != 443
                    ? ":" + request.getServerPort() : "");

        String resultado = resetService.solicitarReset(email, baseUrl);
        return Map.of("ok", true, "mensaje", resultado);
    }

    /** Página para introducir la nueva contraseña */
    @GetMapping("/reset-password")
    public String paginaReset(@RequestParam(required = false) String token, Model model) {
        if (token == null || token.isBlank()) {
            model.addAttribute("error", "El enlace no es válido.");
            return "reset-password";
        }

        boolean valido = resetService.validarToken(token).isPresent();
        if (!valido) {
            model.addAttribute("error", "El enlace ha expirado o no es válido.");
        } else {
            model.addAttribute("token", token);
        }
        return "reset-password";
    }

    /** Procesa el cambio de contraseña */
    @PostMapping("/reset-password")
    @ResponseBody
    public Map<String, Object> procesarReset(@RequestBody Map<String, String> body) {
        String token = body.getOrDefault("token", "").trim();
        String nuevaPassword = body.getOrDefault("password", "").trim();

        if (token.isEmpty() || nuevaPassword.isEmpty()) {
            return Map.of("ok", false, "mensaje", "Datos incompletos.");
        }
        if (nuevaPassword.length() < 6) {
            return Map.of("ok", false, "mensaje", "La contraseña debe tener al menos 6 caracteres.");
        }

        String resultado = resetService.resetearPassword(token, nuevaPassword);
        return switch (resultado) {
            case "OK"            -> Map.of("ok", true,  "mensaje", "Contraseña cambiada. Ya puedes iniciar sesión.");
            case "SAME_PASSWORD" -> Map.of("ok", false, "mensaje", "La nueva contraseña no puede ser igual a la anterior.");
            default              -> Map.of("ok", false, "mensaje", "El enlace ha expirado o no es válido.");
        };
    }
}
