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

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exam_venues")
public class ExamVenue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;        // 考场名称
    private String address;     // 考场地址
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exam_venue_subjects", joinColumns = @JoinColumn(name = "venue_id"))
    @Column(name = "subject")
    private List<String> subjects = new ArrayList<>(); // 可考科目
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exam_venue_time_slots", joinColumns = @JoinColumn(name = "venue_id"))
    @Column(name = "time_slot")
    private List<String> timeSlots = new ArrayList<>(); // 考试时间段
    private boolean enabled = true;

    public ExamVenue() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<String> getSubjects() { return subjects; }
    public void setSubjects(List<String> subjects) { this.subjects = subjects; }

    public List<String> getTimeSlots() { return timeSlots; }
    public void setTimeSlots(List<String> timeSlots) { this.timeSlots = timeSlots; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
