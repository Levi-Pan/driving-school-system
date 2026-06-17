package com.example.drivingschool.repository;

import com.example.drivingschool.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 账号数据访问：按用户名/手机号查询账号、判断用户名是否已存在。
 */
public interface AccountRepository extends JpaRepository<Account, Long> {
    boolean existsByUsername(String username);

    Optional<Account> findByUsername(String username);

    Optional<Account> findByPhone(String phone);
}
