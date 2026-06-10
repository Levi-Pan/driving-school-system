package com.example.drivingschool.service;

import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamRejectRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.ExamRecordRepository;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class ExamService {
    private final ExamRecordRepository examRecordRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;

    public ExamService(ExamRecordRepository examRecordRepository, StudentRepository studentRepository, StudentService studentService) {
        this.examRecordRepository = examRecordRepository;
        this.studentRepository = studentRepository;
        this.studentService = studentService;
    }

    public ExamRecord applyExam(ExamApplyRequest request) {
        Student student = requireStudent(request.getStudentId());
        if (!studentService.canApplyExam(student, request.getSubject())) {
            throw new IllegalArgumentException("当前学时或阶段未达到该科目考试报名要求");
        }
        // 检查该科目是否有过不合格记录 → 标记为补考
        boolean isMakeup = examRecordRepository.findAll().stream()
                .anyMatch(e -> e.getStudentId().equals(student.getId())
                        && e.getSubject().equals(request.getSubject())
                        && e.getPassed() != null && !e.getPassed());
        ExamRecord exam = new ExamRecord();
        exam.setStudentId(student.getId());
        exam.setSubject(request.getSubject());
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
}
