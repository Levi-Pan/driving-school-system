package com.example.drivingschool.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String idCard;
    private String phone;
    private String address;
    private String vehicleType;
    private int age;
    private boolean licenseEligible;
    private String medicalStatus;
    private String idPhotoName;
    private String medicalFormName;
    private String status = "待审核";
    private String autoReviewResult = "待初审";
    private String reviewOpinion = "";
    private Long coachId;
    private String stage = "科目一学习";
    private Double subjectOneHours;
    private Double subjectTwoHours;
    private Double subjectThreeHours;
    private Double subjectFourHours;
    private boolean registrationFormGenerated;
    private boolean medicalFormGenerated;
    private boolean admissionTicketGenerated;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "student_progress_logs", joinColumns = @JoinColumn(name = "student_id"))
    @Column(name = "progress_log", length = 500)
    private List<String> progressLogs = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "coach_change_logs", joinColumns = @JoinColumn(name = "student_id"))
    @Column(name = "change_log", length = 500)
    private List<String> coachChangeLogs = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private String certificateStatus = "未发证";

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIdCard() {
        return idCard;
    }

    public void setIdCard(String idCard) {
        this.idCard = idCard;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public boolean isLicenseEligible() {
        return licenseEligible;
    }

    public void setLicenseEligible(boolean licenseEligible) {
        this.licenseEligible = licenseEligible;
    }

    public String getMedicalStatus() {
        return medicalStatus;
    }

    public void setMedicalStatus(String medicalStatus) {
        this.medicalStatus = medicalStatus;
    }

    public String getIdPhotoName() {
        return idPhotoName;
    }

    public void setIdPhotoName(String idPhotoName) {
        this.idPhotoName = idPhotoName;
    }

    public String getMedicalFormName() {
        return medicalFormName;
    }

    public void setMedicalFormName(String medicalFormName) {
        this.medicalFormName = medicalFormName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAutoReviewResult() {
        return autoReviewResult;
    }

    public void setAutoReviewResult(String autoReviewResult) {
        this.autoReviewResult = autoReviewResult;
    }

    public String getReviewOpinion() {
        return reviewOpinion;
    }

    public void setReviewOpinion(String reviewOpinion) {
        this.reviewOpinion = reviewOpinion;
    }

    public Long getCoachId() {
        return coachId;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public double getSubjectOneHours() {
        return subjectOneHours != null ? subjectOneHours : 0;
    }

    public void setSubjectOneHours(double subjectOneHours) {
        this.subjectOneHours = subjectOneHours;
    }

    public double getSubjectTwoHours() {
        return subjectTwoHours != null ? subjectTwoHours : 0;
    }

    public void setSubjectTwoHours(double subjectTwoHours) {
        this.subjectTwoHours = subjectTwoHours;
    }

    public double getSubjectThreeHours() {
        return subjectThreeHours != null ? subjectThreeHours : 0;
    }

    public void setSubjectThreeHours(double subjectThreeHours) {
        this.subjectThreeHours = subjectThreeHours;
    }

    public double getSubjectFourHours() {
        return subjectFourHours != null ? subjectFourHours : 0;
    }

    public void setSubjectFourHours(double subjectFourHours) {
        this.subjectFourHours = subjectFourHours;
    }

    /** 总学时（向后兼容，用于统计展示） */
    public double getHours() {
        return subjectOneHours + subjectTwoHours + subjectThreeHours + subjectFourHours;
    }

    public boolean isRegistrationFormGenerated() {
        return registrationFormGenerated;
    }

    public void setRegistrationFormGenerated(boolean registrationFormGenerated) {
        this.registrationFormGenerated = registrationFormGenerated;
    }

    public boolean isMedicalFormGenerated() {
        return medicalFormGenerated;
    }

    public void setMedicalFormGenerated(boolean medicalFormGenerated) {
        this.medicalFormGenerated = medicalFormGenerated;
    }

    public boolean isAdmissionTicketGenerated() {
        return admissionTicketGenerated;
    }

    public void setAdmissionTicketGenerated(boolean admissionTicketGenerated) {
        this.admissionTicketGenerated = admissionTicketGenerated;
    }

    public List<String> getProgressLogs() {
        return progressLogs;
    }

    public void setProgressLogs(List<String> progressLogs) {
        this.progressLogs = progressLogs;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getCoachChangeLogs() {
        return coachChangeLogs;
    }

    public void setCoachChangeLogs(List<String> coachChangeLogs) {
        this.coachChangeLogs = coachChangeLogs;
    }

    public String getCertificateStatus() {
        return certificateStatus;
    }

    public void setCertificateStatus(String certificateStatus) {
        this.certificateStatus = certificateStatus;
    }
}
