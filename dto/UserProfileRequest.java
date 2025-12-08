package com.cvbuilder.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {

    // ---------- KİŞİSEL BİLGİLER ----------
    private String fullName;
    private String phone;
    private String location;
    private String linkedinUrl;
    private String githubUrl;
    private String websiteUrl;

    // ---------- PROFESYONEL ÖZET ----------
    private String title;
    private Integer totalExperienceYear;
    private String summary;

    // ---------- EĞİTİM ----------
    private String educationSchool;
    private String educationDegree;
    private String educationDepartment;
    private String educationStartYear;
    private String educationEndYear;

    // ---------- LİSTELER ----------
    private List<UserSkillDTO> skills;          // Yetenekler
    private List<UserExperienceDTO> experiences; // İş deneyimleri
}
