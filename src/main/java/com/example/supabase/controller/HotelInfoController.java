package com.example.supabase.controller;

import com.example.supabase.config.HotelProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/hotel")
public class HotelInfoController {

    private final HotelProperties props;

    public HotelInfoController(HotelProperties props) {
        this.props = props;
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "checkinTime",  props.getCheckinTime(),
                "checkoutTime", props.getCheckoutTime()
        );
    }
}
