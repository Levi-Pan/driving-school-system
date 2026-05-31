package com.example.drivingschool.service;

import com.example.drivingschool.dto.CoachRecommendation;
import com.example.drivingschool.dto.CoachAvailabilityRequest;
import com.example.drivingschool.dto.DashboardStats;
import com.example.drivingschool.dto.ExamApplyRequest;
import com.example.drivingschool.dto.ExamScoreRequest;
import com.example.drivingschool.dto.LessonBookingRequest;
import com.example.drivingschool.dto.LoginRequest;
import com.example.drivingschool.dto.ProgressRequest;
import com.example.drivingschool.dto.RegisterAccountRequest;
import com.example.drivingschool.dto.ReviewRequest;
import com.example.drivingschool.dto.StudentApplicationRequest;
import com.example.drivingschool.model.Account;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.model.ExamRecord;
import com.example.drivingschool.model.LessonBooking;
import com.example.drivingschool.model.Student;
import com.example.drivingschool.repository.AccountRepository;
import com.example.drivingschool.repository.CoachRepository;
import com.example.drivingschool.repository.ExamRecordRepository;
import com.example.drivingschool.repository.LessonBookingRepository;
import com.example.drivingschool.repository.StudentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import java.util.stream.Collectors;

@Service
@Transactional
public class DrivingSchoolService {
    private final AccountRepository accountRepository;
    private final StudentRepository studentRepository;
    private final CoachRepository coachRepository;
    private final LessonBookingRepository lessonBookingRepository;
    private final ExamRecordRepository examRecordRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DrivingSchoolService(
            AccountRepository accountRepository,
            StudentRepository studentRepository,
            CoachRepository coachRepository,
            LessonBookingRepository lessonBookingRepository,
            ExamRecordRepository examRecordRepository) {
        this.accountRepository = accountRepository;
        this.studentRepository = studentRepository;
        this.coachRepository = coachRepository;
        this.lessonBookingRepository = lessonBookingRepository;
        this.examRecordRepository = examRecordRepository;
    }

    @PostConstruct
    public void seed() {
        if (coachRepository.count() > 0 || studentRepository.count() > 0) {
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
        Student student = submitApplication(first);
        reviewStudent(student.getId(), approved("资料完整，准予报名"));
        assignCoach(student.getId(), coachA.getId());
        ProgressRequest progress = new ProgressRequest();
        progress.setHours(32);
        progress.setStage("科目二训练");
        progress.setRecord("完成基础场地训练");
        updateProgress(student.getId(), progress);

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
        submitApplication(second);
    }

    public Account registerAccount(RegisterAccountRequest request) {
        if (accountRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("账号已存在");
        }
        Account account = new Account(null, request.getUsername(), passwordEncoder.encode(request.getPassword()), request.getName(), normalizeRole(request.getRole()));
        return accountRepository.save(account);
    }

    public Account login(LoginRequest request) {
        Account account = accountRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("账号或密码错误"));
        if (!passwordMatches(request.getPassword(), account.getPassword())) {
            throw new IllegalArgumentException("账号或密码错误");
        }
        if (!isBcryptHash(account.getPassword())) {
            account.setPassword(passwordEncoder.encode(request.getPassword()));
            accountRepository.save(account);
        }
        return account;
    }

