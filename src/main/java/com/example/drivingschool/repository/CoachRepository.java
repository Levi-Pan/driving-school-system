package com.example.drivingschool.repository;

import com.example.drivingschool.model.Coach;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 教练数据访问：按关联账号 ID 查询教练。
 */
public interface CoachRepository extends JpaRepository<Coach, Long> {
    java.util.Optional<Coach> findByAccountId(Long accountId);
}
