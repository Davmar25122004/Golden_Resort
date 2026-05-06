package com.example.supabase.dto;

import java.math.BigDecimal;

public class ServicioDTO {
    public String nombre;
    public BigDecimal precio;
    public Integer cantidad;
    public String ubicacion;

    public ServicioDTO(String nombre, BigDecimal precio, Integer cantidad, String ubicacion) {
        this.nombre    = nombre;
        this.precio    = precio;
        this.cantidad  = cantidad;
        this.ubicacion = ubicacion;
    }
}
