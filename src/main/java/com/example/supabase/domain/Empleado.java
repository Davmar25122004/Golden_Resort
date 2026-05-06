package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "empleados")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Empleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", unique = true, nullable = false)
    private Usuario usuario;

    @Column(length = 100)
    private String apellidos;

    @Column(length = 20)
    private String genero;

    @Column(name = "tipo_documento", length = 20)
    private String tipoDocumento;

    @Column(name = "num_documento", length = 30)
    private String numDocumento;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String cargo;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "fecha_contratacion")
    private LocalDate fechaContratacion;

    @Column(name = "tipo_contratacion", length = 30)
    private String tipoContratacion;

    @Column(name = "tipo_empleado", length = 20)
    private String tipoEmpleado;

    @Column(name = "lugar_nacimiento", length = 100)
    private String lugarNacimiento;

    @Column(length = 60)
    private String pais;

    @Column(name = "telefono_casa", length = 20)
    private String telefonoCasa;

    @Column(name = "direccion_casa", length = 200)
    private String direccionCasa;

    @Column(name = "telefono_oficina", length = 20)
    private String telefonoOficina;

    @Column(name = "direccion_oficina", length = 200)
    private String direccionOficina;

    @Column(length = 40)
    private String departamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turno_plan_id")
    private TurnoPlan turnoPlan;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    void prePersist() {
        var now = LocalDateTime.now();
        if (creadoEn == null) creadoEn = now;
        actualizadoEn = now;
    }

    @PreUpdate
    void preUpdate() { actualizadoEn = LocalDateTime.now(); }
}
