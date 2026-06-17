package com.example.drivingschool.service;

import com.example.drivingschool.model.ExamVenue;
import com.example.drivingschool.model.VehicleType;
import com.example.drivingschool.repository.ExamVenueRepository;
import com.example.drivingschool.repository.VehicleTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * 基础配置服务：车型与考场的增删改查、启用/停用、费用校验。
 */
@Service
@Transactional
public class ConfigService {
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ExamVenueRepository examVenueRepository;

    public ConfigService(VehicleTypeRepository vehicleTypeRepository, ExamVenueRepository examVenueRepository) {
        this.vehicleTypeRepository = vehicleTypeRepository;
        this.examVenueRepository = examVenueRepository;
    }

    // ========== 车型管理 ==========

    @Transactional(readOnly = true)
    public List<VehicleType> listVehicleTypes() {
        return vehicleTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(VehicleType::getId))
                .toList();
    }

    public VehicleType createVehicleType(VehicleType vt) {
        if (vt.getName() == null || vt.getName().isBlank()) {
            throw new IllegalArgumentException("车型名称不能为空");
        }
        if (vt.getRegistrationFee() == null) vt.setRegistrationFee(BigDecimal.ZERO);
        if (vt.getExamFee() == null) vt.setExamFee(BigDecimal.ZERO);
        return vehicleTypeRepository.save(vt);
    }

    public VehicleType updateVehicleType(Long id, VehicleType update) {
        VehicleType vt = requireVehicleType(id);
        if (update.getName() != null && !update.getName().isBlank()) vt.setName(update.getName());
        if (update.getDescription() != null) vt.setDescription(update.getDescription());
        if (update.getMinAge() > 0) vt.setMinAge(update.getMinAge());
        if (update.getMaxAge() > 0) vt.setMaxAge(update.getMaxAge());
        if (update.getRequiredHours() > 0) vt.setRequiredHours(update.getRequiredHours());
        if (update.getRegistrationFee() != null) vt.setRegistrationFee(update.getRegistrationFee());
        if (update.getExamFee() != null) vt.setExamFee(update.getExamFee());
        return vehicleTypeRepository.save(vt);
    }

    public VehicleType toggleVehicleType(Long id, boolean enabled) {
        VehicleType vt = requireVehicleType(id);
        vt.setEnabled(enabled);
        return vehicleTypeRepository.save(vt);
    }

    public void deleteVehicleType(Long id) {
        vehicleTypeRepository.deleteById(id);
    }

    private VehicleType requireVehicleType(Long id) {
        return vehicleTypeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("车型不存在：" + id));
    }

    // ========== 考场管理 ==========

    @Transactional(readOnly = true)
    public List<ExamVenue> listExamVenues() {
        return examVenueRepository.findAll().stream()
                .sorted(Comparator.comparing(ExamVenue::getId))
                .toList();
    }

    public ExamVenue createExamVenue(ExamVenue venue) {
        if (venue.getName() == null || venue.getName().isBlank()) {
            throw new IllegalArgumentException("考场名称不能为空");
        }
        return examVenueRepository.save(venue);
    }

    public ExamVenue updateExamVenue(Long id, ExamVenue update) {
        ExamVenue venue = requireExamVenue(id);
        if (update.getName() != null && !update.getName().isBlank()) venue.setName(update.getName());
        if (update.getAddress() != null) venue.setAddress(update.getAddress());
        if (update.getSubjects() != null && !update.getSubjects().isEmpty()) venue.setSubjects(update.getSubjects());
        if (update.getTimeSlots() != null && !update.getTimeSlots().isEmpty()) venue.setTimeSlots(update.getTimeSlots());
        return examVenueRepository.save(venue);
    }

    public ExamVenue toggleExamVenue(Long id, boolean enabled) {
        ExamVenue venue = requireExamVenue(id);
        venue.setEnabled(enabled);
        return examVenueRepository.save(venue);
    }

    public void deleteExamVenue(Long id) {
        examVenueRepository.deleteById(id);
    }

    private ExamVenue requireExamVenue(Long id) {
        return examVenueRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("考场不存在：" + id));
    }
}
