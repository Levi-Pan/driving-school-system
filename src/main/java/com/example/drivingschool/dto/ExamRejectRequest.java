package com.example.drivingschool.dto;

/**
 * 考试驳回请求：驳回原因。
 */
public class ExamRejectRequest {
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
