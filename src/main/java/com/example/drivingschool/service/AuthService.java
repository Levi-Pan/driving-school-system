package com.example.drivingschool.service;

import com.example.drivingschool.dto.LoginRequest;
import com.example.drivingschool.dto.RegisterAccountRequest;
import com.example.drivingschool.model.Account;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.repository.AccountRepository;
import com.example.drivingschool.repository.CoachRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

/**
 * 账号与登录服务：账号注册（手机号唯一校验、密码加密）、登录验证、自注册教练自动建 Coach 实体。
 */
@Service
@Transactional
public class AuthService {
    private final AccountRepository accountRepository;
    private final CoachRepository coachRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(AccountRepository accountRepository, CoachRepository coachRepository) {
        this.accountRepository = accountRepository;
        this.coachRepository = coachRepository;
    }

    public Account registerAccount(RegisterAccountRequest request) {
        if (accountRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("账号已存在");
        }
        String role = normalizeRole(request.getRole());
        String phone = request.getPhone() == null ? "" : request.getPhone().trim();
        // 学员/教练必须填写正确的手机号，且手机号唯一
        if (!"ADMIN".equals(role)) {
            if (!phone.matches("^1\\d{10}$")) {
                throw new IllegalArgumentException("请输入正确的11位手机号");
            }
            if (accountRepository.findByPhone(phone).isPresent()) {
                throw new IllegalArgumentException("该手机号已被注册");
            }
        } else {
            phone = ""; // 管理员不需要手机号
        }
        Account account = new Account(null, request.getUsername(), passwordEncoder.encode(request.getPassword()), request.getName(), role);
        account.setPhone(phone);
        Account savedAccount = accountRepository.save(account);
        // 自注册教练时自动创建 Coach 实体，便于管理员管理和手机号展示
        if ("COACH".equals(role)) {
            Coach coach = new Coach();
            coach.setAccountId(savedAccount.getId());
            coach.setName(savedAccount.getName());
            coach.setPhone(savedAccount.getPhone());
            coach.setVehicleType("C1");
            coach.setMaxStudents(30);
            coachRepository.save(coach);
        }
        return savedAccount;
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

    public Account updateAccountName(Long accountId, String name) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NoSuchElementException("?????"));
        account.setName(name);
        return accountRepository.save(account);
    }

    public void changePassword(Long accountId, String oldPassword, String newPassword) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NoSuchElementException("?????"));
        if (!passwordMatches(oldPassword, account.getPassword())) {
            throw new IllegalArgumentException("??????");
        }
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
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
}
