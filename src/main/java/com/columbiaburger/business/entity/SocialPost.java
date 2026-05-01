package com.columbiaburger.business.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "social_posts", schema = "business")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SocialPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(length = 500)
    private String hashtags;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 200)
    private String topic;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status = PostStatus.DRAFT;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "instagram_post_id", length = 100)
    private String instagramPostId;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = PostStatus.DRAFT;
    }
}
