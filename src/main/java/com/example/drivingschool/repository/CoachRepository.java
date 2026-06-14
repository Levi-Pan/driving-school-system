package com.example.drivingschool.repository;

import com.example.drivingschool.model.Coach;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoachRepository extends JpaRepository<Coach, Long> {
    java.util.Optional<Coach> findByAccountId(Long accountId);
}
