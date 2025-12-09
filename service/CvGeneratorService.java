package com.cvbuilder.service;

import com.cvbuilder.dto.GeneratedCvResponse;

public interface CvGeneratorService {

    GeneratedCvResponse generateCvForJob(Long userId, Long jobPostingId);

}
