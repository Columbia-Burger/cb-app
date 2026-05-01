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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

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

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

    // ─── A) Generate caption with Claude API ──────────────────────────────────

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

        @SuppressWarnings("unchecked")
        Map<String, Object> claudeResponse = restClient.post()
                .uri(ANTHROPIC_API_URL)
                .header("x-api-key", anthropicApiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        String responseText = extractClaudeText(claudeResponse);
        String[] parsed = parseCaptionAndHashtags(responseText);
        String caption = parsed[0];
        String hashtags = parsed[1];

        SocialPost post = SocialPost.builder()
                .topic(request.getTopic())
                .caption(caption)
                .hashtags(hashtags)
                .imageUrl(request.getImageUrl())
                .status(PostStatus.DRAFT)
                .build();

        SocialPost saved = socialPostRepository.save(post);
        return toResponse(saved);
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

    // ─── Delete post ──────────────────────────────────────────────────────────

    @Transactional
    public void deletePost(Long id) {
        if (!socialPostRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado");
        }
        socialPostRepository.deleteById(id);
    }

    // ─── D) Publish to Instagram ──────────────────────────────────────────────

    @Transactional
    public SocialPostResponse publishToInstagram(Long id) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado"));

        RestClient restClient = RestClient.create();
        String fullCaption = buildFullCaption(post);

        try {
            // Step 1: Create media container
            String step1Url = GRAPH_API_BASE + "/" + igAccountId + "/media";
            Map<String, Object> step1Body = new java.util.HashMap<>();
            step1Body.put("image_url", post.getImageUrl());
            step1Body.put("caption", fullCaption);
            step1Body.put("access_token", igAccessToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> containerResponse = restClient.post()
                    .uri(step1Url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(step1Body)
                    .retrieve()
                    .body(Map.class);

            String containerId = (String) containerResponse.get("id");
            if (containerId == null) {
                throw new RuntimeException("No se recibió container_id de Instagram");
            }

            // Step 2: Publish the container
            String step2Url = GRAPH_API_BASE + "/" + igAccountId + "/media_publish";
            Map<String, Object> step2Body = new java.util.HashMap<>();
            step2Body.put("creation_id", containerId);
            step2Body.put("access_token", igAccessToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> publishResponse = restClient.post()
                    .uri(step2Url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(step2Body)
                    .retrieve()
                    .body(Map.class);

            String instagramPostId = (String) publishResponse.get("id");

            post.setStatus(PostStatus.PUBLISHED);
            post.setPublishedAt(LocalDateTime.now());
            post.setInstagramPostId(instagramPostId);
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

        if (text == null || text.isBlank()) {
            return new String[]{caption, hashtags};
        }

        List<String> hashtagParts = new ArrayList<>();
        StringBuilder captionBuilder = new StringBuilder();

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

        if (caption.isEmpty()) {
            // Fallback: use full text as caption if parsing failed
            caption = text.length() > 150 ? text.substring(0, 150) : text;
        }
        if (hashtags.isEmpty() && !hashtagParts.isEmpty()) {
            hashtags = String.join(" ", hashtagParts);
        }

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
