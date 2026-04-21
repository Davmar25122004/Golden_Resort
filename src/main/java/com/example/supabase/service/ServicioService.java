package com.example.supabase.service;

import com.example.supabase.domain.Servicio;
import com.example.supabase.repository.ServicioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    public List<Servicio> listar() {
        return servicioRepository.findAll();
    }

    public Servicio crear(Servicio servicio) {
        if (servicioRepository.existsByNombre(servicio.getNombre())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un servicio con ese nombre");
        }
        return servicioRepository.save(servicio);
    }

    public Servicio actualizar(Long id, Servicio datos) {
        return servicioRepository.findById(id)
                .map(s -> {
                    s.setNombre(datos.getNombre());
                    s.setPrecio(datos.getPrecio());
                    return servicioRepository.save(s);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public void eliminar(Long id) {
        if (!servicioRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        servicioRepository.deleteById(id);
    }
}
