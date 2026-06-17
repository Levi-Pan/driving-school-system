package com.example.drivingschool.dto;

import java.time.LocalDate;

/**
 * 约课请求：学员 ID、上课日期、时间段、备注、科目。
 */
public class LessonBookingRequest {
    private Long studentId;
    private LocalDate lessonDate;
    private String timeRange;
    private String note;
    private String subject;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public LocalDate getLessonDate() {
        return lessonDate;
    }

    public void setLessonDate(LocalDate lessonDate) {
        this.lessonDate = lessonDate;
    }

    public String getTimeRange() {
        return timeRange;
    }

    public void setTimeRange(String timeRange) {
        this.timeRange = timeRange;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
}
