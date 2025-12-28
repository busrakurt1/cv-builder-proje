package com.cvbuilder.controller;

import com.cvbuilder.dto.MarketAnalysisRequest;
import com.cvbuilder.dto.MarketAnalysisResponse;
import com.cvbuilder.service.JobAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MarketController {

    private final JobAnalysisService jobAnalysisService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestBody MarketAnalysisRequest request) {

        Long userId = request.getUserId();
        String area = request.getArea();

        log.info("Market analysis request - userId={}, area={}", userId, area);

        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "userId boş olamaz"));
        }

        // area boşsa otomatik analiz: service profil/department ile belirlesin
        String normalizedArea = (area != null && !area.trim().isEmpty()) ? area.trim() : null;

        try {
            MarketAnalysisResponse response = jobAnalysisService.performMarketAnalysis(normalizedArea, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Pazar analizi sırasında hata oluştu",
                    "detail", e.getMessage()
            ));
        }
    }
}
