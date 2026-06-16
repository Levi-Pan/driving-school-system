package com.example.drivingschool.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_records")
public class ExamRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long studentId;
    private String subject;
    private LocalDateTime examTime;
    private String status = "待审核";
    private Integer score;
    private Boolean passed;
    private String remark = "";
    private String venue = "";
    private boolean makeup;
    private java.math.BigDecimal makeupFee;
    private boolean ticketGenerated; // 准考证是否已生成（审核通过时设为 true）

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getExamTime() {
        return examTime;
    }

    public void setExamTime(LocalDateTime examTime) {
        this.examTime = examTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public boolean isMakeup() {
        return makeup;
    }

    public void setMakeup(boolean makeup) {
        this.makeup = makeup;
    }

    public java.math.BigDecimal getMakeupFee() {
        return makeupFee;
    }

    public void setMakeupFee(java.math.BigDecimal makeupFee) {
        this.makeupFee = makeupFee;
    }

    public boolean isTicketGenerated() {
        return ticketGenerated;
    }

    public void setTicketGenerated(boolean ticketGenerated) {
        this.ticketGenerated = ticketGenerated;
    }
}
