package com.example.drivingschool.repository;

import com.example.drivingschool.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    /**
     * 查询指定状态的学员列表
     */
    List<Student> findByStatus(String status);

    /**
     * 查询多个状态中的学员列表
     */
    List<Student> findByStatusIn(List<String> statuses);
}
