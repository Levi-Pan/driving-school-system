package com.example.drivingschool.dto;

/**
 * 报名审核请求：是否通过、审核意见。
 */
public class ReviewRequest {
    private boolean approved;
    private String opinion;

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public String getOpinion() {
        return opinion;
    }

    public void setOpinion(String opinion) {
        this.opinion = opinion;
    }
}
