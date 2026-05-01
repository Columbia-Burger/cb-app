package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.GeneratePostRequest;
import com.columbiaburger.business.dto.request.UpdatePostRequest;
import com.columbiaburger.business.dto.response.SocialPostResponse;
import com.columbiaburger.business.entity.PostStatus;
import com.columbiaburger.business.entity.SocialPost;
import com.columbiaburger.business.repository.SocialPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialService {

    private final SocialPostRepository socialPostRepository;

    @Value("${anthropic.api-key:}")
    private String anthropicApiKey;

    @Value("${instagram.account-id:}")
    private String igAccountId;

    @Value("${instagram.access-token:}")
    private String igAccessToken;

    @Value("${cloudinary.cloud-name:diaymnuut}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.logo-public-id:logo_z4ylms}")
    private String cloudinaryLogoPublicId;

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

    // Instagram Graph API returns text/javascript instead of application/json
    private static final RestClient GRAPH_CLIENT = buildGraphClient();

    private static RestClient buildGraphClient() {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(List.of(
                MediaType.APPLICATION_JSON,
                new MediaType("text", "javascript"),
                MediaType.TEXT_HTML
        ));
        return RestClient.builder()
                .messageConverters(c -> { c.clear(); c.add(converter); })
                .build();
    }

    // ─── A) Generate caption + optional campaign image ────────────────────────

    @Transactional
    public SocialPostResponse generatePost(GeneratePostRequest request) {
        String tone = (request.getTone() != null && !request.getTone().isBlank())
                ? request.getTone()
                : "casual y apetitoso";

        String userPrompt = String.format(
                "Crea un post de Instagram para Columbia Burger sobre: \"%s\".\n" +
                "Tono: %s.\n" +
                "Responde EXACTAMENTE en este formato (sin texto adicional):\n" +
                "CAPTION: <caption de máximo 150 caracteres>\n" +
                "HASHTAGS: <entre 5 y 8 hashtags en español relevantes para la escena gastronómica colombiana>",
                request.getTopic(), tone
        );

        String systemPrompt = "Eres el community manager de Columbia Burger, una hamburguesería en Colombia. " +
                "Escribes contenido auténtico, apetitoso y cercano para Instagram.";

        Map<String, Object> requestBody = Map.of(
                "model", "claude-haiku-4-5-20251001",
                "max_tokens", 300,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );

        RestClient restClient = RestClient.create();

        Map<String, Object> claudeResponse;
        try {
            //noinspection unchecked
            claudeResponse = restClient.post()
                    .uri(ANTHROPIC_API_URL)
                    .header("x-api-key", anthropicApiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Error llamando a la API de Claude: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Error al conectar con la IA: " + e.getMessage());
        }

        String responseText = extractClaudeText(claudeResponse);
        String[] parsed = parseCaptionAndHashtags(responseText);

        // If no image provided, generate a branded campaign card via Cloudinary transforms
        String imageUrl = (request.getImageUrl() != null && !request.getImageUrl().isBlank())
                ? request.getImageUrl()
                : buildCampaignImageUrl(request.getTopic());

        SocialPost post = SocialPost.builder()
                .topic(request.getTopic())
                .caption(parsed[0])
                .hashtags(parsed[1])
                .imageUrl(imageUrl)
                .status(PostStatus.DRAFT)
                .build();

        return toResponse(socialPostRepository.save(post));
    }

    // ─── B) List posts ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SocialPostResponse> listPosts() {
        return socialPostRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SocialPostResponse> listByStatus(PostStatus status) {
        return socialPostRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SocialPostResponse findById(Long id) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado"));
        return toResponse(post);
    }

    // ─── C) Update post ───────────────────────────────────────────────────────

    @Transactional
    public SocialPostResponse updatePost(Long id, UpdatePostRequest request) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado"));

        if (request.getCaption() != null) post.setCaption(request.getCaption());
        if (request.getHashtags() != null) post.setHashtags(request.getHashtags());
        if (request.getImageUrl() != null) post.setImageUrl(request.getImageUrl());
        if (request.getScheduledAt() != null) post.setScheduledAt(request.getScheduledAt());
        if (request.getStatus() != null) post.setStatus(request.getStatus());

        return toResponse(socialPostRepository.save(post));
    }

    // ─── D) Delete post ───────────────────────────────────────────────────────

    @Transactional
    public void deletePost(Long id) {
        if (!socialPostRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado");
        }
        socialPostRepository.deleteById(id);
    }

    // ─── E) Publish to Instagram ──────────────────────────────────────────────

    @Transactional
    public SocialPostResponse publishToInstagram(Long id) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado"));

        if (post.getImageUrl() == null || post.getImageUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El post no tiene imagen para publicar en Instagram");
        }

        String fullCaption = buildFullCaption(post);

        try {
            // Step 1: Create media container
            Map<String, Object> step1Body = new java.util.HashMap<>();
            step1Body.put("image_url", post.getImageUrl());
            step1Body.put("media_type", "IMAGE");
            step1Body.put("caption", fullCaption);
            step1Body.put("access_token", igAccessToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> containerResponse = GRAPH_CLIENT.post()
                    .uri(GRAPH_API_BASE + "/" + igAccountId + "/media")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(step1Body)
                    .retrieve()
                    .body(Map.class);

            String containerId = (String) containerResponse.get("id");
            if (containerId == null) {
                throw new RuntimeException("No se recibió container_id de Instagram");
            }

            // Wait for Instagram to finish processing the image (up to 30 s)
            waitForContainer(containerId);

            // Step 2: Publish the container
            Map<String, Object> step2Body = new java.util.HashMap<>();
            step2Body.put("creation_id", containerId);
            step2Body.put("access_token", igAccessToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> publishResponse = GRAPH_CLIENT.post()
                    .uri(GRAPH_API_BASE + "/" + igAccountId + "/media_publish")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(step2Body)
                    .retrieve()
                    .body(Map.class);

            post.setStatus(PostStatus.PUBLISHED);
            post.setPublishedAt(LocalDateTime.now());
            post.setInstagramPostId((String) publishResponse.get("id"));
            post.setErrorMessage(null);

        } catch (Exception e) {
            log.error("Error publicando en Instagram para post {}: {}", id, e.getMessage(), e);
            post.setStatus(PostStatus.FAILED);
            String msg = e.getMessage();
            post.setErrorMessage(msg != null && msg.length() > 500 ? msg.substring(0, 500) : msg);
        }

        return toResponse(socialPostRepository.save(post));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Polls the container status until FINISHED or throws after 15 attempts (30 s). */
    private void waitForContainer(String containerId) throws InterruptedException {
        for (int i = 0; i < 15; i++) {
            Thread.sleep(2000);
            @SuppressWarnings("unchecked")
            Map<String, Object> statusResp = GRAPH_CLIENT.get()
                    .uri(GRAPH_API_BASE + "/" + containerId
                            + "?fields=status_code&access_token=" + igAccessToken)
                    .retrieve()
                    .body(Map.class);
            String statusCode = (String) statusResp.get("status_code");
            if ("FINISHED".equals(statusCode)) return;
            if ("ERROR".equals(statusCode) || "EXPIRED".equals(statusCode)) {
                throw new RuntimeException("Instagram rechazó el media container: " + statusCode);
            }
        }
        throw new RuntimeException("Instagram no procesó el media container en 30 segundos");
    }

    /**
     * Builds a Cloudinary transformation URL that generates a 1080x1080 campaign card:
     * brand-gold background, logo anchored top-center, bold white title, brand name footer.
     */
    private String buildCampaignImageUrl(String topic) {
        try {
            String safe = topic.replaceAll("[,/\\\\%#&?]", " ").trim();
            if (safe.length() > 90) safe = safe.substring(0, 90).trim();
            String encoded = URLEncoder.encode(safe, StandardCharsets.UTF_8).replace("+", "%20");

            return "https://res.cloudinary.com/" + cloudinaryCloudName + "/image/upload/" +
                   "c_pad,b_rgb:faf7f2,w_1080,h_1080/" +
                   "l_text:Arial_82_bold:" + encoded + ",co_rgb:1c1208,c_fit,w_820,g_center/fl_layer_apply/" +
                   "l_" + cloudinaryLogoPublicId + ",w_150,g_south_east,x_45,y_45/fl_layer_apply";
        } catch (Exception e) {
            log.warn("Error construyendo URL de imagen de campaña: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractClaudeText(Map<String, Object> response) {
        try {
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
            if (content != null && !content.isEmpty()) {
                Object text = content.get(0).get("text");
                if (text != null) return text.toString().trim();
            }
        } catch (Exception e) {
            log.warn("Error extrayendo texto de respuesta Claude: {}", e.getMessage());
        }
        return "";
    }

    private String[] parseCaptionAndHashtags(String text) {
        String caption = "";
        String hashtags = "";

        if (text == null || text.isBlank()) return new String[]{caption, hashtags};

        List<String> hashtagParts = new ArrayList<>();

        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.toUpperCase().startsWith("CAPTION:")) {
                caption = trimmed.substring("CAPTION:".length()).trim();
            } else if (trimmed.toUpperCase().startsWith("HASHTAGS:")) {
                hashtags = trimmed.substring("HASHTAGS:".length()).trim();
            } else if (trimmed.startsWith("#")) {
                hashtagParts.add(trimmed);
            }
        }

        if (caption.isEmpty()) caption = text.length() > 150 ? text.substring(0, 150) : text;
        if (hashtags.isEmpty() && !hashtagParts.isEmpty()) hashtags = String.join(" ", hashtagParts);

        return new String[]{caption, hashtags};
    }

    private String buildFullCaption(SocialPost post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null) sb.append(post.getCaption());
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            sb.append("\n\n").append(post.getHashtags());
        }
        return sb.toString();
    }

    private SocialPostResponse toResponse(SocialPost post) {
        return SocialPostResponse.builder()
                .id(post.getId())
                .caption(post.getCaption())
                .hashtags(post.getHashtags())
                .imageUrl(post.getImageUrl())
                .topic(post.getTopic())
                .status(post.getStatus())
                .scheduledAt(post.getScheduledAt())
                .publishedAt(post.getPublishedAt())
                .instagramPostId(post.getInstagramPostId())
                .errorMessage(post.getErrorMessage())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
