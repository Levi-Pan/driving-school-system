package com.example.drivingschool.controller;

import com.example.drivingschool.dto.DashboardStats;
import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamRejectRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.service.ExamService;
import com.example.drivingschool.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ExamController {
    private final ExamService examService;
    private final StatsService statsService;

    public ExamController(ExamService examService, StatsService statsService) {
        this.examService = examService;
        this.statsService = statsService;
    }

    @PostMapping("/exams/apply")
    public ExamRecord applyExam(@RequestBody ExamApplyRequest request) {
        return examService.applyExam(request);
    }

    @PostMapping("/exams/{id}/approve")
    public ExamRecord approveExam(@PathVariable Long id) {
        return examService.approveExam(id);
    }

    @PostMapping("/exams/{id}/reject")
    public ExamRecord rejectExam(@PathVariable Long id, @RequestBody ExamRejectRequest request) {
        return examService.rejectExam(id, request);
    }

    @PostMapping("/exams/{id}/score")
    public ExamRecord recordScore(@PathVariable Long id, @RequestBody ExamScoreRequest request) {
        return examService.recordScore(id, request);
    }

    @GetMapping("/exams")
    public List<ExamRecord> listExams(@RequestParam(required = false) String subject,
                                       @RequestParam(required = false) String status) {
        if ((subject != null && !subject.isBlank()) || (status != null && !status.isBlank())) {
            return examService.filterExams(subject, status);
        }
        return examService.listExams();
    }

    @GetMapping("/exams/{id}/ticket")
    public Map<String, String> examTicket(@PathVariable Long id) {
        return examService.examTicket(id);
    }

    @GetMapping("/students/{studentId}/ticket")
    public Map<String, String> studentTicket(@PathVariable Long studentId, @RequestParam String subject) {
        return examService.studentTicketBySubject(studentId, subject);
    }

    @GetMapping("/students/{studentId}/license")
    public Map<String, String> driverLicense(@PathVariable Long studentId) {
        return examService.driverLicense(studentId);
    }

    @PostMapping("/students/{id}/certificate")
    public Student registerCertificate(@PathVariable Long id) {
        return examService.registerCertificate(id);
    }

    @GetMapping("/stats")
    public DashboardStats dashboardStats() {
        return statsService.dashboardStats();
    }
}
