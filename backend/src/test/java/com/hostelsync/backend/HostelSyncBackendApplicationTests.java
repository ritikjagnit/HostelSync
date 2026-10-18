package com.hostelsync.backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class HostelSyncBackendApplicationTests {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Application context loads and connects to local H2 database")
    void contextLoadsWithH2Database() throws SQLException {
        assertNotNull(dataSource, "DataSource bean should be configured and injected");
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Database connection should be established successfully");
            DatabaseMetaData metaData = connection.getMetaData();
            String databaseProductName = metaData.getDatabaseProductName();
            String databaseUrl = metaData.getURL();
            assertTrue(databaseProductName.contains("H2"),
                    "Database product should be H2, but was: " + databaseProductName);
            assertTrue(databaseUrl.contains("h2:file:"),
                    "Database URL should be file-based H2, but was: " + databaseUrl);
        }
    }
}
