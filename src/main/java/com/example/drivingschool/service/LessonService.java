package com.example.drivingschool.service;

import com.example.drivingschool.dto.LessonBookingRequest;
import com.example.drivingschool.model.LessonBooking;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.LessonBookingRepository;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.NoSuchElementException;

@Service
@Transactional
public class LessonService {
    private final LessonBookingRepository lessonBookingRepository;
    private final StudentRepository studentRepository;

    public LessonService(LessonBookingRepository lessonBookingRepository, StudentRepository studentRepository) {
        this.lessonBookingRepository = lessonBookingRepository;
        this.studentRepository = studentRepository;
    }

    public LessonBooking bookLesson(LessonBookingRequest request) {
        Student student = requireStudent(request.getStudentId());
        if (student.getCoachId() == null) {
            throw new IllegalArgumentException("学员尚未分配教练，不能约课");
        }
        LessonBooking lesson = new LessonBooking();
        lesson.setStudentId(student.getId());
        lesson.setCoachId(student.getCoachId());
        lesson.setLessonDate(request.getLessonDate());
        lesson.setTimeRange(request.getTimeRange());
        lesson.setNote(StudentService.defaultText(request.getNote(), "学员在线约课"));
        student.getProgressLogs().add("预约练车：" + request.getLessonDate() + " " + request.getTimeRange());
        studentRepository.save(student);
        return lessonBookingRepository.save(lesson);
    }

    public LessonBooking cancelLesson(Long lessonId) {
        LessonBooking lesson = requireLesson(lessonId);
        lesson.setStatus("已取消");
        Student student = requireStudent(lesson.getStudentId());
        student.getProgressLogs().add("取消约课：" + lesson.getLessonDate() + " " + lesson.getTimeRange());
        studentRepository.save(student);
        return lessonBookingRepository.save(lesson);
    }

    @Transactional(readOnly = true)
    public java.util.List<LessonBooking> listLessons() {
        return lessonBookingRepository.findAll().stream()
                .sorted(Comparator.comparing(LessonBooking::getCreatedAt).reversed())
                .toList();
    }

    private Student requireStudent(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("学员不存在：" + id));
    }

    private LessonBooking requireLesson(Long id) {
        return lessonBookingRepository.findById(id).orElseThrow(() -> new NoSuchElementException("约课记录不存在：" + id));
    }
}
