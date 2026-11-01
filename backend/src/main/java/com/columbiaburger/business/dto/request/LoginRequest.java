package com.columbiaburger.business.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {

    /** "email" se acepta mientras quede algún frontend viejo enviando el correo. */
    @NotBlank
    @JsonAlias("email")
    private String username;

    @NotBlank
    private String password;
}
