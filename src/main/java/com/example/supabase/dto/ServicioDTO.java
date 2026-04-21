package com.example.supabase.dto;

import java.math.BigDecimal;

public class ServicioDTO {
    public String nombre;
    public BigDecimal precio;
    public Integer cantidad;

    public ServicioDTO(String nombre, BigDecimal precio, Integer cantidad) {
        this.nombre = nombre;
        this.precio = precio;
        this.cantidad = cantidad;
    }
}
