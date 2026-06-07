package com.example.drivingschool.service;

import com.example.drivingschool.dto.DashboardStats;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.CoachRepository;
import com.example.drivingschool.repository.ExamRecordRepository;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatsService {
    private final StudentRepository studentRepository;
    private final CoachRepository coachRepository;
    private final ExamRecordRepository examRecordRepository;

    public StatsService(StudentRepository studentRepository, CoachRepository coachRepository, ExamRecordRepository examRecordRepository) {
        this.studentRepository = studentRepository;
        this.coachRepository = coachRepository;
        this.examRecordRepository = examRecordRepository;
    }

    public DashboardStats dashboardStats() {
        DashboardStats stats = new DashboardStats();
        List<Student> studentList = studentRepository.findAll().stream()
                .sorted(Comparator.comparing(Student::getId).reversed())
                .toList();
        stats.setTotalStudents(studentList.size());
        long pendingInitial = studentList.stream().filter(s -> "待初审".equals(s.getStatus())).count();
        long pendingRe = studentList.stream().filter(s -> "待复审".equals(s.getStatus())).count();
        stats.setPendingInitialReview(pendingInitial);
        stats.setPendingReReview(pendingRe);
        stats.setPendingReview(pendingInitial + pendingRe);
        stats.setAssignedStudents(studentList.stream().filter(s -> s.getCoachId() != null).count());
        stats.setWaitingCertificate(studentList.stream().filter(s -> "等待发证".equals(s.getStatus())).count());
        stats.setRegistrationsByMonth(registrationsByMonth(studentList));
        stats.setSubjectPassRates(subjectPassRates());
        stats.setCoachWorkloads(coachWorkloads());
        stats.setStatusCounts(studentList.stream().collect(Collectors.groupingBy(Student::getStatus, LinkedHashMap::new, Collectors.counting())));
        return stats;
    }

    private Map<String, Long> registrationsByMonth(List<Student> studentList) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        return studentList.stream()
                .collect(Collectors.groupingBy(s -> s.getCreatedAt().format(formatter), LinkedHashMap::new, Collectors.counting()));
    }

    private Map<String, Double> subjectPassRates() {
        Map<String, Double> result = new LinkedHashMap<>();
        List.of("科目一", "科目二", "科目三", "科目四").forEach(subject -> {
            List<ExamRecord> records = examRecordRepository.findAll().stream()
                    .filter(e -> subject.equals(e.getSubject()))
                    .filter(e -> e.getPassed() != null)
                    .toList();
            double rate = records.isEmpty() ? 0 : records.stream().filter(ExamRecord::getPassed).count() * 100.0 / records.size();
            result.put(subject, Math.round(rate * 10.0) / 10.0);
        });
        return result;
    }

    private List<Map<String, Object>> coachWorkloads() {
        return coachRepository.findAll().stream()
                .sorted(Comparator.comparing(Coach::getWorkload).reversed())
                .map(coach -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", coach.getName());
                    item.put("vehicleType", coach.getVehicleType());
                    item.put("students", coach.getWorkload());
                    item.put("rating", coach.getRating());
                    item.put("freeSlots", coach.getFreeSlots());
                    return item;
                })
                .toList();
    }
}
