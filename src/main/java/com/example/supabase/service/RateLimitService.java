package com.example.supabase.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    /** 5 registros por hora por IP */
    public Bucket bucketRegistro(String ip) {
        return buckets.computeIfAbsent("registro:" + ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1))))
                .build());
    }

    /** 10 pagos por hora por IP */
    public Bucket bucketPago(String ip) {
        return buckets.computeIfAbsent("pago:" + ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofHours(1))))
                .build());
    }

    /** 20 reservas por hora por IP */
    public Bucket bucketReserva(String ip) {
        return buckets.computeIfAbsent("reserva:" + ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(20, Refill.intervally(20, Duration.ofHours(1))))
                .build());
    }
}
