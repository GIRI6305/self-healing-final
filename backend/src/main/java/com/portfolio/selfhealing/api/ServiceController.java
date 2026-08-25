package com.portfolio.selfhealing.api;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.time.*; import java.util.*; import java.util.concurrent.atomic.AtomicBoolean; import java.util.concurrent.atomic.AtomicLong;
@RestController @RequestMapping("/api/v1")
public class ServiceController {
  private final AtomicBoolean healthy=new AtomicBoolean(true); private final AtomicBoolean failure=new AtomicBoolean(false); private final AtomicLong requests=new AtomicLong();
  @GetMapping("/services") public Map<String,Object> services() { requests.incrementAndGet(); return Map.of("items",List.of(Map.of("id","platform-api","status",healthy.get()?"UP":"DEGRADED","version","1.0.0")),"count",1); }
  @GetMapping("/services/{id}") public ResponseEntity<?> service(@PathVariable String id) { requests.incrementAndGet(); if(!id.equals("platform-api")) return ResponseEntity.notFound().build(); return ResponseEntity.ok(Map.of("id",id,"status",healthy.get()?"UP":"DEGRADED","timestamp",Instant.now())); }
  @GetMapping("/health") public Map<String,Object> health() { return Map.of("status",healthy.get()?"UP":"DOWN","failureInjection",failure.get()); }
  @PostMapping("/failure") public Map<String,Object> failure(@Valid @RequestBody FailureRequest r) { if(r.enabled()) { failure.set(true); healthy.set(false); } else { failure.set(false); healthy.set(true); } return health(); }
  @PostMapping("/remediation") public Map<String,Object> remediate() { failure.set(false); healthy.set(true); return Map.of("action","restart-or-recover","status","RECOVERED","timestamp",Instant.now()); }
  @GetMapping("/incidents") public List<Map<String,Object>> incidents() { return failure.get()?List.of(Map.of("id","INC-001","severity","HIGH","status","OPEN","service","platform-api")):List.of(); }
  @GetMapping("/metrics") public Map<String,Object> metrics() { return Map.of("requests",requests.get(),"healthy",healthy.get(),"timestamp",Instant.now()); }
  public record FailureRequest(@NotNull Boolean enabled) { }
}
