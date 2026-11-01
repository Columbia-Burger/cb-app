package com.columbiaburger.business.security;

import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

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

    private static final String SET_CTX_SQL =
            "SELECT set_config('app.user_id', ?, false), set_config('app.user_role', ?, false)";
    private static final String CLEAR_CTX_SQL =
            "SELECT set_config('app.user_id', '', false), set_config('app.user_role', '', false)";

    private static void applyContext(Connection conn) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(SET_CTX_SQL)) {
            ps.setString(1, RlsContextHolder.getUserId());
            ps.setString(2, RlsContextHolder.getUserRole());
            ps.execute();
        }
    }

    private static void clearContext(Connection conn) {
        try (PreparedStatement ps = conn.prepareStatement(CLEAR_CTX_SQL)) {
            ps.execute();
        } catch (SQLException ignored) {}
    }
}
