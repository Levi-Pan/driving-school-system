package com.example.drivingschool.controller;

import com.example.drivingschool.dto.LessonBookingRequest;
import com.example.drivingschool.model.LessonBooking;
import com.example.drivingschool.service.LessonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 约课控制器：学员预约练车、完成、取消、约课记录查询。
 */
@RestController
@RequestMapping("/api")
public class LessonController {
    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping("/lessons")
    public LessonBooking bookLesson(@RequestBody LessonBookingRequest request) {
        return lessonService.bookLesson(request);
    }

    @PostMapping("/lessons/{id}/complete")
    public LessonBooking completeLesson(@PathVariable Long id) {
        return lessonService.completeLesson(id);
    }

    @PostMapping("/lessons/{id}/cancel")
    public LessonBooking cancelLesson(@PathVariable Long id) {
        return lessonService.cancelLesson(id);
    }

    @GetMapping("/lessons")
    public List<LessonBooking> listLessons() {
        return lessonService.listLessons();
    }
}