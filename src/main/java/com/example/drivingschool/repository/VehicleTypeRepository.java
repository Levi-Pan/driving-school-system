package com.example.drivingschool.repository;

import com.example.drivingschool.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleTypeRepository extends JpaRepository<VehicleType, Long> {
}
