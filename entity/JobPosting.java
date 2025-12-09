package com.cvbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "job_postings")
@Data // <--- Bu anotasyon getTitle() metodunu senin yerine yazar!
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String url;
    
    // Eski kodunda 'position' vardı, ikisi karışmasın diye 'title'ı ekliyoruz:
    private String position; 

    // 🔥 EKSİK OLAN BU SATIRI EKLE:
    private String title; 

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String cleanedText;

    @Column(columnDefinition = "TEXT")
    private String requiredSkills;
    
    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(columnDefinition = "TEXT") 
    private String analysisReport; 

    @Column(columnDefinition = "TEXT")
    private String niceToHave;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
}