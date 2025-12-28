package com.cvbuilder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * TranslationService (Ultimate Version)
 * Zincirleme AI Sistemi:
 * 1. Groq (Multi-Key) -> PRIMARY
 * 2. Gemini (Multi-Key) -> SECONDARY
 * 3. DeepSeek (Multi-Key) -> TERTIARY
 */
@Service
public class TranslationService {

    // ==========================================
    // 1. GROQ CONFIG
    // ==========================================
    @Value("${groq.api.keys:}")
    private String groqApiKeysString;
    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqUrl;
    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ==========================================
    // 2. GEMINI CONFIG
    // ==========================================
    @Value("${gemini.api.keys}")
    private String geminiApiKeysString;
    @Value("${gemini.model}")
    private String modelName;
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseApiUrl;

    // ==========================================
    // 3. DEEPSEEK CONFIG
    // ==========================================
    @Value("${deepseek.api.keys:}")
    private String deepSeekApiKeysString;
    @Value("${deepseek.api.url:https://api.deepseek.com/chat/completions}")
    private String deepSeekUrl;
    @Value("${deepseek.model:deepseek-chat}")
    private String deepSeekModel;

    // Anahtar Listeleri ve İndeksler
    private List<String> groqKeys;
    private List<String> geminiKeys;
    private List<String> deepSeekKeys;

