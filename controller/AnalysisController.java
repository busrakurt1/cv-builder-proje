package com.cvbuilder.controller;

import com.cvbuilder.dto.AnalysisResult;
import com.cvbuilder.dto.JobMatchRequest;
import com.cvbuilder.service.CustomJobAnalysisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final CustomJobAnalysisService analysisService;

    public AnalysisController(CustomJobAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/job-match")
    public ResponseEntity<AnalysisResult> analyzeJobMatch(@RequestBody JobMatchRequest request) {
        log.info("📥 İş eşleşme analizi isteği alındı: userId={}", request.getUserId());
        
        try {
            AnalysisResult result = analysisService.analyzeJobMatch(request);
            
            log.info("✅ İş eşleşme analizi tamamlandı: {}% eşleşme", result.getMatchPercentage());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ İş eşleşme analizi hatası: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Analysis API çalışıyor");
    }
}