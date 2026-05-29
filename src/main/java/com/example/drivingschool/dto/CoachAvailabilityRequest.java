package com.example.drivingschool.dto;

import java.util.ArrayList;
import java.util.List;

public class CoachAvailabilityRequest {
    private List<String> freeTimes = new ArrayList<>();

    public List<String> getFreeTimes() {
        return freeTimes;
    }

    public void setFreeTimes(List<String> freeTimes) {
        this.freeTimes = freeTimes;
    }
}
