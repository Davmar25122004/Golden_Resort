package com.example.supabase.service;

import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.RoleRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;

@Service
public class OAuth2UserServiceCustom extends DefaultOAuth2UserService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RoleRepository rolRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String nombre = oAuth2User.getAttribute("name");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setEmail(email);
            nuevoUsuario.setNombre(nombre);
            nuevoUsuario.setPassword("OAUTH2_USER");
            if (nuevoUsuario.getRoles() == null) {
                nuevoUsuario.setRoles(new HashSet<>());
            }

            rolRepository.findById(2L).ifPresent(rol -> {
                nuevoUsuario.getRoles().add(rol);
            });

            usuarioRepository.save(nuevoUsuario);
        }

        return oAuth2User;
    }
}
