package com.columbiaburger.business.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Sirve el frontend de Angular (copiado a classpath:/static/ al construir la imagen).
 * Rutas de la app como /admin/reportes no existen como archivo: se responde index.html y el
 * router de Angular resuelve la pantalla. Lo que empieza por /api/ nunca cae aquí.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    private static final String STATIC = "classpath:/static/";

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // JS/CSS del build llevan hash en el nombre: se pueden cachear un año
        registry.addResourceHandler("/*.js", "/*.css", "/media/**")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        // Todo lo demás (index.html, assets/, íconos, manifest) se revalida en cada visita
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new SpaFallbackResolver());
    }

    private static final class SpaFallbackResolver extends PathResourceResolver {
        private final Resource index = new ClassPathResource("static/index.html");

        @Override
        protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location) throws IOException {
            Resource requested = location.createRelative(resourcePath);
            if (requested.exists() && requested.isReadable()) {
                return requested;
            }
            // Una API inexistente debe dar 404, no la app; un archivo con extensión que no existe, también
            if (resourcePath.startsWith("api/") || resourcePath.contains(".")) {
                return null;
            }
            return index.exists() ? index : null;
        }
    }
}
