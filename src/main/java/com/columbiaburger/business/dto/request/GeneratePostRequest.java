package com.columbiaburger.business.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class GeneratePostRequest {
    private String topic;     // free text: "Classic Burger" or "promoción fin de semana"
    private String imageUrl;  // Cloudinary URL (optional)
    private String tone;      // optional: "divertido", "profesional", "casual" — default "casual y apetitoso"
}
