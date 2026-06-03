package com.example.drivingschool.controller;

import com.example.drivingschool.dto.LoginRequest;
import com.example.drivingschool.dto.RegisterAccountRequest;
import com.example.drivingschool.model.Account;
import com.example.drivingschool.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/accounts/register")
    public Account registerAccount(@RequestBody RegisterAccountRequest request) {
        return authService.registerAccount(request);
    }

    @PostMapping("/auth/login")
    public Account login(@RequestBody LoginRequest request, HttpSession session) {
        Account account = authService.login(request);
        session.setAttribute("account", account);
        session.setAttribute("role", account.getRole());
        return account;
    }

    @PostMapping("/auth/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        return Map.of("message", "已退出登录");
    }

    @GetMapping("/auth/me")
    public Account me(HttpServletRequest request) {
        Object account = request.getSession().getAttribute("account");
        if (account instanceof Account currentAccount) {
            return currentAccount;
        }
        throw new IllegalArgumentException("未登录");
    }

    @GetMapping("/accounts/by-username/{username}")
    public Account getAccountByUsername(@PathVariable String username) {
        return authService.findAccountByUsername(username);
    }
}
