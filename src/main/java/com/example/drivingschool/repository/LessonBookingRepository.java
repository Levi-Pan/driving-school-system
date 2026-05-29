package com.example.drivingschool.repository;

import com.example.drivingschool.model.LessonBooking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonBookingRepository extends JpaRepository<LessonBooking, Long> {
}
