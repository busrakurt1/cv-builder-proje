package com.cvbuilder.controller;

import com.cvbuilder.dto.GeneratedCvResponse;
import com.cvbuilder.external.AiClient; // EKLENDİ
import com.cvbuilder.service.CvGeneratorService;
import com.cvbuilder.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv-generator")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CvGeneratorController {

    private final TranslationService translationService;
    private final CvGeneratorService cvGeneratorService;
    private final AiClient aiClient; // EKLENDİ: Direkt AI servisine erişim için

    // 1) CV OLUŞTURMA ENDPOINT'İ
    @PostMapping("/create")
    public ResponseEntity<GeneratedCvResponse> createCv(
            @RequestHeader("X-USER-ID") Long userId,
            @RequestParam(required = false) Long jobId
    ) {
        GeneratedCvResponse response = cvGeneratorService.generateCvForJob(userId, jobId);
        return ResponseEntity.ok(response);
    }

    // 2) ÇEVİRİ ENDPOINT'İ
    @PostMapping("/translate")
    public ResponseEntity<?> translateCv(@RequestBody Object cvData, @RequestParam String lang) {
        try {
            Object translatedCv = translationService.translateCV(cvData, lang);
            
            if (translatedCv != null) {
                return ResponseEntity.ok(translatedCv);
            } else {
                return ResponseEntity.badRequest().body("Çeviri yapılamadı (Boş yanıt).");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Sunucu Hatası: " + e.getMessage());
        }
    }

    // 3) YENİ: KARİYER TAVSİYESİ (MARKET ANALYSIS) ENDPOINT'İ
    // Frontend'den gelen isteği karşılar: GET /api/cv-generator/career-advice?title=Java Developer
    @GetMapping("/career-advice")
    public ResponseEntity<String> getCareerAdvice(@RequestParam String title) {
        // AiClient içindeki metodu çağırıyoruz
        String advice = aiClient.getCareerAdvice(title);
        return ResponseEntity.ok(advice);
    }
}