package com.portfolio.selfhealing.api;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "service", "Self-Healing Platform API",
                "status", "UP",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "health", "/actuator/health",
                "api", "/api/v1"
        );
    }
}
