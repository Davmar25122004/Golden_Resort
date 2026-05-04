package com.example.supabase;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SupabaseTestApplication {

	public static void main(String[] args) {
		SpringApplication.run(SupabaseTestApplication.class, args);
	}

}
