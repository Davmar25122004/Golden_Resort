package com.example.supabase.service;

import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import com.example.supabase.domain.Reserva;
import com.example.supabase.repository.HabitacionRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.ReservaServicioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class HabitacionService {

    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaServicioRepository reservaServicioRepository;

    public HabitacionService(HabitacionRepository habitacionRepository,
                              ReservaRepository reservaRepository,
                              ReservaServicioRepository reservaServicioRepository) {
        this.habitacionRepository = habitacionRepository;
        this.reservaRepository = reservaRepository;
        this.reservaServicioRepository = reservaServicioRepository;
    }

    public List<Habitacion> listar() {
        return habitacionRepository.findAll();
    }

    public Habitacion buscarPorId(Long id) {
        return habitacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public List<Habitacion> buscarPorTipo(TipoHabitacion tipo) {
        return habitacionRepository.findByTipo(tipo);
    }

    public Map<String, Long> getDisponibles(LocalDate fechaEntrada, LocalDate fechaSalida) {
        if (!fechaEntrada.isBefore(fechaSalida)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "fechaEntrada debe ser anterior a fechaSalida");
        }
        Map<String, Long> disponibilidad = new LinkedHashMap<>();
        for (TipoHabitacion tipo : TipoHabitacion.values()) {
            long count = habitacionRepository.countAvailableByTipo(tipo, fechaEntrada, fechaSalida);
            disponibilidad.put(tipo.name(), count);
        }
        return disponibilidad;
    }

    public Habitacion crear(Habitacion habitacion) {
        if (habitacion.getNumero() != null && habitacionRepository.existsByNumero(habitacion.getNumero())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una habitación con ese número");
        }
        return habitacionRepository.save(habitacion);
    }

    public Habitacion actualizar(Long id, Habitacion datos) {
        Habitacion h = habitacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (datos.getNumero() != null) h.setNumero(datos.getNumero());
        if (datos.getTipo() != null) h.setTipo(datos.getTipo());
        if (datos.getPrecioNoche() != null) h.setPrecioNoche(datos.getPrecioNoche());
        h.setDescripcion(datos.getDescripcion());
        return habitacionRepository.save(h);
    }

    @Transactional
    public Map<String, Object> actualizarPorTipo(TipoHabitacion tipo, Map<String, Object> datos) {
        List<Habitacion> habitaciones = habitacionRepository.findByTipo(tipo);
        if (habitaciones.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        habitaciones.forEach(h -> {
            if (datos.get("precioNoche") != null) {
                h.setPrecioNoche(new BigDecimal(datos.get("precioNoche").toString()));
            }
            if (datos.containsKey("descripcion")) {
                h.setDescripcion(datos.get("descripcion") != null
                        ? datos.get("descripcion").toString() : null);
            }
        });
        habitacionRepository.saveAll(habitaciones);
        return Map.of("tipo", tipo.name(), "actualizadas", habitaciones.size());
    }

    @Transactional
    public void eliminar(Long id) {
        Habitacion h = habitacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        List<Reserva> reservas = reservaRepository.findByHabitacion(h);
        for (Reserva r : reservas) {
            reservaServicioRepository.deleteByReservaId(r.getId());
        }
        reservaRepository.deleteAll(reservas);
        habitacionRepository.delete(h);
    }
}
