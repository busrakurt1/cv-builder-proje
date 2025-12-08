package com.cvbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    // SADECE CV ALANLARI KALACAK

    private String linkedinUrl;
    private String githubUrl;
    private String websiteUrl;

    private String title;
    private Integer totalExperienceYear;

    @Column(length = 2000)
    private String summary;

    private String educationSchool;
    private String educationDegree;
    private String educationDepartment;
    private String educationStartYear;
    private String educationEndYear;

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserSkill> skills = new ArrayList<>();

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserExperience> experiences = new ArrayList<>();
}
