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
    @org.springframework.transaction.annotation.Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String nombre = oAuth2User.getAttribute("name");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        Usuario usuario;

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

            usuario = usuarioRepository.save(nuevoUsuario);
        } else {
            usuario = usuarioOpt.get(); // El usuario ya existía en la DB
        }

        // Aquí está la solución clave: Fusionar los roles de Supabase (BD) con los de Google
        java.util.Set<org.springframework.security.core.GrantedAuthority> authorities = new java.util.HashSet<>(oAuth2User.getAuthorities());
        
        if (usuario.getRoles() != null) {
            for (com.example.supabase.domain.Rol rol : usuario.getRoles()) {
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(rol.getName()));
            }
        }

        // Obtener el nombre del atributo de ID (usualmente "sub" o "email")
        String userNameAttributeName = userRequest.getClientRegistration()
                                                  .getProviderDetails()
                                                  .getUserInfoEndpoint()
                                                  .getUserNameAttributeName();

        // Devolvemos al Contexto de Seguridad al usuario con SUS ROLES de nuestra Base de Datos
        return new org.springframework.security.oauth2.core.user.DefaultOAuth2User(
                authorities,
                oAuth2User.getAttributes(),
                userNameAttributeName
        );
    }
}
