package com.example.supabase.dto;

public class ServicioRequest {
    public Long servicioId;
    public Integer cantidad;
    public String hora;      // HH:mm o HH:mm:ss; null si el servicio no requiere hora
    public String ubicacion; // Solo para servicio de coche
}
