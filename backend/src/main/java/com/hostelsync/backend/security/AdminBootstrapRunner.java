package com.hostelsync.backend.security;

import com.hostelsync.backend.entity.Role;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Safe, opt-in administrative account bootstrap runner.
 * Disabled by default. Only executes when explicitly enabled with non-blank email and password.
 */
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.full-name:System Administrator}")
    private String adminFullName;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            log.debug("Initial admin bootstrap is disabled (default).");
            return;
        }

        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("Admin bootstrap is enabled, but BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD is blank. Skipping.");
            return;
        }

        if (userRepository.existsByEmail(adminEmail.trim())) {
            log.info("Admin bootstrap skipped: User with email [{}] already exists.", adminEmail.trim());
            return;
        }

        User adminUser = new User(
                adminFullName.trim(),
                adminEmail.trim(),
                passwordEncoder.encode(adminPassword),
                Role.ADMIN,
                true
        );

        userRepository.save(adminUser);
        log.info("Safe initial admin bootstrap completed successfully for [{}] with role [ADMIN].", adminEmail.trim());
    }
}
