package com.cvbuilder.controller;

import com.cvbuilder.dto.JobAnalysisResponse;
import com.cvbuilder.dto.JobUrlRequest;
import com.cvbuilder.service.JobAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/job")
@RequiredArgsConstructor
public class JobController {

    private final JobAnalysisService jobAnalysisService;

    @PostMapping("/analyze")
    public JobAnalysisResponse analyzeJob(@RequestHeader("X-USER-ID") Long userId,
                                          @RequestBody JobUrlRequest request) {
        return jobAnalysisService.analyzeJobPosting(userId, request.getUrl());
    }
}
