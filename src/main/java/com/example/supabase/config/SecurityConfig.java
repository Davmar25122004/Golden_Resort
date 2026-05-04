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
                        .requestMatchers("/api/limpieza/**").hasAnyRole("ADMIN", "LIMPIEZA", "RECEPCION")
                        .requestMatchers("/mensajeria", "/mensajeria/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/api/mensajeria/recepcion/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers("/api/mensajeria/mi-conversacion", "/api/mensajeria/mi-conversacion/**").authenticated()
                        .requestMatchers("/css/**", "/js/**", "/lib/**", "/images/**", "/docs/**", "/error").permitAll()
                        .requestMatchers("/habitacion/**", "/servicio/**").permitAll()
                        .requestMatchers("/api/habitaciones", "/api/habitaciones/**").permitAll()
                        .requestMatchers("/api/servicios").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auth/register", "/api/auth/confirmar-verificacion", "/api/usuario-info").permitAll()
                        .requestMatchers("/api/hotel/info").permitAll()
                        .requestMatchers("/verificar-email").permitAll()
                        .requestMatchers("/perfil", "/api/perfil", "/api/perfil/**").authenticated()
                        .requestMatchers("/api/pagos/**").authenticated()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/")
                        .loginProcessingUrl("/login")
                        .successHandler(new CustomAuthSuccessHandler())
                        .permitAll())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestResolver(authorizationRequestResolver(clientRegistrationRepository)))
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oauth2UserService))
                        .successHandler(new CustomAuthSuccessHandler()))
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
