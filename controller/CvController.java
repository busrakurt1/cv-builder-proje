package com.cvbuilder.controller;

import com.cvbuilder.dto.GeneratedCvResponse;
import com.cvbuilder.service.CvGeneratorService;   // <-- DOĞRU import
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvController {

    private final CvGeneratorService cvGeneratorService;   // Impl değil, interface!

    @PostMapping("/generate/{jobPostingId}")
    public GeneratedCvResponse generate(
            @RequestParam Long userId,
            @PathVariable Long jobPostingId) {

        return cvGeneratorService.generateCvForJob(userId, jobPostingId);
    }
}
