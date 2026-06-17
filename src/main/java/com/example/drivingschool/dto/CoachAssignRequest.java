package com.example.drivingschool.dto;

/**
 * 分配教练请求：指定要分配给学员的教练 ID。
 */
public class CoachAssignRequest {
    private Long coachId;

    public Long getCoachId() {
        return coachId;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }
}
