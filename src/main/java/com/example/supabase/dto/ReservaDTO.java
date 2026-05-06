package com.example.supabase.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ReservaDTO {
    public Long id;
    public LocalDate fechaEntrada;
    public LocalDate fechaSalida;
    public String habitacionTipo;
    public String habitacionNumero;
    public BigDecimal precioNoche;
    public List<ServicioDTO> servicios;
    public BigDecimal total;
    public BigDecimal subtotalRoomService;
    public List<PedidoRSDTO> pedidosRoomService;
    public String clienteNombre;
    public String clienteEmail;
    public String peticionEspecial;
    public LocalDateTime checkoutEn;

    // Constructor para mis-reservas (sin datos de cliente)
    public ReservaDTO(Long id, LocalDate fechaEntrada, LocalDate fechaSalida,
                      String habitacionTipo, String habitacionNumero, BigDecimal precioNoche,
                      List<ServicioDTO> servicios, BigDecimal total, BigDecimal subtotalRoomService,
                      List<PedidoRSDTO> pedidosRoomService, String peticionEspecial) {
        this.id                   = id;
        this.fechaEntrada         = fechaEntrada;
        this.fechaSalida          = fechaSalida;
        this.habitacionTipo       = habitacionTipo;
        this.habitacionNumero     = habitacionNumero;
        this.precioNoche          = precioNoche;
        this.servicios            = servicios;
        this.total                = total;
        this.subtotalRoomService  = subtotalRoomService;
        this.pedidosRoomService   = pedidosRoomService;
        this.peticionEspecial     = peticionEspecial;
    }

    // Constructor para admin (con datos de cliente)
    public ReservaDTO(Long id, LocalDate fechaEntrada, LocalDate fechaSalida,
                      String habitacionTipo, String habitacionNumero, BigDecimal precioNoche,
                      List<ServicioDTO> servicios, BigDecimal total, BigDecimal subtotalRoomService,
                      List<PedidoRSDTO> pedidosRoomService,
                      String clienteNombre, String clienteEmail, String peticionEspecial) {
        this(id, fechaEntrada, fechaSalida, habitacionTipo, habitacionNumero, precioNoche,
             servicios, total, subtotalRoomService, pedidosRoomService, peticionEspecial);
        this.clienteNombre = clienteNombre;
        this.clienteEmail  = clienteEmail;
    }
}
