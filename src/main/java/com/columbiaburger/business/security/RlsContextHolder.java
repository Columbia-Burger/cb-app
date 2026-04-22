package com.columbiaburger.business.security;

public final class RlsContextHolder {

    private static final ThreadLocal<String> userId = new ThreadLocal<>();
    private static final ThreadLocal<String> userRole = new ThreadLocal<>();

    private RlsContextHolder() {}

    public static void set(String id, String role) {
        userId.set(id != null ? id : "");
        userRole.set(role != null ? role : "");
    }

    public static String getUserId()   { return userId.get() != null   ? userId.get()   : ""; }
    public static String getUserRole() { return userRole.get() != null ? userRole.get() : ""; }

    public static void clear() {
        userId.remove();
        userRole.remove();
    }
}
