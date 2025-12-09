package com.cvbuilder.service;

import com.cvbuilder.dto.*;
import com.cvbuilder.entity.*;
import com.cvbuilder.repository.UserProfileRepository;
import com.cvbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional
    public UserProfileResponse saveOrUpdate(Long userId, UserProfileRequest request) {

        log.info("📌 saveOrUpdate called, userId={}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setId(userId);
                    p.setUser(user);
                    return p;
                });

        // === 1. USER bilgilerini güncelle ===
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());
        userRepository.save(user);

        // === 2. PROFİL temel alanlar ===
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setGithubUrl(request.getGithubUrl());
        profile.setWebsiteUrl(request.getWebsiteUrl());

        profile.setTitle(request.getTitle());
        profile.setSummary(request.getSummary());
        profile.setTotalExperienceYear(request.getTotalExperienceYear());

        // 🔥 Eğitim: artık SADECE okul + yıl bilgisi
        profile.setEducationSchool(request.getEducationSchool());
        profile.setEducationStartYear(request.getEducationStartYear());
        profile.setEducationEndYear(request.getEducationEndYear());

        // Eski saçma değerler (4, bm vs) DB'den temizlensin diye:
        //profile.setEducationDegree(null);
       // profile.setEducationDepartment(null);

        // === 3. LİSTELER ===
        updateSkills(profile, request.getSkills());
        updateExperiences(profile, request.getExperiences());
        updateLanguages(profile, request.getLanguages());
        updateCertificates(profile, request.getCertificates());
        updateProjects(profile, request.getProjects());

        UserProfile saved = userProfileRepository.save(profile);
        return mapToResponse(user, saved);
    }

    

    // ---------------------------
    // SKILLS GÜNCELLE
    // ---------------------------
    private void updateSkills(UserProfile profile, List<UserSkillDTO> dtos) {
        if (dtos == null) return;

        profile.getSkills().clear();

        for (UserSkillDTO dto : dtos) {
            if (dto.getSkillName() == null || dto.getSkillName().isBlank()) continue;

            UserSkill entity = new UserSkill();
            entity.setSkillName(dto.getSkillName());
            entity.setLevel(dto.getLevel());
            entity.setYears(dto.getYears());
            entity.setUserProfile(profile);
            profile.getSkills().add(entity);
        }
    }

 // ---------------------------
 // EXPERIENCE GÜNCELLE
 // ---------------------------
 private void updateExperiences(UserProfile profile, List<UserExperienceDTO> dtos) {
     if (dtos == null) return;

     profile.getExperiences().clear();

     for (UserExperienceDTO dto : dtos) {
         // Boş şirket adı gelenleri atla
         if (dto.getCompany() == null || dto.getCompany().isBlank()) continue;

         UserExperience entity = new UserExperience();
         entity.setPosition(dto.getPosition());
         entity.setCompany(dto.getCompany());
         entity.setCity(dto.getCity());              // ✅ city alanı doğru map
         entity.setStartDate(dto.getStartDate());
         entity.setEndDate(dto.getEndDate());
         entity.setDescription(dto.getDescription());
         entity.setUserProfile(profile);

         profile.getExperiences().add(entity);
     }
 }


    // ---------------------------
    // LANGUAGES GÜNCELLE
    // ---------------------------
    private void updateLanguages(UserProfile profile, List<UserLanguageDTO> dtos) {
        if (dtos == null) return;

        profile.getLanguages().clear();

        for (UserLanguageDTO dto : dtos) {
            if (dto.getLanguage() == null || dto.getLanguage().isBlank()) continue;

            UserLanguage entity = new UserLanguage();
            entity.setLanguage(dto.getLanguage());
            entity.setLevel(dto.getLevel());
            entity.setUserProfile(profile);

            profile.getLanguages().add(entity);
        }
    }

    // ---------------------------
    // CERTIFICATES GÜNCELLE
    // ---------------------------
    private void updateCertificates(UserProfile profile, List<UserCertificateDTO> dtos) {
        if (dtos == null) return;

        profile.getCertificates().clear();

        for (UserCertificateDTO dto : dtos) {
            if (dto.getName() == null || dto.getName().isBlank()) continue;

            UserCertificate entity = new UserCertificate();
            entity.setName(dto.getName());
            entity.setIssuer(dto.getIssuer());
            entity.setDate(dto.getDate()); // <-- String
            entity.setUrl(dto.getUrl());
            entity.setUserProfile(profile);

            profile.getCertificates().add(entity);
        }
    }

    // ---------------------------
    // PROJECTS GÜNCELLE → %100 ÇALIŞAN
    // ---------------------------
    private void updateProjects(UserProfile profile, List<UserProjectDTO> dtos) {
        if (dtos == null) return;

        profile.getProjects().clear();

        for (UserProjectDTO dto : dtos) {
            if (dto.getProjectName() == null || dto.getProjectName().isBlank()) continue;

            UserProject entity = new UserProject();
            entity.setProjectName(dto.getProjectName());
            entity.setStartDate(dto.getStartDate()); // <-- String
            entity.setEndDate(Boolean.TRUE.equals(dto.getIsOngoing()) ? null : dto.getEndDate());
            entity.setIsOngoing(Boolean.TRUE.equals(dto.getIsOngoing()));
            entity.setUserProfile(profile);

            profile.getProjects().add(entity);
        }
    }

    // ---------------------------
    // PROFİL GETİR
    // ---------------------------
    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findById(userId).orElse(null);

        return mapToResponse(user, profile);
    }


    // ---------------------------
    // RESPONSE HARİTALAMA
    // ---------------------------
    private UserProfileResponse mapToResponse(User user, UserProfile profile) {

        UserProfileResponse resp = new UserProfileResponse();

        // === USER
        resp.setUserId(user.getId());
        resp.setFullName(user.getFullName());
        resp.setEmail(user.getEmail());
        resp.setPhone(user.getPhone());
        resp.setLocation(user.getLocation());

        if (profile == null) return resp;

        // === PROFİL ALANLARI
        resp.setId(profile.getId());
        resp.setLinkedinUrl(profile.getLinkedinUrl());
        resp.setGithubUrl(profile.getGithubUrl());
        resp.setWebsiteUrl(profile.getWebsiteUrl());
        resp.setTitle(profile.getTitle());
        resp.setSummary(profile.getSummary());
       // resp.setTotalExperienceYear(profile.getTotalExperienceYear());
        resp.setEducationSchool(profile.getEducationSchool());
        // resp.setEducationDegree(profile.getEducationDegree());
        //resp.setEducationSchool(profile.getEducationSchool());
        resp.setEducationStartYear(profile.getEducationStartYear());
        resp.setEducationEndYear(profile.getEducationEndYear());

        // === SKILLS
        resp.setSkills(profile.getSkills().stream()
                .map(s -> UserSkillDTO.builder()
                        .id(s.getId())
                        .skillName(s.getSkillName())
                        .level(s.getLevel())
                        .years(s.getYears())
                        .build())
                .collect(Collectors.toList()));

        // === EXPERIENCES
        resp.setExperiences(profile.getExperiences().stream()
                .map(e -> UserExperienceDTO.builder()
                        .id(e.getId())
                        .position(e.getPosition())
                        .company(e.getCompany())
                       .city(e.getCity())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .description(e.getDescription())
                        .build())
                .collect(Collectors.toList()));

        // === LANGUAGES
        resp.setLanguages(profile.getLanguages().stream()
                .map(l -> UserLanguageDTO.builder()
                        .id(l.getId())
                        .language(l.getLanguage())
                        .level(l.getLevel())
                        .build())
                .collect(Collectors.toList()));

        // === CERTIFICATES
        resp.setCertificates(profile.getCertificates().stream()
                .map(c -> UserCertificateDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .issuer(c.getIssuer())
                        .date(c.getDate())
                        .url(c.getUrl())
                        .build())
                .collect(Collectors.toList()));

        // === PROJECTS
        resp.setProjects(profile.getProjects().stream()
                .map(p -> UserProjectDTO.builder()
                        .id(p.getId())
                        .projectName(p.getProjectName())
                        .startDate(p.getStartDate())
                        .endDate(p.getEndDate())
                        .isOngoing(p.getIsOngoing())
                        .build())
                .collect(Collectors.toList()));

        return resp;
    }
}
