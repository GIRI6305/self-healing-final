package com.portfolio.selfhealing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ServiceControllerTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void versionedServicesEndpointWorks() {
        ResponseEntity<String> response =
                rest.getForEntity("/api/v1/services", String.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("platform-api"));
    }

    @Test
    void legacyServicesEndpointWorks() {
        ResponseEntity<String> response =
                rest.getForEntity("/api/services", String.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void failureAndRecoveryWorkflowWorks() {
        ResponseEntity<String> failure =
                rest.postForEntity(
                        "/api/v1/failure/inject",
                        null,
                        String.class
                );

        assertEquals(HttpStatus.OK, failure.getStatusCode());
        assertTrue(failure.getBody().contains("\"DOWN\""));

        ResponseEntity<String> incidents =
                rest.getForEntity("/api/v1/incidents", String.class);

        assertEquals(HttpStatus.OK, incidents.getStatusCode());
        assertTrue(incidents.getBody().contains("INC-001"));

        ResponseEntity<String> remediation =
                rest.postForEntity(
                        "/api/v1/remediation",
                        null,
                        String.class
                );

        assertEquals(HttpStatus.OK, remediation.getStatusCode());
        assertTrue(remediation.getBody().contains("RECOVERED"));

        ResponseEntity<String> health =
                rest.getForEntity("/actuator/health", String.class);

        assertEquals(HttpStatus.OK, health.getStatusCode());
        assertTrue(health.getBody().contains("\"UP\""));

        ResponseEntity<String> recoveredIncidents =
                rest.getForEntity("/api/v1/incidents", String.class);

        assertEquals(HttpStatus.OK, recoveredIncidents.getStatusCode());
        assertEquals("[]", recoveredIncidents.getBody());
    }

    @Test
    void legacyFailureEndpointWorksWithoutBody() {
        ResponseEntity<String> failure =
                rest.postForEntity(
                        "/api/failure/inject",
                        null,
                        String.class
                );

        assertEquals(HttpStatus.OK, failure.getStatusCode());

        rest.postForEntity(
                "/api/remediate",
                null,
                String.class
        );
    }

    @Test
    void metricsEndpointWorks() {
        ResponseEntity<String> response =
                rest.getForEntity("/api/v1/metrics", String.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("healthy"));
    }
}
