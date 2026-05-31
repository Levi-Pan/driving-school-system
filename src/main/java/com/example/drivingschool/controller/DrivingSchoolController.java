package com.example.drivingschool.controller;

import com.example.drivingschool.dto.CoachAssignRequest;
import com.example.drivingschool.dto.CoachAvailabilityRequest;
import com.example.drivingschool.dto.CoachRecommendation;
import com.example.drivingschool.dto.DashboardStats;
import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.dto.LessonBookingRequest;
import com.example.drivingschool.dto.LoginRequest;
import com.example.drivingschool.dto.ProgressRequest;
import com.example.drivingschool.dto.RegisterAccountRequest;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Account;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.LessonBooking;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.service.DrivingSchoolService;
import com.example.drivingschool.storage.MaterialResource;
import com.example.drivingschool.storage.MaterialStorageService;
import com.example.drivingschool.storage.StoredMaterial;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
public class DrivingSchoolController {
    private final DrivingSchoolService service;
    private final MaterialStorageService materialStorageService;

    public DrivingSchoolController(DrivingSchoolService service, MaterialStorageService materialStorageService) {
        this.service = service;
        this.materialStorageService = materialStorageService;
    }

    @PostMapping("/accounts/register")
    public Account registerAccount(@RequestBody RegisterAccountRequest request) {
        return service.registerAccount(request);
    }

    @PostMapping("/auth/login")
    public Account login(@RequestBody LoginRequest request, HttpSession session) {
        Account account = service.login(request);
        session.setAttribute("account", account);
        session.setAttribute("role", account.getRole());
        return account;
    }

    @PostMapping("/auth/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        return Map.of("message", "已退出登录");
    }

    @GetMapping("/auth/me")
    public Account me(HttpServletRequest request) {
        Object account = request.getSession().getAttribute("account");
        if (account instanceof Account currentAccount) {
            return currentAccount;
        }
        throw new IllegalArgumentException("未登录");
    }

    @GetMapping("/accounts/by-username/{username}")
    public Account getAccountByUsername(@PathVariable String username) {
        return service.findAccountByUsername(username);
    }

    @PostMapping("/materials/upload")
    public Map<String, String> uploadMaterial(@RequestParam("file") MultipartFile file) throws IOException {
        StoredMaterial material = materialStorageService.save(file);
        return Map.of(
                "fileName", material.fileName(),
                "url", material.url()
        );
    }

    @GetMapping("/materials/file")
    public ResponseEntity<byte[]> materialFile(@RequestParam("key") String key) throws IOException {
        MaterialResource resource = materialStorageService.load(key);
        String contentType = resource.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : resource.contentType();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(resource.content());
    }

    @PostMapping("/students/apply")
    public Student submitApplication(@RequestBody StudentApplicationRequest request) {
        return service.submitApplication(request);
    }

    @GetMapping("/students")
    public List<Student> listStudents() {
        return service.listStudents();
    }

    @GetMapping("/students/{id}")
    public Student getStudent(@PathVariable Long id) {
        return service.getStudent(id);
    }

    @PostMapping("/students/{id}/review")
    public Student reviewStudent(@PathVariable Long id, @RequestBody ReviewRequest request) {
        return service.reviewStudent(id, request);
    }

    @GetMapping("/students/{id}/coach-recommendations")
    public List<CoachRecommendation> recommendCoaches(@PathVariable Long id) {
        return service.recommendCoaches(id);
    }

    @PostMapping("/students/{id}/assign-coach")
    public Student assignCoach(@PathVariable Long id, @RequestBody CoachAssignRequest request) {
        return service.assignCoach(id, request.getCoachId());
    }

    @PostMapping("/students/{id}/progress")
    public Student updateProgress(@PathVariable Long id, @RequestBody ProgressRequest request) {
        return service.updateProgress(id, request);
    }

    @GetMapping("/students/{id}/documents/{type}")
    public Map<String, String> document(@PathVariable Long id, @PathVariable String type) {
        return service.document(id, type);
    }

    @GetMapping("/coaches")
    public List<Coach> listCoaches() {
        return service.listCoaches();
    }

    @GetMapping("/coaches/{id}")
    public Coach getCoach(@PathVariable Long id) {
        return service.getCoach(id);
    }

    @PostMapping("/coaches/{id}/availability")
    public Coach updateCoachAvailability(@PathVariable Long id, @RequestBody CoachAvailabilityRequest request) {
        return service.updateCoachAvailability(id, request);
    }

    @PostMapping("/lessons")
    public LessonBooking bookLesson(@RequestBody LessonBookingRequest request) {
        return service.bookLesson(request);
    }

    @PostMapping("/lessons/{id}/cancel")
    public LessonBooking cancelLesson(@PathVariable Long id) {
        return service.cancelLesson(id);
    }

    @GetMapping("/lessons")
    public List<LessonBooking> listLessons() {
        return service.listLessons();
    }

    @PostMapping("/exams/apply")
    public ExamRecord applyExam(@RequestBody ExamApplyRequest request) {
        return service.applyExam(request);
    }

    @PostMapping("/exams/{id}/approve")
    public ExamRecord approveExam(@PathVariable Long id) {
        return service.approveExam(id);
    }

    @PostMapping("/exams/{id}/score")
    public ExamRecord recordScore(@PathVariable Long id, @RequestBody ExamScoreRequest request) {
        return service.recordScore(id, request);
    }

    @GetMapping("/exams")
    public List<ExamRecord> listExams() {
        return service.listExams();
    }

    @GetMapping("/stats")
    public DashboardStats dashboardStats() {
        return service.dashboardStats();
    }
}
