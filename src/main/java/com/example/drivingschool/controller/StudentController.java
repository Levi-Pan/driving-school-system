package com.example.drivingschool.controller;

import com.example.drivingschool.dto.CoachAssignRequest;
import com.example.drivingschool.dto.ProgressRequest;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.dto.CoachRecommendation;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.service.CoachService;
import com.example.drivingschool.service.StudentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 学员控制器：报名申请、学员列表/筛选、初审与复审审核、学时进度录入、教练分配/解绑、发证登记。
 */
@RestController
@RequestMapping("/api")
public class StudentController {
    private final StudentService studentService;
    private final CoachService coachService;

    public StudentController(StudentService studentService, CoachService coachService) {
        this.studentService = studentService;
        this.coachService = coachService;
    }

    @PostMapping("/students/apply")
    public Student submitApplication(@RequestBody StudentApplicationRequest request) {
        return studentService.submitApplication(request);
    }

    @GetMapping("/students")
    public List<Student> listStudents(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return studentService.listStudentsByStatus(status);
        }
        return studentService.listStudents();
    }

    @GetMapping("/students/{id}")
    public Student getStudent(@PathVariable Long id) {
        return studentService.getStudent(id);
    }

    @PostMapping("/students/{id}/review")
    public Student reviewStudent(@PathVariable Long id, @RequestBody ReviewRequest request) {
        return studentService.reviewStudent(id, request);
    }

    @PostMapping("/students/{id}/resubmit")
    public Student resubmitApplication(@PathVariable Long id, @RequestBody StudentApplicationRequest request) {
        return studentService.resubmitApplication(id, request);
    }

    @GetMapping("/students/{id}/coach-recommendations")
    public List<CoachRecommendation> recommendCoaches(@PathVariable Long id) {
        return coachService.recommendCoaches(id);
    }

    @PostMapping("/students/{id}/assign-coach")
    public Student assignCoach(@PathVariable Long id, @RequestBody CoachAssignRequest request) {
        return coachService.assignCoach(id, request.getCoachId());
    }

    @PostMapping("/students/{id}/unbind-coach")
    public Student unbindCoach(@PathVariable Long id) {
        return coachService.unbindCoach(id);
    }

    @PostMapping("/students/{id}/progress")
    public Student updateProgress(@PathVariable Long id, @RequestBody ProgressRequest request) {
        return studentService.updateProgress(id, request);
    }

    @GetMapping("/students/{id}/documents/{type}")
    public Map<String, String> document(@PathVariable Long id, @PathVariable String type) {
        return studentService.document(id, type);
    }
}
