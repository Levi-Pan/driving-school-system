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
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "coaches")
public class Coach {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String phone;
    private String vehicleType;
    private double rating;
    private int maxStudents;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "coach_free_times", joinColumns = @JoinColumn(name = "coach_id"))
    @Column(name = "free_time")
    @OrderColumn(name = "sort_order")
    private List<String> freeTimes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "coach_student_ids", joinColumns = @JoinColumn(name = "coach_id"))
    @Column(name = "student_id")
    @OrderColumn(name = "sort_order")
    private List<Long> studentIds = new ArrayList<>();

    public Coach() {
    }

    public Coach(Long id, String name, String phone, String vehicleType, double rating, int maxStudents, List<String> freeTimes) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.vehicleType = vehicleType;
        this.rating = rating;
        this.maxStudents = maxStudents;
        this.freeTimes = freeTimes;
    }

    public int getWorkload() {
        return studentIds.size();
    }

    public int getFreeSlots() {
        return Math.max(0, maxStudents - studentIds.size());
    }

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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public int getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(int maxStudents) {
        this.maxStudents = maxStudents;
    }

    public List<String> getFreeTimes() {
        return freeTimes;
    }

    public void setFreeTimes(List<String> freeTimes) {
        this.freeTimes = freeTimes;
    }

    public List<Long> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<Long> studentIds) {
        this.studentIds = studentIds;
    }
}
