package com.cvbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "user_experiences")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String position;
    private String company;
    private String city;

    private String startDate;
    private String endDate;

    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private UserProfile userProfile;
}