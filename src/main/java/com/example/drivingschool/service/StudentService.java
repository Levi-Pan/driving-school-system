package com.example.drivingschool.service;

import com.example.drivingschool.dto.ProgressRequest;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@Transactional
public class StudentService {
    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public Student submitApplication(StudentApplicationRequest request) {
        Student student = new Student();
        student.setName(request.getName());
        student.setIdCard(request.getIdCard());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setVehicleType(request.getVehicleType());
        student.setAge(request.getAge());
        student.setLicenseEligible(request.isLicenseEligible());
        student.setMedicalStatus(request.getMedicalStatus());
        student.setIdPhotoName(request.getIdPhotoName());
        student.setMedicalFormName(request.getMedicalFormName());
        student.setStatus("待初审");
        if (autoReview(student)) {
            student.setStatus("待复审");
        } else {
            student.setStatus("初审驳回");
        }
        return studentRepository.save(student);
    }

    @Transactional(readOnly = true)
    public List<Student> listStudents() {
        return studentRepository.findAll().stream()
                .sorted(Comparator.comparing(Student::getId).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Student> listStudentsByStatus(String status) {
        return studentRepository.findByStatus(status).stream()
                .sorted(Comparator.comparing(Student::getId).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public Student getStudent(Long id) {
        return requireStudent(id);
    }

    public Student reviewStudent(Long id, ReviewRequest request) {
        Student student = requireStudent(id);
        if (!"待复审".equals(student.getStatus())) {
            throw new IllegalArgumentException("当前学员状态为「" + student.getStatus() + "」，无法进行复审操作");
        }
        if (request.isApproved()) {
            student.setStatus("待分配");
            student.setReviewOpinion(defaultText(request.getOpinion(), "复审通过"));
            generateMaterials(student);
        } else {
            String opinion = request.getOpinion();
            if (opinion == null || opinion.isBlank()) {
                throw new IllegalArgumentException("驳回时必须填写驳回原因");
            }
            student.setStatus("审核驳回");
            student.setReviewOpinion(opinion);
        }
        return studentRepository.save(student);
    }

    public Student resubmitApplication(Long id, StudentApplicationRequest request) {
        Student student = requireStudent(id);
        String currentStatus = student.getStatus();
        if (!"初审驳回".equals(currentStatus) && !"审核驳回".equals(currentStatus)) {
            throw new IllegalArgumentException("当前学员状态为「" + currentStatus + "」，无法重新提交");
        }
        student.setName(request.getName());
        student.setIdCard(request.getIdCard());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setVehicleType(request.getVehicleType());
        student.setLicenseEligible(request.isLicenseEligible());
        student.setMedicalStatus(request.getMedicalStatus());
        student.setIdPhotoName(request.getIdPhotoName());
        student.setMedicalFormName(request.getMedicalFormName());
        student.setReviewOpinion("");
        student.setStatus("待初审");
        if (autoReview(student)) {
            student.setStatus("待复审");
        } else {
            student.setStatus("初审驳回");
        }
        return studentRepository.save(student);
    }

    public Student updateProgress(Long studentId, ProgressRequest request) {
        Student student = requireStudent(studentId);
        student.setHours(student.getHours() + request.getHours());
        if (request.getStage() != null && !request.getStage().isBlank()) {
            student.setStage(request.getStage());
        } else {
            student.setStage(inferStage(student.getHours(), student.getStage()));
        }
        student.getProgressLogs().add(LocalDate.now() + " 学时+" + request.getHours() + "：" + defaultText(request.getRecord(), "教练录入练车记录"));
        if (isStageComplete(student)) {
            student.setStatus("可报名考试");
        }
        return studentRepository.save(student);
    }

    @Transactional(readOnly = true)
    public Map<String, String> document(Long studentId, String type) {
        Student student = requireStudent(studentId);
        Map<String, String> doc = new LinkedHashMap<>();
        doc.put("documentNo", "DOC-" + type.toUpperCase() + "-" + student.getId());
        doc.put("studentName", student.getName());
        doc.put("idCard", student.getIdCard());
        doc.put("vehicleType", student.getVehicleType());
        doc.put("status", student.getStatus());
        doc.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        switch (type) {
            case "registration" -> doc.put("title", "机动车驾驶培训报名表");
            case "medical" -> doc.put("title", "驾驶人体检表");
            case "ticket" -> doc.put("title", "考试准考证");
            default -> doc.put("title", "学员材料");
        }
        return doc;
    }

    // ========== 自动初审逻辑 ==========

    private boolean autoReview(Student student) {
        List<String> failures = new ArrayList<>();

        String idCard = student.getIdCard();
        if (idCard == null || !idCard.matches("^\\d{17}[\\dXx]$")) {
            failures.add("身份证号格式不正确");
        } else {
            try {
                String birthStr = idCard.substring(6, 14);
                int birthYear = Integer.parseInt(birthStr.substring(0, 4));
                int birthMonth = Integer.parseInt(birthStr.substring(4, 6));
                int birthDay = Integer.parseInt(birthStr.substring(6, 8));
                LocalDate birthDate = LocalDate.of(birthYear, birthMonth, birthDay);
                int age = LocalDate.now().getYear() - birthDate.getYear();
                if (LocalDate.now().isBefore(birthDate.plusYears(age))) {
                    age--;
                }
                student.setAge(age);
                if (age < 18 || age > 70) {
                    failures.add("年龄不符合要求（当前" + age + "岁，需18-70周岁）");
                }
            } catch (Exception e) {
                failures.add("身份证号中的出生日期无法解析");
            }
        }

        String phone = student.getPhone();
        if (phone == null || !phone.matches("^1\\d{10}$")) {
            failures.add("手机号格式不正确");
        }

        if (!student.isLicenseEligible()) {
            failures.add("准驾资格不符合要求");
        }
        if (!"合格".equals(student.getMedicalStatus())) {
            failures.add("体检状态未合格");
        }
        if (student.getIdPhotoName() == null || student.getIdPhotoName().isBlank()) {
            failures.add("身份证照片未上传");
        }
        if (student.getMedicalFormName() == null || student.getMedicalFormName().isBlank()) {
            failures.add("体检表未上传");
        }

        boolean passed = failures.isEmpty();
        student.setAutoReviewResult(passed ? "自动初审通过" : String.join("；", failures));
        return passed;
    }

    private void generateMaterials(Student student) {
        student.setRegistrationFormGenerated(true);
        student.setMedicalFormGenerated(true);
        student.setAdmissionTicketGenerated(true);
    }

    private boolean isStageComplete(Student student) {
        return switch (student.getStage()) {
            case "科目一学习" -> student.getHours() >= 12;
            case "科目二训练" -> student.getHours() >= 28;
            case "科目三训练" -> student.getHours() >= 52;
            case "科目四学习" -> student.getHours() >= 60;
            default -> false;
        };
    }

    boolean canApplyExam(Student student, String subject) {
        return switch (subject) {
            case "科目一" -> student.getHours() >= 12;
            case "科目二" -> student.getHours() >= 28 && List.of("科目二训练", "科目三训练", "科目四学习", "全部通过").contains(student.getStage());
            case "科目三" -> student.getHours() >= 52 && List.of("科目三训练", "科目四学习", "全部通过").contains(student.getStage());
            case "科目四" -> student.getHours() >= 60 && List.of("科目四学习", "全部通过").contains(student.getStage());
            default -> false;
        };
    }

    private String inferStage(double hours, String currentStage) {
        if (hours >= 60) return "科目四学习";
        if (hours >= 52) return "科目三训练";
        if (hours >= 28) return "科目二训练";
        return defaultText(currentStage, "科目一学习");
    }

    Student requireStudent(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("学员不存在：" + id));
    }

    static String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
