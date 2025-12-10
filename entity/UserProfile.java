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

    // --- TEMEL BİLGİLER ---
    private String linkedinUrl;
    private String githubUrl;
    private String websiteUrl;

    private String title;
    private Integer totalExperienceYear;

    @Column(length = 2000)
    private String summary;

    // --- EĞİTİM ---
    private String educationSchool;
    //private String educationDegree;
   // private String educationDepartment;
    private String educationStartYear;
    private String educationEndYear;

    // --- İLİŞKİSEL LİSTELER ---

    // 1. Yetenekler
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserSkill> skills = new ArrayList<>();
    
    @OneToMany(
    	    mappedBy = "userProfile",
    	    cascade = CascadeType.ALL,
    	    orphanRemoval = true
    	)
    	private List<UserProject> projects = new ArrayList<>();
    
    // 2. Deneyimler
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserExperience> experiences = new ArrayList<>();

    // 3. YENİ: Diller
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserLanguage> languages = new ArrayList<>();

    // 4. YENİ: Sertifikalar
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCertificate> certificates = new ArrayList<>();
}

