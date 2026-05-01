package com.columbiaburger.business.dto.response;

import com.columbiaburger.business.entity.PostStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class SocialPostResponse {
    private Long id;
    private String caption;
    private String hashtags;
    private String imageUrl;
    private String topic;
    private PostStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime publishedAt;
    private String instagramPostId;
    private String errorMessage;
    private LocalDateTime createdAt;
}
