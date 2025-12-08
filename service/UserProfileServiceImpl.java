package com.cvbuilder.service;

import com.cvbuilder.dto.UserProfileRequest;
import com.cvbuilder.dto.UserProfileResponse;
import com.cvbuilder.entity.User;
import com.cvbuilder.entity.UserProfile;
import com.cvbuilder.repository.UserRepository;
import com.cvbuilder.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional
    public UserProfileResponse saveOrUpdate(Long userId, UserProfileRequest request) {

        log.info("📌 saveOrUpdate profile, userId={}, data={}", userId, request);

        // 🟢 USER kontrolü
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // 🟢 Profil varsa al, yoksa MapsId ile yeni oluştur
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setUser(user);  // MapsId → ID = userId
                    return p;
                });

        // ---------- PROFİL ALANLARI (User alanı DEĞİL!) ----------
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setGithubUrl(request.getGithubUrl());
        profile.setWebsiteUrl(request.getWebsiteUrl());

        profile.setTitle(request.getTitle());
        profile.setSummary(request.getSummary());
        profile.setTotalExperienceYear(request.getTotalExperienceYear());

        // ❌ profile.setLocation(...) KALDIRILDI 
        // Lokasyon User'da tutuluyor!

        profile.setEducationSchool(request.getEducationSchool());
        profile.setEducationDegree(request.getEducationDegree());
        profile.setEducationDepartment(request.getEducationDepartment());
        profile.setEducationStartYear(request.getEducationStartYear());
        profile.setEducationEndYear(request.getEducationEndYear());

        // Kaydet
        UserProfile saved = userProfileRepository.save(profile);

        return mapToResponse(user, saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {

        log.info("📌 getProfile, userId={}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        UserProfile profile = userProfileRepository.findById(userId).orElse(null);

        return mapToResponse(user, profile);
    }

    private UserProfileResponse mapToResponse(User user, UserProfile profile) {

        UserProfileResponse resp = new UserProfileResponse();

        // ---------- USER TARAFINDAKİ BİLGİLER ----------
        resp.setFullName(user.getFullName());
        resp.setEmail(user.getEmail());
        resp.setPhone(user.getPhone());
        resp.setLocation(user.getLocation());  // Lokasyon User’da!

        // ---------- PROFİLE AİT BİLGİLER ----------
        if (profile != null) {
            resp.setLinkedinUrl(profile.getLinkedinUrl());
            resp.setGithubUrl(profile.getGithubUrl());
            resp.setWebsiteUrl(profile.getWebsiteUrl());

            resp.setTitle(profile.getTitle());
            resp.setSummary(profile.getSummary());
            resp.setTotalExperienceYear(profile.getTotalExperienceYear());

            resp.setEducationSchool(profile.getEducationSchool());
            resp.setEducationDegree(profile.getEducationDegree());
            resp.setEducationDepartment(profile.getEducationDepartment());
            resp.setEducationStartYear(profile.getEducationStartYear());
            resp.setEducationEndYear(profile.getEducationEndYear());
        }

        return resp;
    }
}
