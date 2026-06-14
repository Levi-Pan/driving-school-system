package com.example.drivingschool.controller;

import com.example.drivingschool.model.ExamVenue;
import com.example.drivingschool.model.VehicleType;
import com.example.drivingschool.service.ConfigService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ConfigController {
    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    // ========== 车型 ==========

    @GetMapping("/vehicle-types")
    public List<VehicleType> listVehicleTypes() {
        return configService.listVehicleTypes();
    }

    @PostMapping("/vehicle-types")
    public VehicleType createVehicleType(@RequestBody VehicleType vt) {
        return configService.createVehicleType(vt);
    }

    @PutMapping("/vehicle-types/{id}")
    public VehicleType updateVehicleType(@PathVariable Long id, @RequestBody VehicleType vt) {
        return configService.updateVehicleType(id, vt);
    }

    @PutMapping("/vehicle-types/{id}/toggle")
    public VehicleType toggleVehicleType(@PathVariable Long id, @RequestParam boolean enabled) {
        return configService.toggleVehicleType(id, enabled);
    }

    @DeleteMapping("/vehicle-types/{id}")
    public void deleteVehicleType(@PathVariable Long id) {
        configService.deleteVehicleType(id);
    }

    // ========== 考场 ==========

    @GetMapping("/exam-venues")
    public List<ExamVenue> listExamVenues() {
        return configService.listExamVenues();
    }

    @PostMapping("/exam-venues")
    public ExamVenue createExamVenue(@RequestBody ExamVenue venue) {
        return configService.createExamVenue(venue);
    }

    @PutMapping("/exam-venues/{id}")
    public ExamVenue updateExamVenue(@PathVariable Long id, @RequestBody ExamVenue venue) {
        return configService.updateExamVenue(id, venue);
    }

    @PutMapping("/exam-venues/{id}/toggle")
    public ExamVenue toggleExamVenue(@PathVariable Long id, @RequestParam boolean enabled) {
        return configService.toggleExamVenue(id, enabled);
    }

    @DeleteMapping("/exam-venues/{id}")
    public void deleteExamVenue(@PathVariable Long id) {
        configService.deleteExamVenue(id);
    }
}
