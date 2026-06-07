package com.example.drivingschool.controller;

import com.example.drivingschool.dto.DashboardStats;
import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.service.ExamService;
import com.example.drivingschool.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @PostMapping("/exams/{id}/score")
    public ExamRecord recordScore(@PathVariable Long id, @RequestBody ExamScoreRequest request) {
        return examService.recordScore(id, request);
    }

    @GetMapping("/exams")
    public List<ExamRecord> listExams() {
        return examService.listExams();
    }

    @GetMapping("/stats")
    public DashboardStats dashboardStats() {
        return statsService.dashboardStats();
    }
}
