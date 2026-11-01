package com.columbiaburger.business.dto.request;

import lombok.Getter;
import lombok.Setter;

/** Crear (todos los campos) o editar (solo los que vengan) un usuario del personal. */
@Getter @Setter
public class UserRequest {
    private String username;
    private String displayName;
    private String role;      // ADMIN, KITCHEN, DELIVERY
    private String password;  // obligatorio al crear; al editar, solo si se quiere cambiar
    private Boolean active;
}
