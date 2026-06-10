package com.example.drivingschool.config;

import com.example.drivingschool.dto.ProgressRequest;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.CoachRepository;
import com.example.drivingschool.service.StudentService;
import com.example.drivingschool.service.CoachService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder {
    private final CoachRepository coachRepository;
    private final StudentService studentService;
    private final CoachService coachService;

    public DataSeeder(CoachRepository coachRepository, StudentService studentService, CoachService coachService) {
        this.coachRepository = coachRepository;
        this.studentService = studentService;
        this.coachService = coachService;
    }

    @PostConstruct
    public void seed() {
        if (coachRepository.count() > 0 || studentService.listStudents().size() > 0) {
            return;
        }

        Coach coachA = coachRepository.save(new Coach(null, "王教练", "13800001111", "C1", 4.9, 8, List.of("周一上午", "周三下午", "周六上午")));
        coachRepository.save(new Coach(null, "李教练", "13800002222", "C1", 4.7, 6, List.of("周二上午", "周四下午")));
        coachRepository.save(new Coach(null, "赵教练", "13800003333", "C2", 4.8, 5, List.of("周一下午", "周五上午")));

        StudentApplicationRequest first = new StudentApplicationRequest();
        first.setName("张明");
        first.setIdCard("320101199905081234");
        first.setPhone("13900001234");
        first.setAddress("南京市鼓楼区");
        first.setVehicleType("C1");
        first.setAge(27);
        first.setLicenseEligible(true);
        first.setMedicalStatus("合格");
        first.setIdPhotoName("zhangming-id.jpg");
        first.setMedicalFormName("zhangming-medical.pdf");
        Student student = studentService.submitApplication(first);
        ReviewRequest approved = new ReviewRequest();
        approved.setApproved(true);
        approved.setOpinion("资料完整，准予报名");
        studentService.reviewStudent(student.getId(), approved);
        coachService.assignCoach(student.getId(), coachA.getId());
        ProgressRequest progress = new ProgressRequest();
        progress.setHours(32);
        progress.setSubject("科目二");
        progress.setStage("科目二训练");
        progress.setRecord("完成基础场地训练");
        studentService.updateProgress(student.getId(), progress);

        StudentApplicationRequest second = new StudentApplicationRequest();
        second.setName("刘芳");
        second.setIdCard("320102200108201111");
        second.setPhone("13900005678");
        second.setAddress("南京市建邺区");
        second.setVehicleType("C2");
        second.setAge(25);
        second.setLicenseEligible(true);
        second.setMedicalStatus("待补充");
        second.setIdPhotoName("liufang-id.jpg");
        second.setMedicalFormName("");
        studentService.submitApplication(second);
    }
}
