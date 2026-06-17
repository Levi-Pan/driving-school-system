package com.example.drivingschool.dto;

import java.time.LocalDateTime;

/**
 * 考试报名请求：学员 ID、报考科目、考试时间、考场。
 */
public class ExamApplyRequest {
    private Long studentId;
    private String subject;
    private java.time.LocalDateTime examTime;
    private String venue;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public java.time.LocalDateTime getExamTime() {
        return examTime;
    }

    public void setExamTime(java.time.LocalDateTime examTime) {
        this.examTime = examTime;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }
}
