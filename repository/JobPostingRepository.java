package com.cvbuilder.repository;

import com.cvbuilder.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    // Bir kullanıcıya ait tüm iş ilanları
    List<JobPosting> findByUserId(Long userId);

    // Aynı URL daha önce eklenmiş mi kontrol etmek için
    List<JobPosting> findByUserIdAndUrl(Long userId, String url);
}
