package com.cvbuilder.external;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class JobScraperClient {

    private static final Map<String, String[]> SITE_SELECTORS = new HashMap<>();
    
    static {
        // Site bazlı selector tanımlamaları
        SITE_SELECTORS.put("kariyer.net", new String[]{
            "#job-detail > div:nth-child(1) > div > div:nth-child(2)", // Ana içerik
            "div[class*='job-detail']", 
            "section.job-detail-content" // En spesifik selector
        });
        
        SITE_SELECTORS.put("linkedin.com", new String[]{
            ".description__text", 
            ".show-more-less-html__markup",
            ".jobs-description__content"
        });
        
        SITE_SELECTORS.put("yenibiris.com", new String[]{
            ".job-detail-content",
            ".detail-text"
        });
        
        SITE_SELECTORS.put("eleman.net", new String[]{
            ".ilanDetay",
            "#jobDetail"
        });
    }

    public Map<String, String> fetchJobData(String url) {
        Map<String, String> result = new HashMap<>();
        
        try {
            Connection.Response response = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept-Language", "tr-TR,tr;q=0.9")
                    .referrer("https://www.google.com/")
                    .ignoreHttpErrors(true)
                    .timeout(20000)
                    .execute();

            Document doc = response.parse();
            
            // 1. Sayfa başlığından iş başlığını al
            String pageTitle = doc.title();
            result.put("pageTitle", pageTitle);
            
            // 2. Siteye özel selector ile SADECE ilan içeriğini çek
            String jobContent = extractJobSpecificContent(doc, url);
            result.put("jobContent", jobContent);
            
            // 3. Meta etiketlerinden lokasyon ve şirket bilgisi
            result.put("location", extractFromMeta(doc, "location", "place"));
            result.put("company", extractFromMeta(doc, "company", "organization"));
            
            // 4. Structured Data (JSON-LD) kontrolü
            String structuredData = extractStructuredData(doc);
            if (!structuredData.isEmpty()) {
                result.put("structuredData", structuredData);
            }
            
            // 5. Tüm sayfa text'i (fallback için)
            result.put("fullText", doc.body().text());
            
            return result;

        } catch (IOException e) {
            throw new RuntimeException("İlan çekilemedi: " + e.getMessage());
        }
    }
    
    private String extractJobSpecificContent(Document doc, String url) {
        // Site bazlı selector denenmesi
        for (Map.Entry<String, String[]> entry : SITE_SELECTORS.entrySet()) {
            if (url.contains(entry.getKey())) {
                for (String selector : entry.getValue()) {
                    Elements elements = doc.select(selector);
                    if (!elements.isEmpty()) {
                        StringBuilder content = new StringBuilder();
                        for (Element el : elements) {
                            content.append(el.text()).append("\n");
                        }
                        return content.toString();
                    }
                }
            }
        }
        
        // Fallback: Sadece ilanla ilgili olabilecek bölümler
        Elements likelySections = doc.select(
            "div[class*='job'], " +
            "div[class*='detail'], " +
            "div[class*='description'], " +
            "section[class*='content'], " +
            "div[class*='position'], " +
            "div[class*='requirement']"
        );
        
        if (!likelySections.isEmpty()) {
            StringBuilder content = new StringBuilder();
            for (Element el : likelySections) {
                String text = el.text().toLowerCase();
                // Sadece iş ilanı içeriği gibi görünenleri al
                if (text.contains("aranan") || text.contains("sorumluluk") || 
                    text.contains("nitelik") || text.contains("beceri") ||
                    text.contains("tecrübe") || text.contains("yetenek")) {
                    content.append(el.text()).append("\n");
                }
            }
            if (content.length() > 100) {
                return content.toString();
            }
        }
        
        // Son çare: Body text'i ama navigasyon vs temizle
        return cleanBodyText(doc.body());
    }
    
    private String cleanBodyText(Element body) {
        // Gereksiz elementleri temizle
        body.select("nav, header, footer, script, style, iframe, .nav, .menu, .sidebar").remove();
        return body.text();
    }
    
    private String extractFromMeta(Document doc, String... keys) {
        for (String key : keys) {
            Element meta = doc.select("meta[name=" + key + "], meta[property=" + key + "]").first();
            if (meta != null) {
                return meta.attr("content");
            }
        }
        return "";
    }
    
    private String extractStructuredData(Document doc) {
        Elements scripts = doc.select("script[type='application/ld+json']");
        for (Element script : scripts) {
            if (script.html().contains("\"@type\":\"JobPosting\"")) {
                return script.html();
            }
        }
        return "";
    }
}