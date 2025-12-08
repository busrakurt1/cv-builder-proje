package com.cvbuilder.controller;

import com.cvbuilder.dto.UserDTO;
import com.cvbuilder.dto.UserRequest;
import com.cvbuilder.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users") // 🔴 api.js'teki baseURL ile uyumlu: http://localhost:8080/api
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ✅ Tüm kullanıcıları getir (GET /api/users)
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // ✅ Tek kullanıcı profili getir (GET /api/users/{id})
    // Profile.jsx ilk açılışta bunu çağırmalı
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserProfile(id);
        return ResponseEntity.ok(user);
    }

    // ✅ Yeni kullanıcı oluştur (POST /api/users)
    // İstersen register'ı buradan da yapabilirsin
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody UserRequest userRequest) {
        UserDTO created = userService.registerUser(userRequest);
        return ResponseEntity.ok(created);
    }

    // ✅ Kullanıcı profilini güncelle (PUT /api/users/{id})
    // Profile.jsx -> userAPI.updateUser(id, userRequest) buraya vuracak
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UserRequest userRequest
    ) {
        UserDTO updated = userService.updateUserProfile(id, userRequest);
        return ResponseEntity.ok(updated);
    }

    // ✅ Kullanıcı sil (DELETE /api/users/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Email var mı kontrolü (GET /api/users/check-email?email=...)
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    // ✅ Health endpoint (GET /api/users/health)
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("USERS OK");
    }
}
