package com.example.supabase.dto;

import java.math.BigDecimal;

public class PedidoRSDTO {
    public String nombre;
    public Integer cantidad;
    public BigDecimal subtotal;

    public PedidoRSDTO(String nombre, Integer cantidad, BigDecimal subtotal) {
        this.nombre   = nombre;
        this.cantidad = cantidad;
        this.subtotal = subtotal;
    }
}
