package com.example.supabase.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class MainController {

    @GetMapping("/")
    public String indice() {
        return "redirect:/home.html";
    }

    @GetMapping("/api/usuario-info")
    @ResponseBody
    public Map<String, Object> info(Authentication auth) {
        if (auth == null) return Map.of("nombre", "Invitado", "roles", List.of());
        
        return Map.of(
            "nombre", auth.getName(),
            "roles", auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList())
        );
    }
}