package com.example.supabase.dto;

import java.math.BigDecimal;

public class PedidoDTO {
    public Long pedidoId;
    public Long itemId;
    public String nombre;
    public String categoria;
    public BigDecimal precioUnitario;
    public Integer cantidad;
    public BigDecimal subtotal;

    public PedidoDTO(Long pedidoId, Long itemId, String nombre, String categoria,
                     BigDecimal precioUnitario, Integer cantidad, BigDecimal subtotal) {
        this.pedidoId       = pedidoId;
        this.itemId         = itemId;
        this.nombre         = nombre;
        this.categoria      = categoria;
        this.precioUnitario = precioUnitario;
        this.cantidad       = cantidad;
        this.subtotal       = subtotal;
    }
}
