package com.example.drivingschool.dto;

/**
 * 考试成绩录入请求：分数与备注。
 */
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
