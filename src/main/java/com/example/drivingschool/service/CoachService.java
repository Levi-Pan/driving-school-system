package com.example.drivingschool.service;

import com.example.drivingschool.dto.CoachAvailabilityRequest;
import com.example.drivingschool.dto.CoachCreateRequest;
import com.example.drivingschool.dto.CoachRecommendation;
import com.example.drivingschool.dto.CoachUpdateRequest;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.CoachRepository;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class CoachService {
    private final CoachRepository coachRepository;
    private final StudentRepository studentRepository;

    public CoachService(CoachRepository coachRepository, StudentRepository studentRepository) {
        this.coachRepository = coachRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public List<Coach> listCoaches() {
        return coachRepository.findAll().stream()
                .sorted(Comparator.comparing(Coach::getRating).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public Coach getCoach(Long coachId) {
        return requireCoach(coachId);
    }

    public Coach createCoach(CoachCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("教练姓名不能为空");
        }
        Coach coach = new Coach();
        coach.setName(request.getName());
        coach.setPhone(request.getPhone() == null ? "" : request.getPhone());
        coach.setVehicleType(request.getVehicleType() == null ? "C1" : request.getVehicleType());
        coach.setMaxStudents(request.getMaxStudents() <= 0 ? 5 : request.getMaxStudents());
        coach.setGender(request.getGender() == null ? "" : request.getGender());
        coach.setYearsOfExperience(request.getYearsOfExperience());
        coach.setBio(request.getBio() == null ? "" : request.getBio());
        coach.setAvatar(request.getAvatar() == null ? "" : request.getAvatar());
        coach.setRating(5.0);
        coach.setStatus("在岗");
        return coachRepository.save(coach);
    }

    public Coach updateCoach(Long id, CoachUpdateRequest request) {
        Coach coach = requireCoach(id);
        if (request.getName() != null && !request.getName().isBlank()) coach.setName(request.getName());
        if (request.getPhone() != null) coach.setPhone(request.getPhone());
        if (request.getVehicleType() != null && !request.getVehicleType().isBlank()) coach.setVehicleType(request.getVehicleType());
        if (request.getMaxStudents() != null && request.getMaxStudents() > 0) coach.setMaxStudents(request.getMaxStudents());
        if (request.getGender() != null) coach.setGender(request.getGender());
        if (request.getYearsOfExperience() != null) coach.setYearsOfExperience(request.getYearsOfExperience());
        if (request.getBio() != null) coach.setBio(request.getBio());
        if (request.getAvatar() != null) coach.setAvatar(request.getAvatar());
        return coachRepository.save(coach);
    }

    public void deleteCoach(Long id) {
        Coach coach = requireCoach(id);
        for (Long studentId : coach.getStudentIds()) {
            studentRepository.findById(studentId).ifPresent(student -> {
                student.setCoachId(null);
                student.setStatus("待分配");
                studentRepository.save(student);
            });
        }
        coachRepository.delete(coach);
    }

    public Coach setCoachStatus(Long id, String status) {
        if (!List.of("在岗", "暂停接单", "离职").contains(status)) {
            throw new IllegalArgumentException("无效的教练状态：" + status);
        }
        Coach coach = requireCoach(id);
        String oldStatus = coach.getStatus();
        coach.setStatus(status);
        if ("离职".equals(status) && !"离职".equals(oldStatus)) {
            for (Long studentId : coach.getStudentIds()) {
                studentRepository.findById(studentId).ifPresent(student -> {
                    student.setCoachId(null);
                    student.setStatus("待分配");
                    studentRepository.save(student);
                });
            }
            coach.getStudentIds().clear();
        }
        return coachRepository.save(coach);
    }

    public Coach updateCoachAvailability(Long coachId, CoachAvailabilityRequest request) {
        Coach coach = requireCoach(coachId);
        coach.setFreeTimes(request.getFreeTimes());
        return coachRepository.save(coach);
    }

    @Transactional(readOnly = true)
    public List<CoachRecommendation> recommendCoaches(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NoSuchElementException("学员不存在：" + studentId));
        return coachRepository.findAll().stream()
                .filter(coach -> coach.getStatus() == null || "在岗".equals(coach.getStatus()))
                .filter(coach -> coach.getVehicleType() != null && coach.getVehicleType().equals(student.getVehicleType()))
                .filter(coach -> coach.getFreeSlots() > 0)
                .map(coach -> {
                    double score = coach.getRating() * 20 + coach.getFreeSlots() * 10 - coach.getWorkload() * 2;
                    String reason = "车型匹配，空闲名额 " + coach.getFreeSlots() + "，评分 " + coach.getRating();
                    return new CoachRecommendation(coach, Math.round(score * 10.0) / 10.0, reason);
                })
                .sorted(Comparator.comparing(CoachRecommendation::getScore).reversed())
                .toList();
    }

    public Student assignCoach(Long studentId, Long coachId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NoSuchElementException("学员不存在：" + studentId));
        Coach coach = requireCoach(coachId);
        if (!coach.getVehicleType().equals(student.getVehicleType())) {
            throw new IllegalArgumentException("教练准教车型与学员报考车型不匹配");
        }
        if (coach.getFreeSlots() <= 0) {
            throw new IllegalArgumentException("该教练当前没有空闲名额");
        }
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String oldCoachName = null;
        Long oldCoachId = student.getCoachId();
        if (oldCoachId != null) {
            Coach oldCoach = requireCoach(oldCoachId);
            oldCoachName = oldCoach.getName();
            oldCoach.getStudentIds().remove(studentId);
            coachRepository.save(oldCoach);
        }
        student.setCoachId(coachId);
        student.setStatus("学习中");
        if (!coach.getStudentIds().contains(studentId)) {
            coach.getStudentIds().add(studentId);
        }
        String logMsg;
        if (oldCoachName != null) {
            logMsg = timestamp + " 换教练：" + oldCoachName + " → " + coach.getName();
        } else {
            logMsg = timestamp + " 分配教练：" + coach.getName();
        }
        student.getCoachChangeLogs().add(logMsg);
        student.getProgressLogs().add(logMsg);
        coachRepository.save(coach);
        return studentRepository.save(student);
    }

    public Student unbindCoach(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NoSuchElementException("学员不存在：" + studentId));
        if (student.getCoachId() == null) {
            throw new IllegalArgumentException("该学员当前没有绑定教练");
        }
        Long oldCoachId = student.getCoachId();
        Coach oldCoach = requireCoach(oldCoachId);
        String logMsg = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                + " 解绑教练：" + oldCoach.getName() + "（管理员操作）";
        oldCoach.getStudentIds().remove(studentId);
        coachRepository.save(oldCoach);
        student.setCoachId(null);
        student.setStatus("待分配");
        student.getCoachChangeLogs().add(logMsg);
        student.getProgressLogs().add(logMsg);
        return studentRepository.save(student);
    }

    private Coach requireCoach(Long id) {
        return coachRepository.findById(id).orElseThrow(() -> new NoSuchElementException("教练不存在：" + id));
    }
}
