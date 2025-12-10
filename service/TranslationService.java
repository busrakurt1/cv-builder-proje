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

import java.net.URI;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Güçlendirilmiş TranslationService:
 * - API key rotation
 * - Timeout ve hata yönetimi
 * - PII maskeleme (basit)
 * - API URL düzeltmesi
 * - Response temizleme / JSON kontrolü
 */
@Service
public class TranslationService {

    @Value("${gemini.api.keys}")
    private String apiKeysString;

    @Value("${gemini.model}")
    private String modelName;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseApiUrl; // isteğe bağlı override

    private List<String> apiKeys;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TranslationService() {
        // Basit timeout konfigürasyonu
        this.restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(20))
                .build();
    }

    @PostConstruct
    public void init() {
        if (apiKeysString != null && !apiKeysString.isBlank()) {
            this.apiKeys = new ArrayList<>();
            for (String k : apiKeysString.split(",")) {
                String t = k.trim();
                if (!t.isEmpty()) this.apiKeys.add(t);
            }
        }
        if (this.apiKeys == null || this.apiKeys.isEmpty()) {
            throw new RuntimeException("API Key bulunamadı! Lütfen application.yml dosyasını kontrol edin.");
        }
    }

    private String getNextKey() {
        if (apiKeys == null || apiKeys.isEmpty()) throw new RuntimeException("API Key yok");
        int idx = Math.abs(currentKeyIndex.getAndIncrement() % apiKeys.size());
        return apiKeys.get(idx);
    }

    // PUBLIC: AI'den ham metin üretimi (AiClient kullanacak)
    public String generateContent(String prompt) {
        // Minimal sanitization: prompt'u temizle (PII yoksa devam)
        String sanitizedPrompt = prompt;
        return sendRequestToGemini(sanitizedPrompt, false);
    }

    // PUBLIC: CV çevirisi (dönen nesne Map olarak)
    public Map<String, Object> translateCV(Object userCvData, String targetLang) {
        String languageName = targetLang.equalsIgnoreCase("en") ? "English" : targetLang;

        String jsonInput;
        try {
            jsonInput = objectMapper.writeValueAsString(userCvData);
        } catch (Exception e) {
            throw new RuntimeException("JSON Hatası: " + e.getMessage());
        }

        // PII maskele - optional, basit regex (e-posta/telefon)
        String maskedJsonInput = maskPII(jsonInput);

        String prompt = String.format(
                "You are an expert CV translator. Translate the JSON values into %s. " +
                "STRICT RULES:\n" +
                "1) Do not change JSON structure. Only translate string values.\n" +
                "2) Keep technical terms (e.g., Java, Spring, AWS) and company names unchanged.\n" +
                "3) Do not modify id, email, phone, linkedinUrl or date fields.\n" +
                "4) Return ONLY valid JSON (no markdown, no backticks).\n\nINPUT_JSON:\n%s",
                languageName,
                maskedJsonInput
        );

        // AI'den JSON string bekliyoruz
        String aiText = sendRequestToGemini(prompt, true);

        // Temizle (kod bloklarını / açıklamaları kaldır)
        String cleaned = cleanPossibleCodeFences(aiText);

        try {
            // dönen string'i Map'e parse et
            Map<String, Object> result = objectMapper.readValue(cleaned, Map.class);
            return result;
        } catch (Exception e) {
            // Eğer AI valid JSON döndermediyse fallback -> hata fırlat veya null döndür
            throw new RuntimeException("AI yanıtı JSON'a çevrilemedi. AI çıktı: " + cleaned.substring(0, Math.min(300, cleaned.length())));
        }
    }

    // CORE: API'ye istek atar (key rotation, retry)
    private String sendRequestToGemini(String prompt, boolean expectJson) {
        String safeModelName = modelName.startsWith("models/") ? modelName : "models/" + modelName;
        int maxAttempts = Math.max(1, apiKeys.size()) * 2;

        // Build request payload according to a generic provider format (güncellenebilir)
        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String key = getNextKey();
            // Doğru URL oluşturma
            String apiUrl = UriComponentsBuilder.fromHttpUrl(baseApiUrl)
                    .pathSegment(safeModelName + ":generateContent")
                    .queryParam("key", key)
                    .build()
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Eğer sağlayıcı Bearer token gerektiriyorsa: headers.set("Authorization", "Bearer " + key);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    String raw = response.getBody();
                    // parse edip text çıkar
                    String text = parseGeminiResponseSafe(raw);
                    if (text != null && !text.isBlank()) {
                        return text.trim();
                    } else {
                        // boşsa devam et
                        continue;
                    }
                } else {
                    // log non-200
                    System.err.println("API non-2xx: " + response.getStatusCode());
                }
            } catch (HttpClientErrorException.TooManyRequests | HttpServerErrorException.ServiceUnavailable e) {
                System.err.println("Rate limit veya servis problemi: " + e.getStatusCode() + " - key: " + maskKey(key));
                sleepSilently(800);
                continue; // diğer anahtara geç
            } catch (HttpClientErrorException.NotFound e) {
                throw new RuntimeException("Model bulunamadı (404). Model: " + safeModelName);
            } catch (HttpClientErrorException e) {
                System.err.println("Client error: " + e.getStatusCode() + " - " + maskKey(key));
            } catch (ResourceAccessException e) {
                System.err.println("Timeout/ResourceAccess: " + e.getMessage());
            } catch (Exception e) {
                System.err.println("Beklenmeyen hata: " + e.getMessage());
            }
        }

        throw new RuntimeException("Tüm anahtarlar denendi veya servis cevap vermiyor.");
    }

    private String parseGeminiResponseSafe(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            // Tipik OpenAI-like / Gemini-like field parse : choices[0].message.content veya candidates[0].content.parts[0].text
            if (root.has("choices")) {
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode first = choices.get(0);
                    JsonNode msg = first.path("message");
                    if (msg.has("content")) {
                        JsonNode content = msg.path("content");
                        if (content.isArray() && content.size() > 0) {
                            JsonNode part = content.get(0);
                            if (part.has("text")) return part.get("text").asText();
                        } else if (content.has("text")) {
                            return content.get("text").asText();
                        }
                    }
                    // fallback: text field
                    if (first.has("text")) return first.get("text").asText();
                }
            }
            // old Gemini style "candidates"
            if (root.has("candidates")) {
                JsonNode cand = root.path("candidates");
                if (cand.isArray() && cand.size() > 0) {
                    JsonNode content = cand.get(0).path("content");
                    if (content.has("parts") && content.path("parts").isArray() && content.path("parts").size() > 0) {
                        return content.path("parts").get(0).path("text").asText();
                    }
                }
            }
            // fallback: try to return whole body as text
            return responseBody;
        } catch (Exception e) {
            // not JSON - return raw
            return responseBody;
        }
    }

    // Basit kod bloğu / markdown temizleyici
    private String cleanPossibleCodeFences(String text) {
        if (text == null) return "";
        // remove ```json ... ``` or ``` ... ```
        String cleaned = text.replaceAll("(?s)```.*?```", "").trim();
        // remove leading/trailing backticks and whitespace
        cleaned = cleaned.replaceAll("^`+|`+$", "").trim();
        return cleaned;
    }

    // Basit PII maskeleme (email ve phone)
    private String maskPII(String json) {
        if (json == null) return null;
        // email mask
        String emailRegex = "(?i)([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})";
        json = json.replaceAll(emailRegex, "$1@****");
        // phone mask: 10+ digit sequences
        json = json.replaceAll("\\b(\\+?\\d[\\d .\\-()]{6,}\\d)\\b", "*****");
        return json;
    }

    private void sleepSilently(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 8) return "****";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }
}
