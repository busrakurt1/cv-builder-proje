package com.cvbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "generated_cvs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GeneratedCv {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String templateName; // ATS_DEFAULT, MODERN, vs.

    @Column(length = 10000)
    private String content; // Plain text / JSON / Markdown

    private String filePath; // Eğer PDF olarak kaydedersen

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "job_posting_id")
    private JobPosting jobPosting;
}
