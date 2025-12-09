package com.cvbuilder.service;

import com.cvbuilder.dto.JobAnalysisResponse;

public interface JobAnalysisService {

    JobAnalysisResponse analyzeJobPosting(Long userId, String url);
}