    private final AtomicInteger currentGeminiIndex = new AtomicInteger(0);
    private final AtomicInteger currentGroqIndex = new AtomicInteger(0);
    private final AtomicInteger currentDeepSeekIndex = new AtomicInteger(0);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TranslationService() {
        this.restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(60)) 
                .build();
    }

    @PostConstruct
    public void init() {
        // 1. Groq Init
        this.groqKeys = parseKeys(groqApiKeysString);
        if (this.groqKeys.isEmpty()) System.err.println("UYARI: Groq anahtarları yok!");

        // 2. Gemini Init (Düzeltildi: geminiApiKeysString kullanıldı)
        this.geminiKeys = parseKeys(geminiApiKeysString);
        if (this.geminiKeys.isEmpty()) System.err.println("UYARI: Gemini anahtarları yok!");

        // 3. DeepSeek Init
        this.deepSeekKeys = parseKeys(deepSeekApiKeysString);
        if (this.deepSeekKeys.isEmpty()) System.err.println("UYARI: DeepSeek anahtarları yok!");
    }

    private List<String> parseKeys(String raw) {
        List<String> list = new ArrayList<>();
        if (raw != null && !raw.isBlank()) {
            for (String k : raw.split(",")) {
                String t = k.trim();
                if (!t.isEmpty()) list.add(t);
            }
        }
        return list;
    }

    private String getNextKey(List<String> keys, AtomicInteger index) {
        if (keys == null || keys.isEmpty()) throw new RuntimeException("API Key Listesi Boş!");
        int idx = Math.abs(index.getAndIncrement() % keys.size());
        return keys.get(idx);
    }

    // =========================================================
    // PUBLIC METHODS (ZİNCİRLEME MANTIK GÜNCELLENDİ)
    // Sıra: GROQ -> GEMINI -> DEEPSEEK
    // =========================================================

    public String generateContent(String prompt) {
        // 1. GROQ (Primary)
        try {
            return sendRequestToGroq(prompt);
        } catch (Exception e1) {
            System.err.println("Groq başarısız (" + e1.getMessage() + "), Gemini deneniyor...");

            // 2. GEMINI (Secondary)
            try {
                return sendRequestToGemini(prompt);
            } catch (Exception e2) {
                System.err.println("Gemini başarısız (" + e2.getMessage() + "), DeepSeek deneniyor...");

                // 3. DEEPSEEK (Tertiary)
                return sendRequestToDeepSeek(prompt);
            }
        }
    }

    public Map<String, Object> translateCV(Object userCvData, String targetLang) {
        String languageName = targetLang.equalsIgnoreCase("en") ? "English" : targetLang;
        String jsonInput;
        try {
            jsonInput = objectMapper.writeValueAsString(userCvData);
        } catch (Exception e) {
            throw new RuntimeException("JSON Hatası: " + e.getMessage());
        }

        String prompt = String.format(
                "You are an expert CV translator. Translate the JSON values into %s. " +
                        "STRICT RULES:\n" +
                        "1) Do not change JSON structure. Only translate string values.\n" +
                        "2) Keep technical terms (e.g., Java, Spring, AWS) and company names unchanged.\n" +
                        "3) Do not modify id, email, phone, linkedinUrl or date fields.\n" +
                        "4) Return ONLY valid JSON (no markdown, no backticks).\n\nINPUT_JSON:\n%s",
                languageName,
                jsonInput
        );

        String aiText;
        
        // 1. GROQ (Primary)
        try {
            aiText = sendRequestToGroq(prompt);
        } catch (Exception e1) {
            System.err.println("Groq translateCV başarısız (" + e1.getMessage() + "), Gemini deneniyor...");

            // 2. GEMINI (Secondary)
            try {
                aiText = sendRequestToGemini(prompt);
            } catch (Exception e2) {
                System.err.println("Gemini translateCV başarısız (" + e2.getMessage() + "), DeepSeek deneniyor...");

                // 3. DEEPSEEK (Tertiary)
                try {
                    aiText = sendRequestToDeepSeek(prompt);
                } catch (Exception e3) {
                    throw new RuntimeException("TÜM AI SERVİSLERİ (Groq, Gemini, DeepSeek) BAŞARISIZ OLDU!");
                }
            }
        }

        String cleaned = cleanPossibleCodeFences(aiText);
        try {
            return objectMapper.readValue(cleaned, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("AI yanıtı JSON formatında değil: " + cleaned.substring(0, Math.min(100, cleaned.length())) + "...");
        }
    }

    // =========================================================
    // CORE: GEMINI REQUEST
    // =========================================================
    private String sendRequestToGemini(String prompt) {
        if (geminiKeys == null || geminiKeys.isEmpty()) throw new RuntimeException("Gemini keys yok");
        String safeModelName = modelName.startsWith("models/") ? modelName : "models/" + modelName;
        int maxAttempts = Math.max(1, geminiKeys.size());

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String key = getNextKey(geminiKeys, currentGeminiIndex);
            String apiUrl = UriComponentsBuilder.fromHttpUrl(baseApiUrl)
                    .pathSegment(safeModelName + ":generateContent")
                    .queryParam("key", key)
                    .build()
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return parseResponseSafe(response.getBody());
                }
            } catch (HttpClientErrorException.TooManyRequests e) {
                System.err.println("Gemini 429 - Key değişiyor: " + maskKey(key));
                continue;
            } catch (Exception e) {
                System.err.println("Gemini Hatası - Key: " + maskKey(key) + " - " + e.getMessage());
            }
        }
        throw new RuntimeException("Tüm Gemini anahtarları tükendi.");
    }

    // =========================================================
    // CORE: GROQ REQUEST
    // =========================================================
    private String sendRequestToGroq(String prompt) {
        if (groqKeys == null || groqKeys.isEmpty()) throw new RuntimeException("Groq keys yok");
        int maxAttempts = Math.max(1, groqKeys.size());

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "messages", List.of(message),
                "temperature", 0.7
        );

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String key = getNextKey(groqKeys, currentGroqIndex);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + key);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                ResponseEntity<String> response = restTemplate.postForEntity(groqUrl, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return parseResponseSafe(response.getBody());
                }
            } catch (HttpClientErrorException.TooManyRequests e) {
                System.err.println("Groq 429 - Key değişiyor: " + maskKey(key));
                continue;
            } catch (Exception e) {
                System.err.println("Groq Hatası - Key: " + maskKey(key) + " - " + e.getMessage());
            }
        }
        throw new RuntimeException("Tüm Groq anahtarları denendi.");
    }

    // =========================================================
    // CORE: DEEPSEEK REQUEST
    // =========================================================
    private String sendRequestToDeepSeek(String prompt) {
        if (deepSeekKeys == null || deepSeekKeys.isEmpty()) throw new RuntimeException("DeepSeek keys yok");
        int maxAttempts = Math.max(1, deepSeekKeys.size());

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> requestBody = Map.of(
                "model", deepSeekModel,
                "messages", List.of(message),
                "temperature", 0.7
        );

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String key = getNextKey(deepSeekKeys, currentDeepSeekIndex);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + key);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                ResponseEntity<String> response = restTemplate.postForEntity(deepSeekUrl, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return parseResponseSafe(response.getBody());
                }
            } catch (HttpClientErrorException.TooManyRequests e) {
                System.err.println("DeepSeek 429 - Key değişiyor: " + maskKey(key));
                continue;
            } catch (Exception e) {
                System.err.println("DeepSeek Hatası - Key: " + maskKey(key) + " - " + e.getMessage());
            }
        }
        throw new RuntimeException("Tüm DeepSeek anahtarları denendi.");
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private String parseResponseSafe(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            // OpenAI / Groq / DeepSeek Format
            if (root.has("choices")) {
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    return choices.get(0).path("message").path("content").asText();
                }
            }

            // Gemini Format
            if (root.has("candidates")) {
                JsonNode cand = root.path("candidates");
                if (cand.isArray() && cand.size() > 0) {
                    JsonNode content = cand.get(0).path("content");
                    if (content.has("parts")) {
                        return content.path("parts").get(0).path("text").asText();
                    }
                }
            }
            return responseBody;
        } catch (Exception e) {
            return responseBody;
        }
    }

    private String cleanPossibleCodeFences(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("(?s)```.*?```", "").trim();
        cleaned = cleaned.replaceAll("^`+|`+$", "").trim();
        return cleaned;
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 8) return "****";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }
}