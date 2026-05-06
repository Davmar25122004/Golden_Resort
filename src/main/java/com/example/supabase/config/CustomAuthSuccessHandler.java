package com.example.supabase.config;

import com.example.supabase.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        var roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());

        String redirect = "/";
        if (roles.contains("ROLE_ADMIN"))            redirect = "/admin";
        else if (roles.contains("ROLE_RECEPCION"))   redirect = "/recepcion";
        else if (roles.contains("ROLE_LIMPIEZA"))    redirect = "/limpieza";
        else if (roles.contains("ROLE_GIMNASIO"))    redirect = "/gimnasio";
        else if (roles.contains("ROLE_SPA"))         redirect = "/spa";
        else if (roles.contains("ROLE_COCHE"))       redirect = "/coche";
        else if (roles.contains("ROLE_HOSTELERIA"))  redirect = "/hosteleria";
        else if (roles.contains("ROLE_ROOMSERVICE")) redirect = "/roomservice";

        // Si es usuario Google y le faltan datos personales, redirigir a completar perfil
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            String email = (String) oauthToken.getPrincipal().getAttributes().get("email");
            if (email != null) {
                var usuarioOpt = usuarioRepository.findByEmail(email);
                if (usuarioOpt.isPresent()) {
                    var u = usuarioOpt.get();
                    boolean perfilIncompleto = u.getTipoDocumento() == null
                            || u.getNumDocumento() == null
                            || u.getFechaNacimiento() == null
                            || u.getTelefono() == null;
                    if (perfilIncompleto) {
                        request.getSession().setAttribute("completar_perfil_redirect", redirect);
                        response.sendRedirect("/completar-perfil");
                        return;
                    }
                }
            }
        }

        response.sendRedirect(redirect);
    }
}
