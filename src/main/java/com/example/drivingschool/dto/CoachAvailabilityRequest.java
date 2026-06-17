package com.example.drivingschool.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * 教练档期更新请求：教练的可约时间段列表。
 */
public class CoachAvailabilityRequest {
    private List<String> freeTimes = new ArrayList<>();

    public List<String> getFreeTimes() {
        return freeTimes;
    }

    public void setFreeTimes(List<String> freeTimes) {
        this.freeTimes = freeTimes;
    }
}
