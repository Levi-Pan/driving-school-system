package com.example.drivingschool.dto;

import java.util.List;
import java.util.Map;

/**
 * 首页看板统计响应：学员总数、各审核阶段人数、报名趋势、科目合格率、教练工作量、状态分布。
 */
public class DashboardStats {
    private long totalStudents;
    private long pendingReview;
    private long pendingInitialReview;
    private long pendingReReview;
    private long assignedStudents;
    private long waitingCertificate;
    private Map<String, Long> registrationsByMonth;
    private Map<String, Double> subjectPassRates;
    private List<Map<String, Object>> coachWorkloads;
    private Map<String, Long> statusCounts;

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getPendingReview() {
        return pendingReview;
    }

    public void setPendingReview(long pendingReview) {
        this.pendingReview = pendingReview;
    }

    public long getPendingInitialReview() {
        return pendingInitialReview;
    }

    public void setPendingInitialReview(long pendingInitialReview) {
        this.pendingInitialReview = pendingInitialReview;
    }

    public long getPendingReReview() {
        return pendingReReview;
    }

    public void setPendingReReview(long pendingReReview) {
        this.pendingReReview = pendingReReview;
    }

    public long getAssignedStudents() {
        return assignedStudents;
    }

    public void setAssignedStudents(long assignedStudents) {
        this.assignedStudents = assignedStudents;
    }

    public long getWaitingCertificate() {
        return waitingCertificate;
    }

    public void setWaitingCertificate(long waitingCertificate) {
        this.waitingCertificate = waitingCertificate;
    }

    public Map<String, Long> getRegistrationsByMonth() {
        return registrationsByMonth;
    }

    public void setRegistrationsByMonth(Map<String, Long> registrationsByMonth) {
        this.registrationsByMonth = registrationsByMonth;
    }

    public Map<String, Double> getSubjectPassRates() {
        return subjectPassRates;
    }

    public void setSubjectPassRates(Map<String, Double> subjectPassRates) {
        this.subjectPassRates = subjectPassRates;
    }

    public List<Map<String, Object>> getCoachWorkloads() {
        return coachWorkloads;
    }

    public void setCoachWorkloads(List<Map<String, Object>> coachWorkloads) {
        this.coachWorkloads = coachWorkloads;
    }

    public Map<String, Long> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<String, Long> statusCounts) {
        this.statusCounts = statusCounts;
    }
}
