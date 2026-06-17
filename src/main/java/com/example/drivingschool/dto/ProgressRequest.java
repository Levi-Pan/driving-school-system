package com.example.drivingschool.dto;

/**
 * 学时进度录入请求：学时数、科目、训练阶段、记录说明。
 */
public class ProgressRequest {
    private double hours;
    private String subject;
    private String stage;
    private String record;

    public double getHours() {
        return hours;
    }

    public void setHours(double hours) {
        this.hours = hours;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public String getRecord() {
        return record;
    }

    public void setRecord(String record) {
        this.record = record;
    }
}
