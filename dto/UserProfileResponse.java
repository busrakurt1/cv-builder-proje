package com.cvbuilder.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private Long userId;

    // Kişisel bilgiler
    private String fullName;
    private String email;   // User'dan gelecek
    private String phone;
    private String location;
    private String linkedinUrl;
    private String githubUrl;
    private String websiteUrl;

    // Özet
    private String title;
    private Integer totalExperienceYear;
    private String summary;

    // Eğitim
    private String educationSchool;
    private String educationDegree;
    private String educationDepartment;
    private String educationStartYear;
    private String educationEndYear;

    // Listeler
    private List<UserSkillDTO> skills;
    private List<UserExperienceDTO> experiences;
}
