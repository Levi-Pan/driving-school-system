package com.example.drivingschool.controller;

import com.example.drivingschool.dto.CoachAvailabilityRequest;
import com.example.drivingschool.dto.CoachCreateRequest;
import com.example.drivingschool.dto.CoachUpdateRequest;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.service.CoachService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CoachController {
    private final CoachService coachService;

    public CoachController(CoachService coachService) {
        this.coachService = coachService;
    }

    @GetMapping("/coaches")
    public List<Coach> listCoaches() {
        return coachService.listCoaches();
    }

    @GetMapping("/coaches/{id}")
    public Coach getCoach(@PathVariable Long id) {
        return coachService.getCoach(id);
    }

    @GetMapping("/coaches/by-account/{accountId}")
    public Coach getCoachByAccount(@PathVariable Long accountId) {
        return coachService.getCoachByAccount(accountId);
    }

    @PostMapping("/coaches")
    public Coach createCoach(@RequestBody CoachCreateRequest request) {
        return coachService.createCoach(request);
    }

    @PutMapping("/coaches/{id}")
    public Coach updateCoach(@PathVariable Long id, @RequestBody CoachUpdateRequest request) {
        return coachService.updateCoach(id, request);
    }

    @DeleteMapping("/coaches/{id}")
    public Map<String, String> deleteCoach(@PathVariable Long id) {
        coachService.deleteCoach(id);
        return Map.of("message", "教练已删除");
    }

    @PutMapping("/coaches/{id}/status")
    public Coach setCoachStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return coachService.setCoachStatus(id, body.get("status"));
    }

    @PostMapping("/coaches/{id}/availability")
    public Coach updateCoachAvailability(@PathVariable Long id, @RequestBody CoachAvailabilityRequest request) {
        return coachService.updateCoachAvailability(id, request);
    }
}
