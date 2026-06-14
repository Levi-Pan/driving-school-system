package com.example.drivingschool.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "vehicle_types")
public class VehicleType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;        // 车型代码：C1, C2, B2
    private String description; // 车型说明：小型汽车、小型自动挡等
    private int minAge;         // 最小报考年龄
    private int maxAge;         // 最大报考年龄
    private double requiredHours; // 总学时要求
    private BigDecimal registrationFee; // 报名费
    private BigDecimal examFee;         // 考试费
    private boolean enabled = true;     // 启用/禁用

    public VehicleType() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getMinAge() { return minAge; }
    public void setMinAge(int minAge) { this.minAge = minAge; }

    public int getMaxAge() { return maxAge; }
    public void setMaxAge(int maxAge) { this.maxAge = maxAge; }

    public double getRequiredHours() { return requiredHours; }
    public void setRequiredHours(double requiredHours) { this.requiredHours = requiredHours; }

    public BigDecimal getRegistrationFee() { return registrationFee; }
    public void setRegistrationFee(BigDecimal registrationFee) { this.registrationFee = registrationFee; }

    public BigDecimal getExamFee() { return examFee; }
    public void setExamFee(BigDecimal examFee) { this.examFee = examFee; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
