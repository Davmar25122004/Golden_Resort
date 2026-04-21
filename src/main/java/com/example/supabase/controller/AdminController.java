package com.example.supabase.controller;

import com.example.supabase.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    private String getEmail(Authentication auth) {
        if (auth instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return auth.getName();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return adminService.getStats();
    }

    @GetMapping("/usuarios")
    public List<Map<String, Object>> usuarios() {
        return adminService.getUsuarios();
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, Authentication auth) {
        adminService.eliminarUsuario(id, getEmail(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/habitaciones/tipo/{tipo}/imagen")
    public ResponseEntity<?> uploadImagenHabitacion(
            @PathVariable String tipo,
            @RequestParam("filename") String filename,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.uploadImagen(filename, file));
    }

    @PostMapping("/servicios/{id}/imagen")
    public ResponseEntity<?> uploadImagenServicio(
            @PathVariable Long id,
            @RequestParam("filename") String filename,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.uploadImagen(filename, file));
    }
}
