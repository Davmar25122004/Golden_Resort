package com.example.supabase.service;

import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaServicioRepository reservaServicioRepository;
    private final PedidoRoomServiceRepository pedidoRoomServiceRepository;
    private final ReservaService reservaService;

    public AdminService(ReservaRepository reservaRepository,
                        HabitacionRepository habitacionRepository,
                        UsuarioRepository usuarioRepository,
                        ReservaServicioRepository reservaServicioRepository,
                        PedidoRoomServiceRepository pedidoRoomServiceRepository,
                        ReservaService reservaService) {
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.reservaServicioRepository = reservaServicioRepository;
        this.pedidoRoomServiceRepository = pedidoRoomServiceRepository;
        this.reservaService = reservaService;
    }

    /**
     * Series temporales para gráficos del dashboard.
     *  type = "monthly" → 12 meses (ene–dic) del año indicado (o el actual).
     *  type = "yearly"  → un punto por cada año con reservas (ascendente).
     * Devuelve: { labels[], reservas[], ingresos[] }
     */
    public Map<String, Object> getSeries(String type, Integer year) {
        java.util.List<String>     labels   = new java.util.ArrayList<>();
        java.util.List<Long>       reservas = new java.util.ArrayList<>();
        java.util.List<BigDecimal> ingresos = new java.util.ArrayList<>();

        if ("yearly".equalsIgnoreCase(type)) {
            java.util.Map<Integer, Long>       cuentaPorAnyo  = new java.util.TreeMap<>();
            java.util.Map<Integer, BigDecimal> ingresoPorAnyo = new java.util.TreeMap<>();
            for (Reserva r : reservaRepository.findAll()) {
                int a = r.getFechaEntrada().getYear();
                cuentaPorAnyo.merge(a, 1L, Long::sum);
                ingresoPorAnyo.merge(a, reservaService.calcularTotal(r), BigDecimal::add);
            }
            int actual = LocalDate.now().getYear();
            if (cuentaPorAnyo.isEmpty()) cuentaPorAnyo.put(actual, 0L);
            for (Integer a : cuentaPorAnyo.keySet()) {
                labels.add(String.valueOf(a));
                reservas.add(cuentaPorAnyo.get(a));
                ingresos.add(ingresoPorAnyo.getOrDefault(a, BigDecimal.ZERO));
            }
        } else {
            int y = (year != null && year > 1900) ? year : LocalDate.now().getYear();
            String[] meses = {"Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"};
            for (int m = 1; m <= 12; m++) {
                List<Reserva> lista = reservaRepository.findByMes(y, m);
                labels.add(meses[m - 1]);
                reservas.add((long) lista.size());
                ingresos.add(lista.stream().map(reservaService::calcularTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
            }
        }

        Map<String, Object> res = new java.util.LinkedHashMap<>();
        res.put("type", "yearly".equalsIgnoreCase(type) ? "yearly" : "monthly");
        res.put("year", year != null ? year : LocalDate.now().getYear());
        res.put("labels",   labels);
        res.put("reservas", reservas);
        res.put("ingresos", ingresos);
        return res;
    }

    public Map<String, Object> getStats() {
        LocalDate hoy = LocalDate.now();

        long reservasHoy = reservaRepository.findByFechaEntrada(hoy).size();
        long reservasMes = reservaRepository.findByMes(hoy.getYear(), hoy.getMonthValue()).size();

        BigDecimal ingresosMes = reservaRepository
                .findByMes(hoy.getYear(), hoy.getMonthValue()).stream()
                .map(reservaService::calcularTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalHabitaciones = habitacionRepository.count();
        long ocupadasHoy = reservaRepository.contarHabitacionesOcupadasHoy(hoy);

        List<Reserva> proximas = reservaRepository
                .findByFechaEntradaGreaterThanEqualOrderByFechaEntradaAsc(hoy)
                .stream().limit(10).collect(Collectors.toList());

        List<Map<String, Object>> proximasLlegadas = proximas.stream()
                .map(r -> Map.<String, Object>of(
                        "id",               r.getId(),
                        "clienteNombre",    r.getUsuario().getNombre() != null
                                                ? r.getUsuario().getNombre() : r.getUsuario().getEmail(),
                        "clienteEmail",     r.getUsuario().getEmail(),
                        "habitacionNumero", r.getHabitacion().getNumero(),
                        "habitacionTipo",   r.getHabitacion().getTipo().name(),
                        "fechaEntrada",     r.getFechaEntrada().toString(),
                        "fechaSalida",      r.getFechaSalida().toString()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "reservasHoy",       reservasHoy,
                "reservasMes",       reservasMes,
                "ingresosMes",       ingresosMes,
                "totalHabitaciones", totalHabitaciones,
                "ocupadasHoy",       ocupadasHoy,
                "proximasLlegadas",  proximasLlegadas
        );
    }

    public List<Map<String, Object>> getUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(u -> {
                    java.util.List<String> roles = u.getRoles().stream()
                            .map(r -> r.getName())
                            .sorted()
                            .collect(Collectors.toList());
                    String rolPrincipal = roles.stream()
                            .filter(n -> !"ROLE_CLIENTE".equals(n))
                            .findFirst()
                            .orElse(roles.isEmpty() ? "SIN ROL" : roles.get(0));
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id",     u.getId());
                    m.put("nombre", u.getNombre() != null ? u.getNombre() : "");
                    m.put("email",  u.getEmail());
                    m.put("rol",    rolPrincipal);
                    m.put("roles",  roles);
                    return m;
                })
                .sorted((a, b) -> Long.compare((long) b.get("id"), (long) a.get("id")))
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarUsuario(Long id, String adminEmail) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (u.getEmail().equals(adminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes eliminar tu propia cuenta.");
        }
        List<Reserva> reservas = reservaRepository.findByUsuario(u);
        for (Reserva r : reservas) {
            pedidoRoomServiceRepository.deleteByReservaId(r.getId());
            reservaServicioRepository.deleteByReservaId(r.getId());
        }
        reservaRepository.deleteAll(reservas);
        u.getRoles().clear();
        usuarioRepository.save(u);
        usuarioRepository.delete(u);
    }

    public Map<String, String> uploadImagen(String filename, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        try {
            String safeFilename = Paths.get(filename).getFileName().toString();
            if (!safeFilename.toLowerCase().endsWith(".jpg")
                    && !safeFilename.toLowerCase().endsWith(".png")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Only JPG or PNG images are allowed");
            }
            Path srcPath = Paths.get("src/main/resources/static/images", safeFilename);
            file.transferTo(srcPath);

            Path targetPath = Paths.get("target/classes/static/images", safeFilename);
            if (Files.exists(targetPath.getParent())) {
                Files.copy(srcPath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
            return Map.of("message", "Uploaded successfully", "filepath", "/images/" + safeFilename);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error: " + e.getMessage());
        }
    }
}
