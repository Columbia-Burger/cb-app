package com.columbiaburger.business.security;

import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Wraps the application DataSource. Every time a connection is borrowed
 * from the pool, injects the current user's id and role as PostgreSQL
 * session-level variables so RLS policies can evaluate them.
 * Resets the variables when the connection is returned to the pool.
 */
public class RlsDataSourceWrapper extends DelegatingDataSource {

    public RlsDataSourceWrapper(DataSource delegate) {
        super(delegate);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return wrap(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return wrap(super.getConnection(username, password));
    }

    private static Connection wrap(Connection conn) throws SQLException {
        applyContext(conn);
        return (Connection) Proxy.newProxyInstance(
                conn.getClass().getClassLoader(),
                new Class[]{Connection.class},
                (proxy, method, args) -> {
                    if ("close".equals(method.getName())) {
                        clearContext(conn);
                    }
                    return method.invoke(conn, args);
                }
        );
    }

    private static void applyContext(Connection conn) throws SQLException {
        String userId = RlsContextHolder.getUserId();
        String role   = RlsContextHolder.getUserRole();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT set_config('app.user_id', ?, false), set_config('app.user_role', ?, false)")) {
            ps.setString(1, userId);
            ps.setString(2, role);
            ps.execute();
        }
    }

    private static void clearContext(Connection conn) {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT set_config('app.user_id', '', false), set_config('app.user_role', '', false)")) {
            ps.execute();
        } catch (SQLException ignored) {}
    }
}
