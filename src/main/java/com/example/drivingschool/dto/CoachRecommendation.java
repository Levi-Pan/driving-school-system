package com.example.drivingschool.dto;

import com.example.drivingschool.model.Coach;

public class CoachRecommendation {
    private Coach coach;
    private double score;
    private String reason;

    public CoachRecommendation(Coach coach, double score, String reason) {
        this.coach = coach;
        this.score = score;
        this.reason = reason;
    }

    public Coach getCoach() {
        return coach;
    }

    public void setCoach(Coach coach) {
        this.coach = coach;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
