// src/main/java/com/cvbuilder/entity/UserExperience.java
package com.cvbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_experiences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Hangi profile ait?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private UserProfile userProfile;

    @Column(nullable = false)
    private String company;      // Örn: "ABC Teknoloji"

    @Column(nullable = false)
    private String position;     // Örn: "Backend Developer"

    private String city;         // Örn: "İstanbul" / "Remote"

    @Column(length = 2000)
    private String description;  // Yapılan işler

    private String startDate;    // Örn: "2023-01"
    private String endDate;      // Örn: "2024-11" veya "Devam ediyor"
}
