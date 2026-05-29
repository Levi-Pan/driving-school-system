package com.example.drivingschool.dto;

public class StudentApplicationRequest {
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
}
