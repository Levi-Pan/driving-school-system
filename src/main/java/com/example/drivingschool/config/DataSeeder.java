package com.example.drivingschool.config;

import com.example.drivingschool.dto.ProgressRequest;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.model.VehicleType;
import com.example.drivingschool.model.ExamVenue;
import com.example.drivingschool.repository.CoachRepository;
import com.example.drivingschool.repository.VehicleTypeRepository;
import com.example.drivingschool.repository.ExamVenueRepository;
import com.example.drivingschool.service.StudentService;
import com.example.drivingschool.service.CoachService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataSeeder {
    private final CoachRepository coachRepository;
    private final StudentService studentService;
    private final CoachService coachService;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ExamVenueRepository examVenueRepository;

    public DataSeeder(CoachRepository coachRepository, StudentService studentService, CoachService coachService,
                      VehicleTypeRepository vehicleTypeRepository, ExamVenueRepository examVenueRepository) {
        this.coachRepository = coachRepository;
        this.studentService = studentService;
        this.coachService = coachService;
        this.vehicleTypeRepository = vehicleTypeRepository;
        this.examVenueRepository = examVenueRepository;
    }

    @PostConstruct
    public void seed() {
        if ((coachRepository.count() > 0 || studentService.listStudents().size() > 0)
                && vehicleTypeRepository.count() > 0 && examVenueRepository.count() > 0) {
            return;
        }

        // 车型默认数据
        if (vehicleTypeRepository.count() == 0) {
            VehicleType c1 = new VehicleType();
            c1.setName("C1"); c1.setDescription("小型汽车（手动挡）");
            c1.setMinAge(18); c1.setMaxAge(70); c1.setRequiredHours(68);
            c1.setRegistrationFee(new BigDecimal("3500")); c1.setExamFee(new BigDecimal("500"));
            vehicleTypeRepository.save(c1);

            VehicleType c2 = new VehicleType();
            c2.setName("C2"); c2.setDescription("小型自动挡汽车");
            c2.setMinAge(18); c2.setMaxAge(70); c2.setRequiredHours(60);
            c2.setRegistrationFee(new BigDecimal("3800")); c2.setExamFee(new BigDecimal("500"));
            vehicleTypeRepository.save(c2);

            VehicleType b2 = new VehicleType();
            b2.setName("B2"); b2.setDescription("大型货车");
            b2.setMinAge(20); b2.setMaxAge(60); b2.setRequiredHours(90);
            b2.setRegistrationFee(new BigDecimal("6000")); b2.setExamFee(new BigDecimal("800"));
            vehicleTypeRepository.save(b2);
        }

        // 考场默认数据
        if (examVenueRepository.count() == 0) {
            ExamVenue v1 = new ExamVenue();
            v1.setName("南京市车管所科目一考场");
            v1.setAddress("南京市玄武区东方城88号");
            v1.setSubjects(List.of("科目一", "科目四"));
            v1.setTimeSlots(List.of("上午 09:00", "下午 14:00"));
            examVenueRepository.save(v1);

            ExamVenue v2 = new ExamVenue();
            v2.setName("南京市科目二场地考场");
            v2.setAddress("南京市江宁区科学园路168号");
            v2.setSubjects(List.of("科目二"));
            v2.setTimeSlots(List.of("上午 08:30", "上午 10:30", "下午 14:30"));
            examVenueRepository.save(v2);

            ExamVenue v3 = new ExamVenue();
            v3.setName("南京市科目三道路考场");
            v3.setAddress("南京市浦口区沿山大道");
            v3.setSubjects(List.of("科目三"));
            v3.setTimeSlots(List.of("上午 09:00", "下午 13:30"));
            examVenueRepository.save(v3);
        }

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
