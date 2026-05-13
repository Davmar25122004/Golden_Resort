package com.example.supabase.service;

import com.example.supabase.domain.*;
import com.example.supabase.dto.ReservarYPagarRequest;
import com.example.supabase.dto.ReservaPorTipoRequest;
import com.example.supabase.repository.HabitacionRepository;
import com.example.supabase.repository.MetodoPagoRepository;
import com.example.supabase.repository.PagoRepository;
import com.example.supabase.repository.PedidoRoomServiceRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.RoomServiceItemRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PagoService {

    private static final Logger log = LoggerFactory.getLogger(PagoService.class);

    @org.springframework.beans.factory.annotation.Value("${app.public-url:http://localhost:8080}")
    private String publicUrl;

    @org.springframework.beans.factory.annotation.Value("${hotel.checkin-time:15:00}")
    private String horaCheckin;

    @org.springframework.beans.factory.annotation.Value("${hotel.checkout-time:11:00}")
    private String horaCheckout;

    private static String imagenHabitacion(String tipo) {
        if ("SUITE".equals(tipo)) return "suite-1.jpg";
        if ("LUJO".equals(tipo))  return "Lujo_1.jpg";
        if ("DOBLE".equals(tipo)) return "doble-1.jpg";
        return "normal-1.jpg";
    }

    private static byte[] leerImagenClasspath(String nombre) {
        try (var in = new org.springframework.core.io.ClassPathResource("static/images/" + nombre).getInputStream()) {
            return in.readAllBytes();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    private final PagoRepository pagoRepository;
    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final ReservaService reservaService;
    private final CodigoDescuentoService codigoDescuentoService;
    private final EmailService emailService;
    private final TemplateEngine templateEngine;
    private final PedidoRoomServiceRepository pedidoRoomServiceRepository;
    private final RoomServiceItemRepository roomServiceItemRepository;

    public PagoService(PagoRepository pagoRepository,
                       ReservaRepository reservaRepository,
                       HabitacionRepository habitacionRepository,
                       MetodoPagoRepository metodoPagoRepository,
                       ReservaService reservaService,
                       CodigoDescuentoService codigoDescuentoService,
                       EmailService emailService,
                       TemplateEngine templateEngine,
                       PedidoRoomServiceRepository pedidoRoomServiceRepository,
                       RoomServiceItemRepository roomServiceItemRepository) {
        this.pagoRepository              = pagoRepository;
        this.reservaRepository           = reservaRepository;
        this.habitacionRepository        = habitacionRepository;
        this.metodoPagoRepository        = metodoPagoRepository;
        this.reservaService              = reservaService;
        this.codigoDescuentoService      = codigoDescuentoService;
        this.emailService                = emailService;
        this.templateEngine              = templateEngine;
        this.pedidoRoomServiceRepository = pedidoRoomServiceRepository;
        this.roomServiceItemRepository   = roomServiceItemRepository;
    }

    /** Genera el PDF de la factura para un pago del usuario autenticado. */
    @Transactional(readOnly = true)
    public byte[] generarFacturaPdf(Long pagoId, Long usuarioId) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));
        if (!pago.getUsuarioId().equals(usuarioId))
            throw new RuntimeException("No autorizado");

        Reserva r = reservaRepository.findById(pago.getReservaId())
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        DateTimeFormatter df  = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        long noches = ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());
        BigDecimal habitacionTotal = r.getHabitacion().getPrecioNoche().multiply(BigDecimal.valueOf(noches));

        Context ctx = new Context();
        ctx.setVariable("nombreCliente",    r.getUsuario().getNombre() != null ? r.getUsuario().getNombre() : r.getUsuario().getEmail());
        ctx.setVariable("referencia",       pago.getReferencia());
        ctx.setVariable("fecha",            pago.getCompletedAt() != null ? pago.getCompletedAt().format(dtf) : "");
        ctx.setVariable("habitacionTipo",   r.getHabitacion().getTipo().name());
        ctx.setVariable("habitacionNumero", r.getHabitacion().getNumero());
        ctx.setVariable("fechaEntrada",     r.getFechaEntrada().format(df));
        ctx.setVariable("fechaSalida",      r.getFechaSalida().format(df));
        ctx.setVariable("noches",           noches);
        ctx.setVariable("precioNoche",      r.getHabitacion().getPrecioNoche());
        ctx.setVariable("habitacionTotal",  habitacionTotal);
        ctx.setVariable("subtotal",         pago.getSubtotal());
        ctx.setVariable("descuento",        pago.getDescuento());
        ctx.setVariable("codigoDescuento",  pago.getCodigoDescuento());
        ctx.setVariable("total",            pago.getTotal());
        ctx.setVariable("metodoTipo",       pago.getMetodoTipo());
        ctx.setVariable("metodoMarca",      pago.getMetodoMarca());
        ctx.setVariable("metodoUltimos",    pago.getMetodoUltimosCuatro());

        byte[] imgHab = leerImagenClasspath(imagenHabitacion(r.getHabitacion().getTipo().name()));
        if (imgHab.length > 0) {
            try {
                java.awt.image.BufferedImage orig = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(imgHab));
                if (orig != null) {
                    int targetW = 560, targetH = 180;
                    // Center-crop al aspect ratio del destino, luego escala (efecto "cover", sin distorsión)
                    double srcRatio = (double) orig.getWidth() / orig.getHeight();
                    double dstRatio = (double) targetW / targetH;
                    int sx, sy, sw, sh;
                    if (srcRatio > dstRatio) {
                        // origen más ancho → recortar lados
                        sh = orig.getHeight();
                        sw = (int) Math.round(sh * dstRatio);
                        sx = (orig.getWidth() - sw) / 2;
                        sy = 0;
                    } else {
                        // origen más alto → recortar arriba/abajo
                        sw = orig.getWidth();
                        sh = (int) Math.round(sw / dstRatio);
                        sx = 0;
                        sy = (orig.getHeight() - sh) / 2;
                    }
                    java.awt.image.BufferedImage thumb = new java.awt.image.BufferedImage(targetW, targetH, java.awt.image.BufferedImage.TYPE_INT_RGB);
                    java.awt.Graphics2D g2 = thumb.createGraphics();
                    g2.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    g2.setRenderingHint(java.awt.RenderingHints.KEY_RENDERING, java.awt.RenderingHints.VALUE_RENDER_QUALITY);
                    g2.drawImage(orig, 0, 0, targetW, targetH, sx, sy, sx + sw, sy + sh, null);
                    g2.dispose();
                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    javax.imageio.ImageIO.write(thumb, "jpeg", baos);
                    String habImgDataUri = "data:image/jpeg;base64," + java.util.Base64.getEncoder().encodeToString(baos.toByteArray());
                    ctx.setVariable("habitacionImgDataUri", habImgDataUri);
                }
            } catch (Exception ignored) {}
        }

        ctx.setVariable("servicios",        r.getServicios());
        ctx.setVariable("pedidosRS",        pedidoRoomServiceRepository.findByReservaId(r.getId()));
        ctx.setVariable("horaCheckin",      horaCheckin);
        ctx.setVariable("horaCheckout",     horaCheckout);

        String html = templateEngine.process("pdfs/factura", ctx);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Falló render PDF factura pagoId={}: {}", pagoId, e.getMessage(), e);
            throw new RuntimeException("Error generando PDF: " + e.getMessage(), e);
        }
    }

    /** Genera un PDF mínimo con un mensaje de error, para devolver siempre un .pdf válido al usuario. */
    public byte[] generarPdfError(String mensaje) {
        String safe = mensaje == null ? "Error desconocido"
                : mensaje.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>Error</title>"
                + "<style>@page{size:A4;margin:24mm} body{font-family:Helvetica,Arial,sans-serif;color:#1a1a1a}"
                + ".brand{font-family:Georgia,serif;font-size:22pt;color:#C9A84C;letter-spacing:4pt;margin:0 0 6pt 0}"
                + ".title{font-size:14pt;color:#b00;margin:18pt 0 8pt 0}"
                + ".msg{font-size:10pt;color:#444;line-height:1.5}"
                + ".foot{margin-top:30pt;font-size:8pt;color:#999;border-top:1pt solid #ddd;padding-top:8pt}"
                + "</style></head><body>"
                + "<p class=\"brand\">GOLDEN RESORT</p>"
                + "<p class=\"title\">No se pudo generar la factura</p>"
                + "<p class=\"msg\">" + safe + "</p>"
                + "<p class=\"msg\">Vuelve a intentarlo desde \"Mis reservas\". Si el problema persiste, contacta con el hotel.</p>"
                + "<p class=\"foot\">Golden Resort · Documento generado automáticamente</p>"
                + "</body></html>";
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception ex) {
            log.error("Hasta el PDF de error falló: {}", ex.getMessage(), ex);
            return ("Error: " + safe).getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    /** Resumen que se muestra al usuario antes de confirmar. */
    public Map<String, Object> calcularResumen(Long reservaId, Long usuarioId, String codigoDescuento) {
        Reserva r = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        if (!r.getUsuario().getId().equals(usuarioId))
            throw new RuntimeException("No autorizado");

        pagoRepository.findTopByReservaIdAndEstadoOrderByCreatedAtDesc(reservaId, EstadoPago.COMPLETADO)
                .ifPresent(p -> { throw new RuntimeException("Esta reserva ya está pagada."); });

        BigDecimal subtotal = reservaService.calcularTotal(r);
        CodigoDescuentoService.ResultadoDescuento rd = codigoDescuentoService.aplicar(codigoDescuento, subtotal, usuarioId);
        BigDecimal descuento = rd.valido() ? rd.descuento() : BigDecimal.ZERO;
        BigDecimal total     = subtotal.subtract(descuento);

        long noches = java.time.temporal.ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());

        Map<String, Object> res = new HashMap<>();
        res.put("reservaId",     r.getId());
        res.put("habitacionTipo", r.getHabitacion().getTipo().name());
        res.put("habitacionNumero", r.getHabitacion().getNumero());
        res.put("fechaEntrada",  r.getFechaEntrada());
        res.put("fechaSalida",   r.getFechaSalida());
        res.put("precioNoche",   r.getHabitacion().getPrecioNoche());
        res.put("noches",        noches);
        res.put("subtotalHab",   r.getHabitacion().getPrecioNoche().multiply(java.math.BigDecimal.valueOf(noches)));
        res.put("subtotal",      subtotal);
        res.put("descuento",     descuento);
        res.put("total",         total);
        res.put("codigoValido",  rd.valido());
        res.put("codigoMensaje", rd.mensaje());

        java.util.List<Map<String, Object>> serviciosLista = new java.util.ArrayList<>();
        if (r.getServicios() != null) {
            for (ReservaServicio rs : r.getServicios()) {
                if (rs.getServicio() == null) continue;
                BigDecimal precioEfectivo = rs.getPrecioServicio() != null
                        ? rs.getPrecioServicio() : rs.getServicio().getPrecio();
                Map<String, Object> srv = new HashMap<>();
                srv.put("nombre",   rs.getServicio().getNombre());
                srv.put("precio",   precioEfectivo);
                srv.put("cantidad", rs.getCantidad());
                srv.put("subtotal", precioEfectivo.multiply(BigDecimal.valueOf(rs.getCantidad())));
                serviciosLista.add(srv);
            }
        }
        res.put("servicios", serviciosLista);
        res.put("horaCheckin",  horaCheckin);
        res.put("horaCheckout", horaCheckout);
        return res;
    }

    @Transactional
    public Pago procesar(Long reservaId, Long usuarioId, Long metodoPagoId, String codigoDescuento, String emailUsuario) {
        Reserva r = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        if (!r.getUsuario().getId().equals(usuarioId)) throw new RuntimeException("No autorizado");

        pagoRepository.findTopByReservaIdAndEstadoOrderByCreatedAtDesc(reservaId, EstadoPago.COMPLETADO)
                .ifPresent(p -> { throw new RuntimeException("Esta reserva ya está pagada."); });

        if (reservaId == null || reservaId <= 0)
            throw new RuntimeException("ID de reserva inválido");
        if (metodoPagoId == null || metodoPagoId <= 0)
            throw new RuntimeException("Selecciona un método de pago válido.");

        habitacionRepository.findByIdWithLock(r.getHabitacion().getId())
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));

        long ocupadasPagadas = reservaRepository.contarReservasSolapadasExcluyendo(
                r.getHabitacion(), r.getFechaEntrada(), r.getFechaSalida(), r.getId());
        if (ocupadasPagadas > 0) {
            throw new RuntimeException("Lo sentimos, esta habitación acaba de ser reservada por otro usuario.");
        }

        MetodoPago metodo = metodoPagoRepository.findById(metodoPagoId).orElse(null);
        if (metodo == null || !metodo.getUsuarioId().equals(usuarioId))
            throw new RuntimeException("Método de pago no válido.");

        BigDecimal subtotal = reservaService.calcularTotal(r);
        CodigoDescuentoService.ResultadoDescuento rd = codigoDescuentoService.aplicar(codigoDescuento, subtotal, usuarioId);
        BigDecimal descuento = rd.valido() ? rd.descuento() : BigDecimal.ZERO;
        BigDecimal total     = subtotal.subtract(descuento);

        Pago pago = new Pago();
        pago.setReservaId(r.getId());
        pago.setUsuarioId(usuarioId);
        pago.setMetodoPagoId(metodo.getId());
        pago.setSubtotal(subtotal);
        pago.setDescuento(descuento);
        pago.setTotal(total);
        pago.setCodigoDescuento(rd.valido() && rd.codigo() != null ? rd.codigo().getCodigo() : null);
        pago.setEstado(EstadoPago.COMPLETADO);
        pago.setReferencia("GR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        pago.setMetodoTipo(metodo.getTipo().name());
        pago.setMetodoMarca(metodo.getMarca());
        pago.setMetodoUltimosCuatro(metodo.getUltimosCuatro());
        pago.setCompletedAt(LocalDateTime.now());
        Pago guardado = pagoRepository.save(pago);

        if (rd.valido()) codigoDescuentoService.registrarUso(rd.codigo());

        final Reserva rr = r;
        final Pago pg = guardado;
        java.util.concurrent.CompletableFuture.runAsync(() -> enviarEmailFactura(rr, pg, emailUsuario));

        return guardado;
    }

    /** Valida un código de descuento sin crear ninguna entidad. */
    public Map<String, Object> validarDescuento(BigDecimal subtotal, String codigoDescuento, Long usuarioId) {
        CodigoDescuentoService.ResultadoDescuento rd = codigoDescuentoService.aplicar(codigoDescuento, subtotal, usuarioId);
        BigDecimal descuento = rd.valido() ? rd.descuento() : BigDecimal.ZERO;
        Map<String, Object> res = new HashMap<>();
        res.put("valido",    rd.valido());
        res.put("descuento", descuento);
        res.put("mensaje",   rd.mensaje());
        res.put("total",     subtotal.subtract(descuento));
        return res;
    }

    /** Crea la reserva y procesa el pago en una única transacción atómica. */
    @Transactional
    public Pago procesarConReserva(ReservarYPagarRequest req, Long usuarioId, String email) {
        // 1. Crear la reserva
        ReservaPorTipoRequest reservaReq = new ReservaPorTipoRequest();
        reservaReq.tipo             = req.tipo;
        reservaReq.fechaEntrada     = req.fechaEntrada;
        reservaReq.fechaSalida      = req.fechaSalida;
        reservaReq.servicios        = req.servicios;
        reservaReq.peticionEspecial = req.peticionEspecial;
        reservaReq.habitacionId     = req.habitacionId;
        Reserva reserva = reservaService.crearPorTipo(reservaReq, email);

        // 2. Añadir pedidos de room service si los hay
        if (req.roomServiceItems != null && !req.roomServiceItems.isEmpty()) {
            for (ReservarYPagarRequest.ItemPedidoRequest item : req.roomServiceItems) {
                if (item.itemId == null || item.cantidad == null || item.cantidad <= 0) continue;
                RoomServiceItem rsItem = roomServiceItemRepository.findById(item.itemId).orElse(null);
                if (rsItem == null) continue;
                PedidoRoomService pedido = new PedidoRoomService();
                pedido.setReserva(reserva);
                pedido.setItem(rsItem);
                pedido.setCantidad(item.cantidad);
                pedidoRoomServiceRepository.save(pedido);
            }
        }

        // 3. Procesar el pago en la misma transacción
        return procesar(reserva.getId(), usuarioId, req.metodoPagoId, req.codigoDescuento, email);
    }

    private void enviarEmailFactura(Reserva r, Pago pago, String emailUsuario) {
        try {
            DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            long noches = java.time.temporal.ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());
            BigDecimal habitacionTotal = r.getHabitacion().getPrecioNoche().multiply(BigDecimal.valueOf(noches));

            var variables = new HashMap<String, Object>();
            variables.put("nombreCliente",    r.getUsuario().getNombre() != null ? r.getUsuario().getNombre() : emailUsuario);
            variables.put("referencia",       pago.getReferencia());
            variables.put("fecha",            pago.getCompletedAt().format(dtf));
            variables.put("habitacionTipo",   r.getHabitacion().getTipo().name());
            variables.put("habitacionNumero", r.getHabitacion().getNumero());
            variables.put("fechaEntrada",     r.getFechaEntrada().format(df));
            variables.put("fechaSalida",      r.getFechaSalida().format(df));
            variables.put("noches",           noches);
            variables.put("precioNoche",      r.getHabitacion().getPrecioNoche());
            variables.put("habitacionTotal",  habitacionTotal);
            variables.put("subtotal",         pago.getSubtotal());
            variables.put("descuento",        pago.getDescuento());
            variables.put("codigoDescuento",  pago.getCodigoDescuento());
            variables.put("total",            pago.getTotal());
            variables.put("metodoTipo",       pago.getMetodoTipo());
            variables.put("metodoMarca",      pago.getMetodoMarca());
            variables.put("metodoUltimos",    pago.getMetodoUltimosCuatro());

            variables.put("habitacionUrl",  publicUrl + "/images/" + imagenHabitacion(r.getHabitacion().getTipo().name()));
            variables.put("logoUrl",        publicUrl + "/images/logo.png");
            variables.put("servicios",      r.getServicios());
            variables.put("pedidosRS",      pedidoRoomServiceRepository.findByReservaId(r.getId()));
            variables.put("horaCheckin",    horaCheckin);
            variables.put("horaCheckout",   horaCheckout);

            emailService.enviarConPlantilla(
                    emailUsuario,
                    "Confirmación de pago · Golden Resort · " + pago.getReferencia(),
                    "emails/factura",
                    variables);
        } catch (Exception ignored) {}
    }
}
