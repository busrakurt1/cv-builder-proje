package com.cvbuilder.service;

import com.cvbuilder.dto.GeneratedCvResponse;
import com.cvbuilder.entity.GeneratedCv;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.User;
import com.cvbuilder.external.AiClient;
import com.cvbuilder.repository.GeneratedCvRepository;
import com.cvbuilder.repository.JobPostingRepository;
import com.cvbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CvGeneratorServiceImpl implements CvGeneratorService {   // <-- önemli

    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final GeneratedCvRepository generatedCvRepository;
    private final AiClient aiClient;

    @Override
    @Transactional
    public GeneratedCvResponse generateCvForJob(Long userId, Long jobPostingId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        JobPosting job = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Job posting not found"));

        var profile = user.getProfile();

        String cvContent = aiClient.generateCv(profile, job);

        GeneratedCv generatedCv = GeneratedCv.builder()
                .user(user)
                .jobPosting(job)
                .templateName("ATS_DEFAULT")
                .content(cvContent)
                .build();

        generatedCvRepository.save(generatedCv);

        GeneratedCvResponse resp = new GeneratedCvResponse();
        resp.setCvId(generatedCv.getId());
        resp.setTemplateName(generatedCv.getTemplateName());
        resp.setContent(generatedCv.getContent());

        return resp;
    }
}
