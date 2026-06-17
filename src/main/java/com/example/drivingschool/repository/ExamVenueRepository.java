package com.example.drivingschool.repository;

import com.example.drivingschool.model.ExamVenue;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 考场配置数据访问：考场配置的持久化与查询。
 */
public interface ExamVenueRepository extends JpaRepository<ExamVenue, Long> {
}
