package com.example.supabase.dto;

import java.time.LocalDate;
import java.util.List;

public class ReservaRequest {
    public Long habitacionId;
    public LocalDate fechaEntrada;
    public LocalDate fechaSalida;
    public List<ServicioRequest> servicios;
    public String peticionEspecial;
}
