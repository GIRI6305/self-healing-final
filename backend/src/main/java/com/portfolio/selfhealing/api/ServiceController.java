package com.portfolio.selfhealing.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

@RestController
public class ServiceController {

    private final AtomicBoolean healthy = new AtomicBoolean(true);
    private final AtomicBoolean failure = new AtomicBoolean(false);
    private final AtomicLong requests = new AtomicLong();

    private Map<String, Object> healthResponse() {
        return Map.of(
                "status", healthy.get() ? "UP" : "DOWN",
                "failureInjection", failure.get()
        );
    }

    private Map<String, Object> servicesResponse() {
        requests.incrementAndGet();

        return Map.of(
                "items", List.of(
                        Map.of(
                                "id", "platform-api",
                                "status", healthy.get() ? "UP" : "DEGRADED",
                                "version", "1.0.0"
                        )
                ),
                "count", 1
        );
    }

    private Map<String, Object> incidentResponse() {
        return Map.of(
                "id", "INC-001",
                "severity", "HIGH",
                "service", "platform-api",
                "status", "OPEN"
        );
    }

    @GetMapping({"/api/v1/services", "/api/services"})
    public Map<String, Object> services() {
        return servicesResponse();
    }

    @GetMapping({"/api/v1/services/{id}", "/api/services/{id}"})
    public ResponseEntity<?> service(@PathVariable String id) {
        requests.incrementAndGet();

        if (!"platform-api".equals(id)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                Map.of(
                        "id", id,
                        "status", healthy.get() ? "UP" : "DEGRADED",
                        "timestamp", Instant.now()
                )
        );
    }

    @GetMapping({"/api/v1/health", "/api/health"})
    public Map<String, Object> health() {
        return healthResponse();
    }

    @PostMapping({"/api/v1/failure", "/api/failure"})
    public Map<String, Object> failure(
            @RequestBody(required = false) FailureRequest request
    ) {
        boolean enabled = request == null || request.enabled() == null || request.enabled();

        failure.set(enabled);
        healthy.set(!enabled);

        return healthResponse();
    }

    @PostMapping({"/api/v1/failure/inject", "/api/failure/inject"})
    public Map<String, Object> injectFailure() {
        failure.set(true);
        healthy.set(false);

        return healthResponse();
    }

    @PostMapping({"/api/v1/remediation", "/api/remediation"})
    public Map<String, Object> remediate() {
        failure.set(false);
        healthy.set(true);

        return Map.of(
                "action", "restart-or-recover",
                "timestamp", Instant.now(),
                "status", "RECOVERED"
        );
    }

    @PostMapping({"/api/v1/remediate", "/api/remediate"})
    public Map<String, Object> remediateLegacy() {
        return remediate();
    }

    @GetMapping({"/api/v1/incidents", "/api/incidents"})
    public List<Map<String, Object>> incidents() {
        return failure.get()
                ? List.of(incidentResponse())
                : List.of();
    }

    @GetMapping({"/api/v1/metrics", "/api/metrics"})
    public Map<String, Object> metrics() {
        return Map.of(
                "healthy", healthy.get(),
                "requests", requests.get(),
                "timestamp", Instant.now()
        );
    }

    public record FailureRequest(@NotNull Boolean enabled) {
    }
}
