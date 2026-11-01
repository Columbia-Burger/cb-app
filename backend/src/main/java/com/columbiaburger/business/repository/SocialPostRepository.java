package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.PostStatus;
import com.columbiaburger.business.entity.SocialPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SocialPostRepository extends JpaRepository<SocialPost, Long> {

    List<SocialPost> findAllByOrderByCreatedAtDesc();

    List<SocialPost> findByStatusOrderByCreatedAtDesc(PostStatus status);

    List<SocialPost> findByStatusAndScheduledAtIsNotNullAndScheduledAtLessThanEqual(
            PostStatus status, LocalDateTime now);
}
