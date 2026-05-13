package com.example.supabase.dto;

import java.time.LocalDate;
import java.util.List;

public class ReservarYPagarRequest {
    public String tipo;
    public LocalDate fechaEntrada;
    public LocalDate fechaSalida;
    public List<ServicioRequest> servicios;
    public String peticionEspecial;
    public Long habitacionId; // optional: specific room chosen by user
    public List<ItemPedidoRequest> roomServiceItems;
    public Long metodoPagoId;
    public String codigoDescuento;

    public static class ItemPedidoRequest {
        public Long itemId;
        public Integer cantidad;
    }
}
