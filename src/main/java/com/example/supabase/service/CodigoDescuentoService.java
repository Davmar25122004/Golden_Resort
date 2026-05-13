package com.example.supabase.service;

import com.example.supabase.domain.CodigoDescuento;
import com.example.supabase.domain.EstadoPago;
import com.example.supabase.domain.TipoDescuento;
import com.example.supabase.repository.CodigoDescuentoRepository;
import com.example.supabase.repository.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class CodigoDescuentoService {

    private final CodigoDescuentoRepository repo;
    private final PagoRepository pagoRepository;

    public CodigoDescuentoService(CodigoDescuentoRepository repo, PagoRepository pagoRepository) {
        this.repo = repo;
        this.pagoRepository = pagoRepository;
    }

    /** Resultado de aplicar un código a un subtotal. */
    public record ResultadoDescuento(boolean valido, String mensaje, BigDecimal descuento, CodigoDescuento codigo) {}

    /** Aplica un código sin comprobar uso por usuario (retrocompatible). */
    public ResultadoDescuento aplicar(String codigoStr, BigDecimal subtotal) {
        return aplicar(codigoStr, subtotal, null);
    }

    /** Aplica un código comprobando que el usuario no lo haya usado antes. */
    public ResultadoDescuento aplicar(String codigoStr, BigDecimal subtotal, Long usuarioId) {
        if (codigoStr == null || codigoStr.isBlank()) {
            return new ResultadoDescuento(false, "Introduce un código.", BigDecimal.ZERO, null);
        }
        Optional<CodigoDescuento> opt = repo.findByCodigoIgnoreCase(codigoStr.trim());
        if (opt.isEmpty())          return new ResultadoDescuento(false, "Código no válido.",  BigDecimal.ZERO, null);
        CodigoDescuento c = opt.get();
        if (!c.isActivo())          return new ResultadoDescuento(false, "Código desactivado.", BigDecimal.ZERO, null);
        if (c.getValidoHasta() != null && c.getValidoHasta().isBefore(LocalDate.now()))
                                    return new ResultadoDescuento(false, "Código caducado.",    BigDecimal.ZERO, null);
        if (c.getMontoMinimo() != null && subtotal.compareTo(c.getMontoMinimo()) < 0)
                                    return new ResultadoDescuento(false,
                                            "Requiere pedido mínimo de " + c.getMontoMinimo() + " €.",
                                            BigDecimal.ZERO, null);
        // Código asignado a un usuario específico
        if (c.getUsuarioAsignadoId() != null && (usuarioId == null || !c.getUsuarioAsignadoId().equals(usuarioId)))
                                    return new ResultadoDescuento(false, "Este código no está disponible para tu cuenta.",
                                            BigDecimal.ZERO, null);
        // Usos por usuario: usoMaximo = máx. veces que cada usuario puede usar el código
        if (usuarioId != null && c.getUsoMaximo() != null) {
            long usosUsuario = pagoRepository.countByUsuarioIdAndCodigoDescuentoIgnoreCaseAndEstado(
                    usuarioId, codigoStr.trim(), EstadoPago.COMPLETADO);
            if (usosUsuario >= c.getUsoMaximo()) {
                return new ResultadoDescuento(false,
                        "Ya has utilizado este código el máximo de veces permitido (" + c.getUsoMaximo() + ").",
                        BigDecimal.ZERO, null);
            }
        }

        BigDecimal descuento;
        if (c.getTipo() == TipoDescuento.PORCENTAJE) {
            descuento = subtotal.multiply(c.getValor()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            descuento = c.getValor();
        }
        if (descuento.compareTo(subtotal) > 0) descuento = subtotal;
        return new ResultadoDescuento(true, "Código aplicado.", descuento, c);
    }

    @Transactional
    public void registrarUso(CodigoDescuento codigo) {
        if (codigo == null) return;
        codigo.setUsos(codigo.getUsos() + 1);
        repo.save(codigo);
    }
}
