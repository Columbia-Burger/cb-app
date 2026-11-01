package com.columbiaburger.business.dto.request;

import com.columbiaburger.business.entity.PostStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public class UpdatePostRequest {
    private String caption;
    private String hashtags;
    private String imageUrl;
    private LocalDateTime scheduledAt;
    private PostStatus status;
}
