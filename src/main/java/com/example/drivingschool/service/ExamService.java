package com.example.drivingschool.service;

import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamRejectRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.ExamVenue;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.ExamRecordRepository;
import com.example.drivingschool.repository.ExamVenueRepository;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@Transactional
public class ExamService {
    private final ExamRecordRepository examRecordRepository;
    private final StudentRepository studentRepository;
    private final ExamVenueRepository examVenueRepository;
    private final StudentService studentService;

    public ExamService(ExamRecordRepository examRecordRepository, StudentRepository studentRepository,
                       ExamVenueRepository examVenueRepository, StudentService studentService) {
        this.examRecordRepository = examRecordRepository;
        this.studentRepository = studentRepository;
        this.examVenueRepository = examVenueRepository;
        this.studentService = studentService;
    }

    public ExamRecord applyExam(ExamApplyRequest request) {
        Student student = requireStudent(request.getStudentId());
        String subject = request.getSubject();

        // 检查是否已通过该科目
        boolean alreadyPassed = examRecordRepository.findAll().stream()
                .anyMatch(e -> e.getStudentId().equals(student.getId())
                        && e.getSubject().equals(subject)
                        && e.getPassed() != null && e.getPassed());
        if (alreadyPassed) {
            throw new IllegalArgumentException("该科目已通过，无需再次报名考试");
        }

        // 检查学时/阶段是否达标
        if (!studentService.canApplyExam(student, subject)) {
            throw new IllegalArgumentException("当前学时或阶段未达到该科目考试报名要求");
        }

        // 检查是否已有待审核的报名（防止重复提交）
        boolean hasPending = examRecordRepository.findAll().stream()
                .anyMatch(e -> e.getStudentId().equals(student.getId())
                        && e.getSubject().equals(subject)
                        && "待审核".equals(e.getStatus()));
        if (hasPending) {
            throw new IllegalArgumentException("该科目已有考试报名待审核，请等待管理员处理");
        }

        // 检查该科目是否有过不合格记录 → 标记为补考
        boolean isMakeup = examRecordRepository.findAll().stream()
                .anyMatch(e -> e.getStudentId().equals(student.getId())
                        && e.getSubject().equals(subject)
                        && e.getPassed() != null && !e.getPassed());
        ExamRecord exam = new ExamRecord();
        exam.setStudentId(student.getId());
        exam.setSubject(subject);
        exam.setExamTime(request.getExamTime());
        exam.setMakeup(isMakeup);
        exam.setVenue(request.getVenue() != null ? request.getVenue() : "");
        student.setStatus("考试报名待审");
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public ExamRecord approveExam(Long examId) {
        ExamRecord exam = requireExam(examId);
        if (!"待审核".equals(exam.getStatus())) {
            throw new IllegalArgumentException("当前考试状态为「" + exam.getStatus() + "」，无法审核");
        }
        exam.setStatus("报名成功");
        exam.setTicketGenerated(true); // 审核通过 → 自动生成准考证
        Student student = requireStudent(exam.getStudentId());
        student.setStatus("待考试");
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public ExamRecord rejectExam(Long examId, ExamRejectRequest request) {
        ExamRecord exam = requireExam(examId);
        if (!"待审核".equals(exam.getStatus())) {
            throw new IllegalArgumentException("当前考试状态为「" + exam.getStatus() + "」，无法驳回");
        }
        String reason = request.getReason();
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("驳回考试报名必须填写原因");
        }
        exam.setStatus("报名驳回");
        exam.setRemark("报名驳回：" + reason);
        Student student = requireStudent(exam.getStudentId());
        student.setStatus("学习中");
        student.getProgressLogs().add(exam.getSubject() + "考试报名被驳回：" + reason);
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public ExamRecord recordScore(Long examId, ExamScoreRequest request) {
        ExamRecord exam = requireExam(examId);
        Student student = requireStudent(exam.getStudentId());
        boolean passed = request.getScore() >= passLine(exam.getSubject());
        exam.setScore(request.getScore());
        exam.setPassed(passed);
        exam.setStatus("已出成绩");
        exam.setRemark(StudentService.defaultText(request.getRemark(), passed ? "成绩合格" : "需要补考"));
        if (passed) {
            student.setStage(nextStage(exam.getSubject()));
            if ("全部通过".equals(student.getStage())) {
                student.setStatus("等待发证");
                student.setCertificateStatus("待发证");
            } else {
                student.setStatus("学习中");
            }
        } else {
            student.setStatus("补考安排中");
        }
        student.getProgressLogs().add(exam.getSubject() + "成绩：" + request.getScore() + "，" + (passed ? "合格" : "不合格"));
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public Student registerCertificate(Long studentId) {
        Student student = requireStudent(studentId);
        if (!"等待发证".equals(student.getStatus()) && !"待发证".equals(student.getCertificateStatus())) {
            throw new IllegalArgumentException("该学员当前状态为「" + student.getStatus() + "」，无法登记发证");
        }
        student.setCertificateStatus("已发证");
        student.setStatus("已发证");
        student.getProgressLogs().add("证件已发放");
        return studentRepository.save(student);
    }

    @Transactional(readOnly = true)
    public List<ExamRecord> listExams() {
        return examRecordRepository.findAll().stream()
                .sorted(Comparator.comparing(ExamRecord::getId).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExamRecord> filterExams(String subject, String status) {
        return examRecordRepository.findAll().stream()
                .filter(e -> subject == null || subject.isBlank() || subject.equals(e.getSubject()))
                .filter(e -> status == null || status.isBlank() || status.equals(e.getStatus()))
                .sorted(Comparator.comparing(ExamRecord::getId).reversed())
                .toList();
    }

    private int passLine(String subject) {
        return "科目二".equals(subject) || "科目三".equals(subject) ? 80 : 90;
    }

    private String nextStage(String subject) {
        return switch (subject) {
            case "科目一" -> "科目二训练";
            case "科目二" -> "科目三训练";
            case "科目三" -> "科目四学习";
            case "科目四" -> "全部通过";
            default -> "学习中";
        };
    }

    private Student requireStudent(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("学员不存在：" + id));
    }

    private ExamRecord requireExam(Long id) {
        return examRecordRepository.findById(id).orElseThrow(() -> new NoSuchElementException("考试记录不存在：" + id));
    }

    // ========== 准考证生成 ==========

    @Transactional(readOnly = true)
    public Map<String, String> examTicket(Long examId) {
        ExamRecord exam = requireExam(examId);
        Student student = studentService.getStudent(exam.getStudentId());
        Map<String, String> ticket = new LinkedHashMap<>();

        // 文档编号
        ticket.put("documentNo", "准考证-" + examId);

        // 学员基本信息
        ticket.put("studentName", student.getName());
        ticket.put("idCard", student.getIdCard());
        ticket.put("gender", student.getGender() != null ? student.getGender() : inferGender(student.getIdCard()));
        ticket.put("photo", student.getIdPhotoName() != null ? student.getIdPhotoName() : "");
        ticket.put("vehicleType", student.getVehicleType());

        // 考试安排信息
        ticket.put("subject", exam.getSubject());
        ticket.put("examTime", exam.getExamTime() != null
                ? exam.getExamTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");
        // 获取考场名称和地址（venue 字段存的是考场名称或 id，需要匹配）
        String originalVenueName = exam.getVenue();
        String finalVenueName = originalVenueName != null ? originalVenueName : "";
        String venueAddress = "";
        if (originalVenueName != null && !originalVenueName.isBlank()) {
            ExamVenue venue = examVenueRepository.findAll().stream()
                    .filter(v -> v.getName().equals(originalVenueName) || v.getId().toString().equals(originalVenueName))
                    .findFirst().orElse(null);
            if (venue != null) {
                finalVenueName = venue.getName();
                venueAddress = venue.getAddress() != null ? venue.getAddress() : "";
            }
        }
        ticket.put("venueName", finalVenueName);
        ticket.put("venueAddress", venueAddress);

        // 培训信息
        ticket.put("schoolName", "交大驾校");
        ticket.put("hoursInfo", buildHoursInfo(student));

        // 生成时间
        ticket.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        return ticket;
    }

    private String inferGender(String idCard) {
        if (idCard == null || !idCard.matches("^\\d{17}[\\dXx]$")) return "";
        int code = Integer.parseInt(idCard.substring(16, 17));
        return code % 2 == 1 ? "男" : "女";
    }

    private String buildHoursInfo(Student student) {
        return String.format("科目一 %d/12 · 科目二 %d/12 · 科目三 %d/34 · 科目四 %d/10",
                (int) student.getSubjectOneHours(),
                (int) student.getSubjectTwoHours(),
                (int) student.getSubjectThreeHours(),
                (int) student.getSubjectFourHours());
    }
}
