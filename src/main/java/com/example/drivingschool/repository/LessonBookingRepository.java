package com.example.drivingschool.repository;

import com.example.drivingschool.model.LessonBooking;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 约课记录数据访问：约课记录的持久化与查询。
 */
public interface LessonBookingRepository extends JpaRepository<LessonBooking, Long> {
}
