package com.cvbuilder.controller;

import com.cvbuilder.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv-generator")
@CrossOrigin(origins = "http://localhost:5173") // React portunuz
public class CvGeneratorController {

    @Autowired
    private TranslationService translationService;

    // POST /api/cv-generator/translate?lang=en
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
}