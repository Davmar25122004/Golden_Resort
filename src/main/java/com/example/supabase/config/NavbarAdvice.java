package com.example.supabase.config;

import com.example.supabase.repository.UsuarioRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.ui.Model;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice(basePackages = "com.example.supabase.controller")
public class NavbarAdvice {

    private final UsuarioRepository usuarioRepository;

    public NavbarAdvice(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @ModelAttribute
    public void inyectarUsuario(Model model, Authentication auth) {
        // Por defecto: invitado
        String displayName = null;
        String emailLogin  = null;
        List<String> roles = Collections.emptyList();

        if (auth != null
                && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken)) {

            String email = auth instanceof OAuth2AuthenticationToken token
                    ? (String) token.getPrincipal().getAttributes().get("email")
                    : auth.getName();

            emailLogin = email;
            displayName = usuarioRepository.findByEmail(email)
                    .map(u -> u.getNombre() != null && !u.getNombre().isBlank()
                            ? u.getNombre()
                            : extraerLocalPart(email))
                    .orElse(extraerLocalPart(email));

            roles = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
        }

        boolean autenticado = displayName != null;
        boolean esAdmin     = roles.contains("ROLE_ADMIN");
        boolean esRecepcion = roles.contains("ROLE_RECEPCION");
        boolean esLimpieza  = roles.contains("ROLE_LIMPIEZA");
        boolean esStaff     = esAdmin || esRecepcion || esLimpieza;
        boolean esCliente   = autenticado && !esStaff;

        model.addAttribute("navAutenticado", autenticado);
        model.addAttribute("navUsuario",     displayName);
        model.addAttribute("navEmail",       emailLogin);
        model.addAttribute("navRoles",       roles);
        model.addAttribute("navEsAdmin",     esAdmin);
        model.addAttribute("navEsRecepcion", esRecepcion);
        model.addAttribute("navEsLimpieza",  esLimpieza);
        model.addAttribute("navEsStaff",     esStaff);
        model.addAttribute("navEsCliente",   esCliente);
    }

    private static String extraerLocalPart(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }
}
