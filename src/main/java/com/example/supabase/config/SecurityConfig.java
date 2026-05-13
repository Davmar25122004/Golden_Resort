package com.example.supabase.config;

import com.example.supabase.service.OAuth2UserServiceCustom;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2UserServiceCustom oauth2UserService;

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Autowired
    private CustomAuthSuccessHandler customAuthSuccessHandler;

    @Autowired
    private CustomAuthFailureHandler customAuthFailureHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/mis-reservas", "/mis-reservas/**").hasRole("CLIENTE")
                        .requestMatchers("/admin", "/admin/**").hasRole("ADMIN")
                        .requestMatchers("/recepcion", "/recepcion/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/peticiones", "/peticiones/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/api/recepcion/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/limpieza", "/limpieza/**").hasAnyRole("ADMIN", "LIMPIEZA", "RECEPCION")
                        .requestMatchers("/api/limpieza/objetos", "/api/limpieza/objetos/**", "/api/limpieza/panel").hasAnyRole("ADMIN", "LIMPIEZA", "RECEPCION", "GIMNASIO", "SPA", "COCHE", "HOSTELERIA", "ROOMSERVICE")
                        .requestMatchers("/api/limpieza/**").hasAnyRole("ADMIN", "LIMPIEZA", "RECEPCION")
                        .requestMatchers("/gimnasio", "/gimnasio/**").hasAnyRole("ADMIN", "GIMNASIO")
                        .requestMatchers("/api/gimnasio/**").hasAnyRole("ADMIN", "GIMNASIO")
                        .requestMatchers("/spa", "/spa/**").hasAnyRole("ADMIN", "SPA")
                        .requestMatchers("/api/spa/**").hasAnyRole("ADMIN", "SPA")
                        .requestMatchers("/coche", "/coche/**").hasAnyRole("ADMIN", "COCHE")
                        .requestMatchers("/api/coche/**").hasAnyRole("ADMIN", "COCHE")
                        .requestMatchers("/hosteleria", "/hosteleria/**").hasAnyRole("ADMIN", "HOSTELERIA")
                        .requestMatchers("/api/hosteleria/**").hasAnyRole("ADMIN", "HOSTELERIA")
                        .requestMatchers("/roomservice", "/roomservice/**").hasAnyRole("ADMIN", "ROOMSERVICE")
                        .requestMatchers("/api/roomservice/**").hasAnyRole("ADMIN", "ROOMSERVICE")
                        .requestMatchers("/mensajeria", "/mensajeria/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/api/mensajeria/recepcion/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/api/mensajeria/mi-conversacion", "/api/mensajeria/mi-conversacion/**").authenticated()
                        .requestMatchers("/api/enums", "/api/enums/**").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/lib/**", "/images/**", "/docs/**", "/error").permitAll()
                        .requestMatchers("/api/pagos/qr/**").permitAll()
                        .requestMatchers("/habitacion/**", "/servicio/**").permitAll()
                        .requestMatchers("/api/habitaciones", "/api/habitaciones/**").permitAll()
                        .requestMatchers("/api/servicios").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auth/register", "/api/auth/confirmar-verificacion", "/api/auth/reenviar-verificacion", "/api/usuario-info").permitAll()
                        .requestMatchers("/api/auth/reset-password/**", "/reset-password").permitAll()
                        .requestMatchers("/api/hotel/info").permitAll()
                        .requestMatchers("/verificar-email").permitAll()
                        .requestMatchers("/privacidad", "/cookies").permitAll()
                        .requestMatchers("/perfil", "/api/perfil", "/api/perfil/**").authenticated()
                        .requestMatchers("/completar-perfil", "/api/perfil/completar").authenticated()
                        .requestMatchers("/api/perfil/mensajes-staff", "/api/perfil/mensajes-staff/**").authenticated()
                        .requestMatchers("/objetos-perdidos", "/api/objetos-perdidos", "/api/objetos-perdidos/**").authenticated()
                        .requestMatchers("/api/pagos/**").authenticated()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/")
                        .loginProcessingUrl("/login")
                        .successHandler(customAuthSuccessHandler)
                        .failureHandler(customAuthFailureHandler)
                        .permitAll())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestResolver(authorizationRequestResolver(clientRegistrationRepository)))
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oauth2UserService))
                        .successHandler(customAuthSuccessHandler))
                .logout(logout -> logout
                        .logoutSuccessUrl("/")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll());

        return http.build();
    }

    private OAuth2AuthorizationRequestResolver authorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver authorizationRequestResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository, "/oauth2/authorization");
        authorizationRequestResolver.setAuthorizationRequestCustomizer(
                customizer -> customizer.additionalParameters(params -> params.put("prompt", "select_account")));
        return authorizationRequestResolver;
    }
}
