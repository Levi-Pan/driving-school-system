package com.example.drivingschool.dto;

public class ExamScoreRequest {
    private int score;
    private String remark;

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
