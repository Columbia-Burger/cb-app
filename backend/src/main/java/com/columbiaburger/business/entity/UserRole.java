package com.columbiaburger.business.entity;

/** Roles del personal. Los clientes (CUSTOMER) se autentican por OTP y no son usuarios. */
public enum UserRole {
    ADMIN,
    KITCHEN,
    DELIVERY
}
