package com.cvbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "job_postings")
@Data
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

    @Column(columnDefinition = "TEXT")
    private String cleanedText;

    private String requiredSkills;
    
    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    // EKRAN GÖRÜNTÜSÜNDEKİ HATAYI ÇÖZEN KISIM BURASI:
    @Column(columnDefinition = "TEXT") 
    private String analysisReport; 

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

	public String getNiceToHave() {
		// TODO Auto-generated method stub
		return null;
	}

	public String getDescription() {
		// TODO Auto-generated method stub
		return null;
	}
}