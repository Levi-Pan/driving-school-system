package com.example.drivingschool.dto;

/**
 * 新增教练请求：姓名、手机号、准教车型、最大带教数、性别、教龄、简介、头像。
 */
public class CoachCreateRequest {
    private String name;
    private String phone;
    private String vehicleType;
    private int maxStudents;
    private String gender;
    private int yearsOfExperience;
    private String bio;
    private String avatar;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public int getMaxStudents() { return maxStudents; }
    public void setMaxStudents(int maxStudents) { this.maxStudents = maxStudents; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public int getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(int yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}
