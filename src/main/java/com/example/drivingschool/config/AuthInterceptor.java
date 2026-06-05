package com.example.drivingschool.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Map;
//测试
@Component
public class AuthInterceptor implements HandlerInterceptor {
    private static final Map<String, String> PAGE_ROLES = Map.of(
            "/student.html", "STUDENT",
            "/coach.html", "COACH",
            "/admin.html", "ADMIN"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String path = request.getRequestURI();
        if (isPublic(path)) {
            return true;
        }

        Object role = request.getSession().getAttribute("role");
        if (role == null) {
            reject(request, response, "未登录");
            return false;
        }

        String requiredRole = PAGE_ROLES.get(path);
        if (requiredRole != null && !requiredRole.equals(role.toString())) {
            reject(request, response, "当前账号无权访问该页面");
            return false;
        }

        return true;
    }

    private boolean isPublic(String path) {
        return "/".equals(path)
                || "/index.html".equals(path)
                || "/login.html".equals(path)
                || "/register.html".equals(path)
                || "/styles.css".equals(path)
                || "/auth.js".equals(path)
                || "/app.js".equals(path)
                || path.startsWith("/uploads/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/accounts/by-username/")
                || "/api/accounts/register".equals(path);
    }

    private void reject(HttpServletRequest request, HttpServletResponse response, String message) throws IOException {
        if (request.getRequestURI().startsWith("/api/")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"" + message + "\"}");
        } else {
            response.sendRedirect("/login.html");
        }
    }
}
