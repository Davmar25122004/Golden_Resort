package com.example.supabase.dto;

import java.time.LocalDate;
import java.util.List;

public class ReservaPorTipoRequest {
    public String tipo;
    public LocalDate fechaEntrada;
    public LocalDate fechaSalida;
    public List<ServicioRequest> servicios;
    public String peticionEspecial;
}
