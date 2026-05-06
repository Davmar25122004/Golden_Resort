package com.example.supabase.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/enums")
public class EnumsController {

    @GetMapping
    public Map<String, Object> obtenerTodos() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roles",               roles());
        result.put("departamentos",       departamentos());
        result.put("tiposHabitacion",     tiposHabitacion());
        result.put("estadosLimpieza",     estadosLimpieza());
        result.put("estadosPago",         estadosPago());
        result.put("estadosConversacion", estadosConversacion());
        result.put("prioridades",         prioridades());
        result.put("tiposIncidencia",     tiposIncidencia());
        result.put("estadosIncidencia",   estadosIncidencia());
        result.put("tiposEmpleado",       tiposEmpleado());
        result.put("tiposContratacion",   tiposContratacion());
        result.put("tiposDocumento",      tiposDocumento());
        return result;
    }

    private List<Map<String, String>> roles() {
        return List.of(
            map("value","ROLE_ADMIN",     "label","Administrador",       "badgeClass","admin-badge--admin"),
            map("value","ROLE_RECEPCION", "label","Recepción",           "badgeClass","admin-badge--recepcion"),
            map("value","ROLE_LIMPIEZA",  "label","Limpieza",            "badgeClass","admin-badge--limpieza"),
            map("value","ROLE_GIMNASIO",    "label","Monitor de Gimnasio", "badgeClass","admin-badge--gimnasio"),
            map("value","ROLE_SPA",         "label","Monitor de Spa",      "badgeClass","admin-badge--spa"),
            map("value","ROLE_COCHE",       "label","Servicio de Coche",   "badgeClass","admin-badge--coche"),
            map("value","ROLE_HOSTELERIA",  "label","Hostelería",          "badgeClass","admin-badge--hosteleria"),
            map("value","ROLE_ROOMSERVICE", "label","Room Service",        "badgeClass","admin-badge--roomservice")
        );
    }

    private List<Map<String, String>> departamentos() {
        return List.of(
            map("value","RECEPCION",     "label","Recepción"),
            map("value","LIMPIEZA",      "label","Limpieza"),
            map("value","COCINA",        "label","Cocina"),
            map("value","MANTENIMIENTO", "label","Mantenimiento"),
            map("value","DIRECCION",     "label","Dirección"),
            map("value","OTRO",          "label","Otro")
        );
    }

    private List<Map<String, String>> tiposHabitacion() {
        return List.of(
            map("value","NORMAL","label","Normal"),
            map("value","DOBLE", "label","Doble"),
            map("value","SUITE", "label","Suite"),
            map("value","LUJO",  "label","Lujo")
        );
    }

    private List<Map<String, String>> estadosLimpieza() {
        return List.of(
            map("value","LIMPIA",        "label","Limpia",        "cssClass","estado-limpia",        "badge","bg-success"),
            map("value","SUCIA",         "label","Sucia",         "cssClass","estado-sucia",         "badge","bg-warning text-dark"),
            map("value","EN_LIMPIEZA",   "label","En limpieza",   "cssClass","estado-progreso",      "badge","bg-info text-dark"),
            map("value","MANTENIMIENTO", "label","Mantenimiento", "cssClass","estado-mantenimiento", "badge","bg-danger")
        );
    }

    private List<Map<String, String>> estadosPago() {
        return List.of(
            map("value","PENDIENTE",   "label","Pendiente",   "pill","rcp-pill rcp-pill--warn"),
            map("value","COMPLETADO",  "label","Completado",  "pill","rcp-pill rcp-pill--ok"),
            map("value","CANCELADO",   "label","Cancelado",   "pill","rcp-pill rcp-pill--err"),
            map("value","REEMBOLSADO", "label","Reembolsado", "pill","rcp-pill rcp-pill--warn")
        );
    }

    private List<Map<String, String>> estadosConversacion() {
        return List.of(
            map("value","ABIERTA",   "label","Abierta"),
            map("value","PENDIENTE", "label","Pendiente"),
            map("value","RESUELTA",  "label","Resuelta")
        );
    }

    private List<Map<String, String>> prioridades() {
        return List.of(
            map("value","BAJA",    "label","Baja",    "badge","bg-dark"),
            map("value","NORMAL",  "label","Normal",  "badge","bg-secondary"),
            map("value","ALTA",    "label","Alta",    "badge","bg-warning text-dark"),
            map("value","URGENTE", "label","Urgente", "badge","bg-danger")
        );
    }

    private List<Map<String, String>> tiposIncidencia() {
        return List.of(
            map("value","MANTENIMIENTO", "label","Mantenimiento"),
            map("value","INVENTARIO",    "label","Inventario"),
            map("value","OTRO",          "label","Otro")
        );
    }

    private List<Map<String, String>> estadosIncidencia() {
        return List.of(
            map("value","ABIERTA",    "label","Abierta"),
            map("value","EN_PROCESO", "label","En proceso"),
            map("value","RESUELTA",   "label","Resuelta")
        );
    }

    private List<Map<String, String>> tiposEmpleado() {
        return List.of(
            map("value","PERSONAL", "label","Personal"),
            map("value","BECARIO",  "label","Becario")
        );
    }

    private List<Map<String, String>> tiposContratacion() {
        return List.of(
            map("value","INDEFINIDO", "label","Indefinido"),
            map("value","TEMPORAL",   "label","Temporal"),
            map("value","POR_OBRA",   "label","Por obra"),
            map("value","PRACTICAS",  "label","Prácticas")
        );
    }

    private List<Map<String, String>> tiposDocumento() {
        return List.of(
            map("value","DNI",       "label","DNI"),
            map("value","NIE",       "label","NIE"),
            map("value","PASAPORTE", "label","Pasaporte"),
            map("value","CEDULA",    "label","Cédula"),
            map("value","OTRO",      "label","Otro")
        );
    }

    private Map<String, String> map(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length - 1; i += 2) m.put(kv[i], kv[i + 1]);
        return m;
    }
}
