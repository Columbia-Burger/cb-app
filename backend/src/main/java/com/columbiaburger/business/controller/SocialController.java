package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.GeneratePostRequest;
import com.columbiaburger.business.dto.request.UpdatePostRequest;
import com.columbiaburger.business.dto.response.SocialPostResponse;
import com.columbiaburger.business.entity.PostStatus;
import com.columbiaburger.business.service.SocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    @PostMapping("/generate")
    public ResponseEntity<SocialPostResponse> generate(@RequestBody GeneratePostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(socialService.generatePost(request));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<SocialPostResponse>> listPosts(
            @RequestParam(required = false) PostStatus status) {
        if (status != null) {
            return ResponseEntity.ok(socialService.listByStatus(status));
        }
        return ResponseEntity.ok(socialService.listPosts());
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<SocialPostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(socialService.findById(id));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<SocialPostResponse> updatePost(
            @PathVariable Long id,
            @RequestBody UpdatePostRequest request) {
        return ResponseEntity.ok(socialService.updatePost(id, request));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        socialService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{id}/publish")
    public ResponseEntity<SocialPostResponse> publish(@PathVariable Long id) {
        return ResponseEntity.ok(socialService.publishToInstagram(id));
    }
}
