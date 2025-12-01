package com.cvbuilder.service;

import com.cvbuilder.dto.UserDTO;
import com.cvbuilder.dto.UserRequest;
import com.cvbuilder.dto.UserSkillDTO;
import com.cvbuilder.entity.User;
import com.cvbuilder.entity.UserSkill;
import com.cvbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public UserDTO registerUser(UserRequest userRequest) {
        log.info("📍 Yeni kullanıcı kaydı: {}", userRequest.getEmail());
        
        try {
            User user = new User();
            user.setEmail(userRequest.getEmail());
            user.setPassword(userRequest.getPassword()); // ❌ Şimdilik hash yok
            user.setFullName(userRequest.getFullName());
            user.setTitle(userRequest.getTitle());
            user.setExperienceYears(userRequest.getExperienceYears());
            user.setSummary(userRequest.getSummary());
            user.setLocation(userRequest.getLocation());
            user.setPhone(userRequest.getPhone());
            
            User savedUser = userRepository.save(user);
            log.info("✅ Kullanıcı başarıyla kaydedildi: {}", savedUser.getEmail());
            
            return convertToDTO(savedUser);
        } catch (Exception e) {
            log.error("❌ Kullanıcı kayıt hatası: {}", e.getMessage(), e);
            throw new RuntimeException("Kullanıcı kaydı başarısız: " + e.getMessage());
        }
    }
    
    @Override
    public UserDTO loginUser(String email, String password) {
        log.info("📍 Giriş denemesi: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + email));
        
        // ❌ Basit şifre kontrolü - hash yok
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Şifre hatalı");
        }
        
        log.info("✅ Giriş başarılı: {}", email);
        return convertToDTO(user);
    }
    
    // Diğer metodlar aynı kalacak...
    @Override
    public List<UserDTO> getAllUsers() {
        try {
            return userRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("❌ Kullanıcıları getirme hatası: {}", e.getMessage());
            throw new RuntimeException("Kullanıcılar getirilemedi: " + e.getMessage());
        }
    }
    
    @Override
    public UserDTO getUserProfile(Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + id));
            return convertToDTO(user);
        } catch (Exception e) {
            log.error("❌ Kullanıcı getirme hatası: {}", e.getMessage());
            throw new RuntimeException("Kullanıcı getirilemedi: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public UserDTO updateUserProfile(Long id, UserRequest userRequest) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + id));
            
            user.setFullName(userRequest.getFullName());
            user.setTitle(userRequest.getTitle());
            user.setExperienceYears(userRequest.getExperienceYears());
            user.setSummary(userRequest.getSummary());
            user.setLocation(userRequest.getLocation());
            user.setPhone(userRequest.getPhone());
            
            User updatedUser = userRepository.save(user);
            log.info("✅ Kullanıcı güncellendi: {}", updatedUser.getEmail());
            
            return convertToDTO(updatedUser);
        } catch (Exception e) {
            log.error("❌ Kullanıcı güncelleme hatası: {}", e.getMessage());
            throw new RuntimeException("Kullanıcı güncellenemedi: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        try {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id);
                log.info("✅ Kullanıcı silindi: {}", id);
            } else {
                throw new RuntimeException("Kullanıcı bulunamadı: " + id);
            }
        } catch (Exception e) {
            log.error("❌ Kullanıcı silme hatası: {}", e.getMessage());
            throw new RuntimeException("Kullanıcı silinemedi: " + e.getMessage());
        }
    }
    
    @Override
    public boolean existsByEmail(String email) {
        try {
            return userRepository.existsByEmail(email);
        } catch (Exception e) {
            log.error("❌ Email kontrol hatası: {}", e.getMessage());
            return false;
        }
    }
    
    private UserDTO convertToDTO(User user) {
        try {
            UserDTO dto = new UserDTO();
            dto.setId(user.getId());
            dto.setEmail(user.getEmail());
            dto.setFullName(user.getFullName());
            dto.setTitle(user.getTitle());
            dto.setExperienceYears(user.getExperienceYears());
            dto.setSummary(user.getSummary());
            dto.setLocation(user.getLocation());
            dto.setPhone(user.getPhone());
            
            return dto;
        } catch (Exception e) {
            log.error("❌ DTO convert hatası: {}", e.getMessage());
            throw new RuntimeException("DTO convert hatası: " + e.getMessage());
        }
    }
}