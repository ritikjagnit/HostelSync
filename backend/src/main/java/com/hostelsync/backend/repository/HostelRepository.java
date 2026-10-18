package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.Hostel;
import com.hostelsync.backend.entity.HostelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for Hostel operations.
 */
@Repository
public interface HostelRepository extends JpaRepository<Hostel, Long> {

    List<Hostel> findByActiveTrue();

    List<Hostel> findByHostelType(HostelType hostelType);

    List<Hostel> findByHostelTypeAndActiveTrue(HostelType hostelType);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    long countByActiveTrue();
}

