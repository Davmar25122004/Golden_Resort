package com.example.supabase.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "hotel")
public class HotelProperties {

    private String checkinTime  = "15:00";
    private String checkoutTime = "11:00";

    public String getCheckinTime()  { return checkinTime; }
    public void   setCheckinTime(String v)  { this.checkinTime = v; }
    public String getCheckoutTime() { return checkoutTime; }
    public void   setCheckoutTime(String v) { this.checkoutTime = v; }
}