    @Transactional(readOnly = true)
    public Account findAccountByUsername(String username) {
        return accountRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("账号不存在：" + username));
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
        // 初始状态为"待初审"，自动初审后根据结果变更为"待复审"或"初审驳回"
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
        // 状态守卫：只允许审核"待复审"状态的学员
        if (!"待复审".equals(student.getStatus())) {
            throw new IllegalArgumentException("当前学员状态为「" + student.getStatus() + "」，无法进行复审操作");
        }
        if (request.isApproved()) {
            student.setStatus("待分配");
            student.setReviewOpinion(defaultText(request.getOpinion(), "复审通过"));
            generateMaterials(student);
        } else {
            // 驳回时必须填写原因
            String opinion = request.getOpinion();
            if (opinion == null || opinion.isBlank()) {
                throw new IllegalArgumentException("驳回时必须填写驳回原因");
            }
            student.setStatus("审核驳回");
            student.setReviewOpinion(opinion);
        }
        return studentRepository.save(student);
    }

    /**
     * 学员重新提交报名申请（仅限"初审驳回"或"审核驳回"状态的学员）
     */
    public Student resubmitApplication(Long id, StudentApplicationRequest request) {
        Student student = requireStudent(id);
        String currentStatus = student.getStatus();
        if (!"初审驳回".equals(currentStatus) && !"审核驳回".equals(currentStatus)) {
            throw new IllegalArgumentException("当前学员状态为「" + currentStatus + "」，无法重新提交");
        }
        // 更新学员信息
        student.setName(request.getName());
        student.setIdCard(request.getIdCard());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setVehicleType(request.getVehicleType());
        student.setLicenseEligible(request.isLicenseEligible());
        student.setMedicalStatus(request.getMedicalStatus());
        student.setIdPhotoName(request.getIdPhotoName());
        student.setMedicalFormName(request.getMedicalFormName());
        // 重置审核相关字段
        student.setReviewOpinion("");
        student.setStatus("待初审");
        // 重新执行自动初审
        if (autoReview(student)) {
            student.setStatus("待复审");
        } else {
            student.setStatus("初审驳回");
        }
        return studentRepository.save(student);
    }

    @Transactional(readOnly = true)
    public List<CoachRecommendation> recommendCoaches(Long studentId) {
        Student student = requireStudent(studentId);
        return coachRepository.findAll().stream()
                .filter(coach -> coach.getVehicleType().equals(student.getVehicleType()))
                .filter(coach -> coach.getFreeSlots() > 0)
                .map(coach -> {
                    double score = coach.getRating() * 20 + coach.getFreeSlots() * 10 - coach.getWorkload() * 2;
                    String reason = "车型匹配，空闲名额 " + coach.getFreeSlots() + "，评分 " + coach.getRating();
                    return new CoachRecommendation(coach, Math.round(score * 10.0) / 10.0, reason);
                })
                .sorted(Comparator.comparing(CoachRecommendation::getScore).reversed())
                .toList();
    }

    public Student assignCoach(Long studentId, Long coachId) {
        Student student = requireStudent(studentId);
        Coach coach = requireCoach(coachId);
        if (!coach.getVehicleType().equals(student.getVehicleType())) {
            throw new IllegalArgumentException("教练准教车型与学员报考车型不匹配");
        }
        if (coach.getFreeSlots() <= 0) {
            throw new IllegalArgumentException("该教练当前没有空闲名额");
        }
        student.setCoachId(coachId);
        student.setStatus("学习中");
        if (!coach.getStudentIds().contains(studentId)) {
            coach.getStudentIds().add(studentId);
        }
        student.getProgressLogs().add("已分配教练：" + coach.getName());
        coachRepository.save(coach);
        return studentRepository.save(student);
    }

    @Transactional(readOnly = true)
    public List<Coach> listCoaches() {
        return coachRepository.findAll().stream()
                .sorted(Comparator.comparing(Coach::getRating).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public Coach getCoach(Long coachId) {
        return requireCoach(coachId);
    }

    public Coach updateCoachAvailability(Long coachId, CoachAvailabilityRequest request) {
        Coach coach = requireCoach(coachId);
        coach.setFreeTimes(request.getFreeTimes());
        return coachRepository.save(coach);
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
        lesson.setNote(defaultText(request.getNote(), "学员在线约课"));
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
    public List<LessonBooking> listLessons() {
        return lessonBookingRepository.findAll().stream()
                .sorted(Comparator.comparing(LessonBooking::getCreatedAt).reversed())
                .toList();
    }

    public ExamRecord applyExam(ExamApplyRequest request) {
        Student student = requireStudent(request.getStudentId());
        if (!canApplyExam(student, request.getSubject())) {
            throw new IllegalArgumentException("当前学时或阶段未达到该科目考试报名要求");
        }
        ExamRecord exam = new ExamRecord();
        exam.setStudentId(student.getId());
        exam.setSubject(request.getSubject());
        exam.setExamTime(request.getExamTime());
        student.setStatus("考试报名待审");
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public ExamRecord approveExam(Long examId) {
        ExamRecord exam = requireExam(examId);
        exam.setStatus("报名成功");
        Student student = requireStudent(exam.getStudentId());
        student.setStatus("待考试");
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    public ExamRecord recordScore(Long examId, ExamScoreRequest request) {
        ExamRecord exam = requireExam(examId);
        Student student = requireStudent(exam.getStudentId());
        boolean passed = request.getScore() >= passLine(exam.getSubject());
        exam.setScore(request.getScore());
        exam.setPassed(passed);
        exam.setStatus("已出成绩");
        exam.setRemark(defaultText(request.getRemark(), passed ? "成绩合格" : "需要补考"));
        if (passed) {
            student.setStage(nextStage(exam.getSubject()));
            student.setStatus("全部通过".equals(student.getStage()) ? "等待发证" : "学习中");
        } else {
            student.setStatus("补考安排中");
        }
        student.getProgressLogs().add(exam.getSubject() + "成绩：" + request.getScore() + "，" + (passed ? "合格" : "不合格"));
        studentRepository.save(student);
        return examRecordRepository.save(exam);
    }

    @Transactional(readOnly = true)
    public List<ExamRecord> listExams() {
        return examRecordRepository.findAll().stream()
                .sorted(Comparator.comparing(ExamRecord::getId).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardStats dashboardStats() {
        DashboardStats stats = new DashboardStats();
        List<Student> studentList = listStudents();
        stats.setTotalStudents(studentList.size());
        long pendingInitial = studentList.stream().filter(s -> "待初审".equals(s.getStatus())).count();
        long pendingRe = studentList.stream().filter(s -> "待复审".equals(s.getStatus())).count();
        stats.setPendingInitialReview(pendingInitial);
        stats.setPendingReReview(pendingRe);
        stats.setPendingReview(pendingInitial + pendingRe);
        stats.setAssignedStudents(studentList.stream().filter(s -> s.getCoachId() != null).count());
        stats.setWaitingCertificate(studentList.stream().filter(s -> "等待发证".equals(s.getStatus())).count());
        stats.setRegistrationsByMonth(registrationsByMonth(studentList));
        stats.setSubjectPassRates(subjectPassRates());
        stats.setCoachWorkloads(coachWorkloads());
        stats.setStatusCounts(studentList.stream().collect(Collectors.groupingBy(Student::getStatus, LinkedHashMap::new, Collectors.counting())));
        return stats;
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

    private boolean autoReview(Student student) {
        List<String> failures = new ArrayList<>();

        // 身份证号格式校验
        String idCard = student.getIdCard();
        if (idCard == null || !idCard.matches("^\\d{17}[\\dXx]$")) {
            failures.add("身份证号格式不正确");
        } else {
            // 从身份证号自动计算年龄
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

        // 手机号格式校验
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

    private boolean canApplyExam(Student student, String subject) {
        return switch (subject) {
            case "科目一" -> student.getHours() >= 12;
            case "科目二" -> student.getHours() >= 28 && List.of("科目二训练", "科目三训练", "科目四学习", "全部通过").contains(student.getStage());
            case "科目三" -> student.getHours() >= 52 && List.of("科目三训练", "科目四学习", "全部通过").contains(student.getStage());
            case "科目四" -> student.getHours() >= 60 && List.of("科目四学习", "全部通过").contains(student.getStage());
            default -> false;
        };
    }

    private String inferStage(double hours, String currentStage) {
        if (hours >= 60) {
            return "科目四学习";
        }
        if (hours >= 52) {
            return "科目三训练";
        }
        if (hours >= 28) {
            return "科目二训练";
        }
        return defaultText(currentStage, "科目一学习");
    }

    private String nextStage(String subject) {
        return switch (subject) {
            case "科目一" -> "科目二训练";
            case "科目二" -> "科目三训练";
            case "科目三" -> "科目四学习";
            case "科目四" -> "全部通过";
            default -> "学习中";
        };
    }

    private int passLine(String subject) {
        return "科目二".equals(subject) || "科目三".equals(subject) ? 80 : 90;
    }

    private Map<String, Long> registrationsByMonth(List<Student> studentList) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        return studentList.stream()
                .collect(Collectors.groupingBy(s -> s.getCreatedAt().format(formatter), LinkedHashMap::new, Collectors.counting()));
    }

    private Map<String, Double> subjectPassRates() {
        Map<String, Double> result = new LinkedHashMap<>();
        List.of("科目一", "科目二", "科目三", "科目四").forEach(subject -> {
            List<ExamRecord> records = examRecordRepository.findAll().stream()
                    .filter(e -> subject.equals(e.getSubject()))
                    .filter(e -> e.getPassed() != null)
                    .toList();
            double rate = records.isEmpty() ? 0 : records.stream().filter(ExamRecord::getPassed).count() * 100.0 / records.size();
            result.put(subject, Math.round(rate * 10.0) / 10.0);
        });
        return result;
    }

    private List<Map<String, Object>> coachWorkloads() {
        return coachRepository.findAll().stream()
                .sorted(Comparator.comparing(Coach::getWorkload).reversed())
                .map(coach -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", coach.getName());
                    item.put("vehicleType", coach.getVehicleType());
                    item.put("students", coach.getWorkload());
                    item.put("rating", coach.getRating());
                    item.put("freeSlots", coach.getFreeSlots());
                    return item;
                })
                .toList();
    }

    private Student requireStudent(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("学员不存在：" + id));
    }

    private Coach requireCoach(Long id) {
        return coachRepository.findById(id).orElseThrow(() -> new NoSuchElementException("教练不存在：" + id));
    }

    private LessonBooking requireLesson(Long id) {
        return lessonBookingRepository.findById(id).orElseThrow(() -> new NoSuchElementException("约课记录不存在：" + id));
    }

    private ExamRecord requireExam(Long id) {
        return examRecordRepository.findById(id).orElseThrow(() -> new NoSuchElementException("考试记录不存在：" + id));
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        return storedPassword != null && storedPassword.equals(rawPassword);
    }

    private boolean isBcryptHash(String password) {
        return password != null && (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"));
    }

    private String normalizeRole(String role) {
        if ("ADMIN".equalsIgnoreCase(role) || "管理员".equals(role) || "驾校管理员".equals(role)) {
            return "ADMIN";
        }
        if ("COACH".equalsIgnoreCase(role) || "教练".equals(role)) {
            return "COACH";
        }
        return "STUDENT";
    }

    private ReviewRequest approved(String opinion) {
        ReviewRequest request = new ReviewRequest();
        request.setApproved(true);
        request.setOpinion(opinion);
        return request;
    }
}
