package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.MessMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessMenuRepository extends JpaRepository<MessMenu, Long> {

    List<MessMenu> findByHostelIdOrderByDayOfWeek(Long hostelId);

    Optional<MessMenu> findByHostelIdAndDayOfWeek(Long hostelId, DayOfWeek dayOfWeek);

    List<MessMenu> findByHostelIsNullOrderByDayOfWeek();

    Optional<MessMenu> findByHostelIsNullAndDayOfWeek(DayOfWeek dayOfWeek);
}
