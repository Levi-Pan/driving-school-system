package com.example.drivingschool.service;

import com.example.drivingschool.dto.LoginRequest;
import com.example.drivingschool.dto.RegisterAccountRequest;
import com.example.drivingschool.model.Account;
import com.example.drivingschool.repository.AccountRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@Transactional
public class AuthService {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
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
