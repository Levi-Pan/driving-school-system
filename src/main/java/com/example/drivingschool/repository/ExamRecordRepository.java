package com.example.drivingschool.repository;

import com.example.drivingschool.model.ExamRecord;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 考试记录数据访问：考试记录的持久化与查询。
 */
public interface ExamRecordRepository extends JpaRepository<ExamRecord, Long> {
}
