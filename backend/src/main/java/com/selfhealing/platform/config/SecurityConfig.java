package com.selfhealing.platform.config;

import org.springframework.context.annotation.Configuration;

/**
 * Security is intentionally not enabled for this demo platform.
 *
 * CORS is configured through CorsConfig using Spring MVC.
 * Authentication/authorization can be introduced later without
 * coupling the current API to Spring Security.
 */
@Configuration
public class SecurityConfig {
}
