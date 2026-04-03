package com.example.supabase.config;

import com.example.supabase.service.OAuth2UserServiceCustom;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2UserServiceCustom oauth2UserService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/css/**", "/js/**", "/lib/**", "/images/**", "/error").permitAll()
                .requestMatchers("/api/habitaciones", "/api/habitaciones/**").permitAll()
                .requestMatchers("/api/servicios").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/register", "/api/usuario-info").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oauth2UserService)
                )
                .defaultSuccessUrl("/", true)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );

        return http.build();
    }
}
