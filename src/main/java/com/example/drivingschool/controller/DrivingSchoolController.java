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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class DrivingSchoolController {
    private final DrivingSchoolService service;

    public DrivingSchoolController(DrivingSchoolService service) {
        this.service = service;
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
        if (file.isEmpty()) {
            throw new IllegalArgumentException("请选择要上传的图片");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("只能上传图片文件");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = extensionOf(original, contentType);
        Path dir = Paths.get("uploads", "materials").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String filename = UUID.randomUUID() + extension;
        Path target = dir.resolve(filename).normalize();
        file.transferTo(target);
        return Map.of(
                "fileName", original.isBlank() ? filename : original,
                "url", "/uploads/materials/" + filename
        );
    }

    @PostMapping("/students/apply")
    public Student submitApplication(@RequestBody StudentApplicationRequest request) {
        return service.submitApplication(request);
    }

    private String extensionOf(String filename, String contentType) {
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            String extension = filename.substring(dot).toLowerCase();
            if (Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(extension)) {
                return extension;
            }
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    @GetMapping("/students")
    public List<Student> listStudents(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return service.listStudentsByStatus(status);
        }
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

    @PostMapping("/students/{id}/resubmit")
    public Student resubmitApplication(@PathVariable Long id, @RequestBody StudentApplicationRequest request) {
        return service.resubmitApplication(id, request);
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
