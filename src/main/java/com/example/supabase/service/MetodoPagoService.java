package com.example.supabase.service;

import com.example.supabase.domain.MetodoPago;
import com.example.supabase.repository.MetodoPagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MetodoPagoService {

    private final MetodoPagoRepository repo;

    public MetodoPagoService(MetodoPagoRepository repo) {
        this.repo = repo;
    }

    public List<MetodoPago> listar(Long usuarioId) {
        return repo.findByUsuarioIdOrderByEsDefaultDescCreatedAtDesc(usuarioId);
    }

    @Transactional
    public MetodoPago crear(Long usuarioId, MetodoPago nuevo) {
        nuevo.setId(null);
        nuevo.setUsuarioId(usuarioId);
        nuevo.setCreatedAt(LocalDateTime.now());
        if (nuevo.isEsDefault()) {
            desmarcarDefaultsDeUsuario(usuarioId);
        } else if (repo.findByUsuarioIdOrderByEsDefaultDescCreatedAtDesc(usuarioId).isEmpty()) {
            nuevo.setEsDefault(true);
        }
        return repo.save(nuevo);
    }

    @Transactional
    public MetodoPago actualizar(Long usuarioId, Long id, MetodoPago datos) {
        MetodoPago m = repo.findById(id).orElseThrow(() -> new RuntimeException("No existe"));
        if (!m.getUsuarioId().equals(usuarioId)) throw new RuntimeException("No autorizado");

        if (datos.getCaducidad() != null)            m.setCaducidad(datos.getCaducidad());
        if (datos.getTitular() != null)              m.setTitular(datos.getTitular());
        if (datos.getDireccionFacturacion() != null) m.setDireccionFacturacion(datos.getDireccionFacturacion());
        if (datos.getTelefono() != null)             m.setTelefono(datos.getTelefono());
        return repo.save(m);
    }

    @Transactional
    public void eliminar(Long usuarioId, Long id) {
        MetodoPago m = repo.findById(id).orElseThrow(() -> new RuntimeException("No existe"));
        if (!m.getUsuarioId().equals(usuarioId)) throw new RuntimeException("No autorizado");
        boolean eraDefault = m.isEsDefault();
        repo.delete(m);
        if (eraDefault) {
            List<MetodoPago> restantes = repo.findByUsuarioIdOrderByEsDefaultDescCreatedAtDesc(usuarioId);
            if (!restantes.isEmpty()) {
                MetodoPago primero = restantes.get(0);
                primero.setEsDefault(true);
                repo.save(primero);
            }
        }
    }

    @Transactional
    public void marcarDefault(Long usuarioId, Long id) {
        MetodoPago m = repo.findById(id).orElseThrow(() -> new RuntimeException("No existe"));
        if (!m.getUsuarioId().equals(usuarioId)) throw new RuntimeException("No autorizado");
        desmarcarDefaultsDeUsuario(usuarioId);
        m.setEsDefault(true);
        repo.save(m);
    }

    private void desmarcarDefaultsDeUsuario(Long usuarioId) {
        List<MetodoPago> actuales = repo.findByUsuarioIdOrderByEsDefaultDescCreatedAtDesc(usuarioId);
        for (MetodoPago mp : actuales) {
            if (mp.isEsDefault()) {
                mp.setEsDefault(false);
                repo.save(mp);
            }
        }
    }

    public static String detectarMarca(String numeroCompleto) {
        if (numeroCompleto == null) return "Tarjeta";
        String n = numeroCompleto.replaceAll("\\s+", "");
        if (n.startsWith("4")) return "Visa";
        if (n.matches("^(5[1-5]|2[2-7]).*")) return "Mastercard";
        if (n.matches("^3[47].*")) return "American Express";
        return "Tarjeta";
    }

    public static String ultimosCuatroDe(String numeroCompleto) {
        if (numeroCompleto == null) return "";
        String n = numeroCompleto.replaceAll("\\s+", "");
        return n.length() >= 4 ? n.substring(n.length() - 4) : n;
    }
}
