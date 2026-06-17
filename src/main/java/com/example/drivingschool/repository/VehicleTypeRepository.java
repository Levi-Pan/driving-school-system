package com.example.drivingschool.repository;

import com.example.drivingschool.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 车型配置数据访问：驾驶车型配置的持久化与查询。
 */
public interface VehicleTypeRepository extends JpaRepository<VehicleType, Long> {
}
