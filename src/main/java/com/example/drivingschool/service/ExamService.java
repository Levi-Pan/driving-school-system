package com.example.drivingschool.service;

import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.ExamRecordRepository;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
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
        ExamRecord exam = new ExamRecord();
        exam.setStudentId(student.getId());
        exam.setSubject(request.getSubject());
        exam.setExamTime(request.getExamTime());
        student.setStatus("考试报名待审");
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public ExamRecord approveExam(Long examId) {
        ExamRecord exam = requireExam(examId);
        exam.setStatus("报名成功");
        Student student = requireStudent(exam.getStudentId());
        student.setStatus("待考试");
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
            student.setStatus("全部通过".equals(student.getStage()) ? "等待发证" : "学习中");
        } else {
            student.setStatus("补考安排中");
        }
        student.getProgressLogs().add(exam.getSubject() + "成绩：" + request.getScore() + "，" + (passed ? "合格" : "不合格"));
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    @Transactional(readOnly = true)
    public java.util.List<ExamRecord> listExams() {
        return examRecordRepository.findAll().stream()
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
