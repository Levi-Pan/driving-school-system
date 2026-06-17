package com.example.drivingschool.controller;

import com.example.drivingschool.dto.LoginRequest;
import com.example.drivingschool.dto.RegisterAccountRequest;
import com.example.drivingschool.model.Account;
import com.example.drivingschool.model.Coach;
import com.example.drivingschool.service.AuthService;
import com.example.drivingschool.service.CoachService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 账号与登录控制器：账号注册、登录/登出、会话管理，含手机号唯一校验与密码加密。
 */
@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService authService;
    private final CoachService coachService;

    public AuthController(AuthService authService, CoachService coachService) {
        this.authService = authService;
        this.coachService = coachService;
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

    @PutMapping("/auth/profile")//更新教练端个人信息
    public Account updateProfile(HttpServletRequest request, @RequestBody Map<String, String> body) {
        Account account = (Account) request.getSession().getAttribute("account");
        if (account == null) throw new IllegalArgumentException("???");
        String name = body.get("name");
        if (name != null && !name.isBlank()) {
            account.setName(name);
            account = authService.updateAccountName(account.getId(), name);
            try {
                Coach coach = coachService.getCoachByAccount(account.getId());
                coach.setName(name);
                String bio = body.get("bio");
                if (bio != null) coach.setBio(bio);
                String phone = body.get("phone");
                if (phone != null) coach.setPhone(phone);
                String vehicleType = body.get("vehicleType");
                if (vehicleType != null && !vehicleType.isBlank()) coach.setVehicleType(vehicleType);
                String gender = body.get("gender");
                if (gender != null) coach.setGender(gender);
                String yearsStr = body.get("yearsOfExperience");
                if (yearsStr != null && !yearsStr.isBlank()) {
                    try { coach.setYearsOfExperience(Integer.parseInt(yearsStr)); } catch (NumberFormatException ignored) { }
                }
                String avatar = body.get("avatar");
                if (avatar != null) coach.setAvatar(avatar);
                coachService.updateCoachProfile(coach);
            } catch (Exception ignored) { }
        }
        request.getSession().setAttribute("account", account);
        return account;
    }

    @PostMapping("/auth/change-password")
    public Map<String, String> changePassword(HttpServletRequest request, @RequestBody Map<String, String> body) {
        Account account = (Account) request.getSession().getAttribute("account");
        if (account == null) throw new IllegalArgumentException("???");
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || oldPassword.isBlank()) throw new IllegalArgumentException("???????");
        if (newPassword == null || newPassword.isBlank()) throw new IllegalArgumentException("??????");
        if (newPassword.length() < 6) throw new IllegalArgumentException("?????????6?");
        authService.changePassword(account.getId(), oldPassword, newPassword);
        return Map.of("message", "??????");
    }
}
