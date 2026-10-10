package com.columbiaburger.business.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Spring Boot oculta el "reason" de ResponseStatusException por defecto, así que el frontend
 * solo veía un error genérico (p. ej. el rechazo de Factus/DIAN). Solo se expone el mensaje de
 * errores controlados; las excepciones inesperadas siguen usando el manejo por defecto.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException e) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", e.getStatusCode().value());
        body.put("message", e.getReason() != null ? e.getReason() : "");
        return ResponseEntity.status(e.getStatusCode()).body(body);
    }
}
