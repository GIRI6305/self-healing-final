package com.portfolio.selfhealing.api;
import org.springframework.http.*; import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.servlet.NoHandlerFoundException; import org.springframework.web.bind.annotation.*; import java.time.*; import java.util.*;
@RestControllerAdvice public class GlobalExceptionHandler { @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e) { return ResponseEntity.badRequest().body(Map.of("timestamp",Instant.now(),"error","VALIDATION_FAILED","message","Request validation failed")); } @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> notFound(NoResourceFoundException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("timestamp", Instant.now(), "error", "NOT_FOUND", "message", "Resource not found")); }
    @ExceptionHandler(NoHandlerFoundException.class)
    ResponseEntity<?> noHandler(NoHandlerFoundException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("timestamp", Instant.now(), "error", "NOT_FOUND", "message", "Endpoint not found")); }
    @ExceptionHandler(Exception.class) ResponseEntity<?> error(Exception e) { return ResponseEntity.status(500).body(Map.of("timestamp",Instant.now(),"error","INTERNAL_ERROR","message","Unexpected server error")); } }
