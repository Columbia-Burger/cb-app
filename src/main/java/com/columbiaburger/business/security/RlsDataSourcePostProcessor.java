package com.columbiaburger.business.security;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Wraps the auto-configured HikariCP DataSource with RlsDataSourceWrapper
 * so every borrowed connection has the current user's id and role injected
 * as PostgreSQL session variables before any query runs.
 */
@Component
public class RlsDataSourcePostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource ds && !(bean instanceof RlsDataSourceWrapper)) {
            return new RlsDataSourceWrapper(ds);
        }
        return bean;
    }
}
