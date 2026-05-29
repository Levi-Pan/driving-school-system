package com.example.drivingschool.repository;

import com.example.drivingschool.model.ExamRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRecordRepository extends JpaRepository<ExamRecord, Long> {
}
