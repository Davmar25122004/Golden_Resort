package com.example.supabase.controller;

import com.example.supabase.domain.EstadoPago;
import com.example.supabase.domain.Pago;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.PagoRepository;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.PagoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private static final Logger log = LoggerFactory.getLogger(PagoController.class);

    private final PagoService pagoService;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;

    public PagoController(PagoService pagoService,
                          UsuarioRepository usuarioRepository,
                          PagoRepository pagoRepository) {
        this.pagoService       = pagoService;
        this.usuarioRepository = usuarioRepository;
        this.pagoRepository    = pagoRepository;
    }

    private Usuario usuario(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        return usuarioRepository.findByEmail(email).orElse(null);
    }

    @PostMapping("/resumen")
    public ResponseEntity<?> resumen(@RequestBody Map<String, Object> body, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        Long reservaId = body.get("reservaId") instanceof Number n ? n.longValue() : null;
        if (reservaId == null) return ResponseEntity.badRequest().body("reservaId requerido.");
        String codigo = (String) body.get("codigoDescuento");
        try {
            return ResponseEntity.ok(pagoService.calcularResumen(reservaId, u.getId(), codigo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/mis-pagos")
    public ResponseEntity<?> misPagos(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        List<Map<String, Object>> result = pagoRepository.findByUsuarioIdOrderByCreatedAtDesc(u.getId()).stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id",          p.getId());
                    m.put("reservaId",   p.getReservaId());
                    m.put("estado",      p.getEstado() != null ? p.getEstado().name() : null);
                    m.put("total",       p.getTotal());
                    m.put("referencia",  p.getReferencia());
                    m.put("completedAt", p.getCompletedAt());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/estados")
    public ResponseEntity<?> estadosPago(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        List<Long> pagadas = pagoRepository.findByUsuarioIdOrderByCreatedAtDesc(u.getId()).stream()
                .filter(p -> p.getEstado() == EstadoPago.COMPLETADO)
                .map(Pago::getReservaId)
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("pagadas", pagadas));
    }

    @GetMapping("/reserva/{reservaId}/factura.pdf")
    public ResponseEntity<byte[]> descargarFacturaPorReserva(@PathVariable Long reservaId, Authentication auth) {
        try {
            Usuario u = usuario(auth);
            if (u == null) {
                return ResponseEntity.status(401)
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-error.pdf")
                        .body(pagoService.generarPdfError("No autenticado. Inicia sesión y vuelve a intentarlo."));
            }
            var pago = pagoRepository.findTopByReservaIdAndEstadoOrderByCreatedAtDesc(reservaId, EstadoPago.COMPLETADO);
            if (pago.isEmpty()) {
                return ResponseEntity.status(404)
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-error.pdf")
                        .body(pagoService.generarPdfError("No se encontró pago completado para la reserva " + reservaId + "."));
            }
            byte[] pdf = pagoService.generarFacturaPdf(pago.get().getId(), u.getId());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-GR-" + reservaId + ".pdf")
                    .body(pdf);
        } catch (Throwable e) {
            log.error("Error factura por reserva id={}: {}", reservaId, e.getMessage(), e);
            try {
                return ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-error.pdf")
                        .body(pagoService.generarPdfError("No se pudo generar la factura."));
            } catch (Throwable e2) {
                return ResponseEntity.status(500).contentType(MediaType.TEXT_PLAIN)
                        .body("Error".getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        }
    }

    @GetMapping("/{id}/factura.pdf")
    public ResponseEntity<byte[]> descargarFactura(@PathVariable Long id, Authentication auth) {
        try {
            Usuario u = usuario(auth);
            if (u == null) {
                return ResponseEntity.status(401)
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-error.pdf")
                        .body(pagoService.generarPdfError("No autenticado. Inicia sesión y vuelve a intentarlo."));
            }
            byte[] pdf = pagoService.generarFacturaPdf(id, u.getId());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-" + id + ".pdf")
                    .body(pdf);
        } catch (Throwable e) {
            log.error("Error generando factura PDF id={}: {} - {}", id, e.getClass().getSimpleName(), e.getMessage(), e);
            try {
                byte[] pdfErr = pagoService.generarPdfError("No se pudo generar la factura. Ref: " + id);
                return ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=factura-error.pdf")
                        .body(pdfErr);
            } catch (Throwable e2) {
                log.error("Fallback PDF también falló: {}", e2.getMessage());
                return ResponseEntity.status(500)
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(("Error al generar factura: " + id).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        }
    }

    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmar(@RequestBody Map<String, Object> body, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        Long reservaId     = body.get("reservaId")     instanceof Number n1 ? n1.longValue() : null;
        Long metodoPagoId  = body.get("metodoPagoId")  instanceof Number n2 ? n2.longValue() : null;
        String codigo      = (String) body.get("codigoDescuento");
        if (reservaId == null)     return ResponseEntity.badRequest().body("reservaId requerido.");
        if (metodoPagoId == null)  return ResponseEntity.badRequest().body("Selecciona un método de pago.");
        try {
            Pago p = pagoService.procesar(reservaId, u.getId(), metodoPagoId, codigo, u.getEmail());
            Map<String, Object> out = new HashMap<>();
            out.put("id",          p.getId());
            out.put("referencia",  p.getReferencia());
            out.put("total",       p.getTotal());
            out.put("estado",      p.getEstado().name());
            out.put("completedAt", p.getCompletedAt());
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
