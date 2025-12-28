package com.cvbuilder.external;

import com.cvbuilder.dto.OptimizedCvItem;
import com.cvbuilder.dto.UserCertificateDTO;
import com.cvbuilder.dto.UserEducationDTO;
import com.cvbuilder.dto.UserLanguageDTO;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.UserProfile;
import com.cvbuilder.entity.UserSkill;
import com.cvbuilder.repository.JobPostingRepository;
import com.cvbuilder.service.TranslationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class AiClient {

    private static final Logger log = LoggerFactory.getLogger(AiClient.class);

    private final TranslationService translationService;
    private final JobPostingRepository jobPostingRepository;

    @Autowired
    public AiClient(TranslationService translationService, JobPostingRepository jobPostingRepository) {
        this.translationService = translationService;
        this.jobPostingRepository = jobPostingRepository;
    }

    /**
     * BİREYSEL İŞ ANALİZİ: Aday profili ile iş ilanını ATS kriterlerine göre karşılaştırır.
     */
    public String analyzeJobSubmission(UserProfile user, String rawJobText) {
        String userContext = formatUserProfile(user);
        String jobText = safe(rawJobText);

        String prompt = """
              SEN DÜNYA STANDARTLARINDA BİR KIDEMLİ TEKNİK RECRUITER VE STRATEJİK İŞ ANALİSTİSİN.
Görevin, adayın profilini bir büyüteç altına alarak iş ilanıyla "Semantik (Anlamsal)" bir karşılaştırma yapmaktır. 

### ANALİZ TALİMATLARI:
1. **Derin Karşılaştırma:** Sadece anahtar kelime eşleşmesine bakma. Adayın iş deneyimlerindeki sorumluluklarını, iş ilanındaki "Sorumluluklar" maddeleriyle eşleştir. 
2. **Kritiklik Seviyesi:** İlandaki teknolojileri "Kritik", "Destekleyici" ve "Yumuşak Beceriler" olarak sınıflandır ve analizi buna göre yap.
3. **Dil ve Kültür:** Adayın dil seviyesinin (Örn: B2), ilandaki teknik dökümantasyon okuma veya toplantı yönetme ihtiyacını karşılayıp karşılamayacağını yorumla.
4. **Çıkarım Yap:** Eğer aday "Spring Boot" biliyorsa, onun "Microservices" ve "Java" ekosistemine hakim olduğunu varsayarak yetkinlik skorunu buna göre işle.
5) ÇIKARIM YAP (INFERENCE): Eğer aday "Veritabanı süreçlerini yönettim" diyorsa, doğrudan belirtmese bile 'SQL' bildiğini varsay ve bunu "Eşleşenler" kısmında "Tecrübeden çıkarılmıştır" notuyla belirt.
6) GRUPLAMA YAP: "Microsoft Office", "Excel" ve "Powerpoint" gibi yetenekleri tek tek saymak yerine "Ofis Teknolojileri Uyumlu" şeklinde stratejik bir başlıkta birleştir.
7) SKORLAMA: Adayın bu işi yapıp yapamayacağına dair 100 üzerinden bir 'Yeterlilik Skoru' belirle.

---
### ÇIKTI FORMATI:

### 📊 Detaylı Teknik Uyumluluk Analizi
- [Stratejik Yorum]: Adayın kariyer yolculuğu bu pozisyonun evrimiyle ne kadar örtüşüyor? (En az 5 cümlelik, teknik derinliği olan bir paragraf).
- [ATS Puanı Tahmini]: 100 üzerinden bir uyum skoru ver ve nedenini açıkla.

### ✅ Eşleşen Teknik Yetkinlikler ve Deneyim Transferi
- (Adayın sahip olduğu bir yeteneğin, ilandaki tam olarak hangi problemi çözeceğini açıkla. Örn: "Adayın X projesindeki tecrübesi, ilandaki Y sisteminin kurulması için kritik önemde.")
- (En az 6 detaylı madde)

### ⚠️ Kritik Yetkinlik Boşlukları ve Operasyonel Riskler
- (Sadece eksik listesi değil; bu eksiğin işe alım sonrası oryantasyon süresini nasıl etkileyeceğini belirt.)
- (En az 6 detaylı madde)

### 💡 Mülakat İçin Teknik Soru Önerileri
- (Adayın profilinde belirsiz kalan veya ilanda çok kritik olan noktalar için adaya sorulması gereken 3 teknik soru hazırla.)

### 🎯 Teknik Sonuç ve Başvuru Durumu
- **DURUM:** [UYGUN / KISMEN UYGUN / RİSKLİ / UYGUN DEĞİL]
- **GEREKÇE:** (Verilere dayalı, nihai profesyonel karar özeti.)
---

[Aday Profili]
%s

[İş İlanı]
%s
                """.formatted(userContext, jobText);

        try {
            return translationService.generateContent(prompt);
        } catch (Exception e) {
            log.error("AI Analiz Hatası: ", e);
            return "Analiz servisine şu anda ulaşılamıyor.";
        }
    }

    /**
     * PAZAR ANALİZİ: Belirli bir uzmanlık alanı için toplanan verileri adayın profiliyle kıyaslar.
     */
    public String performMarketTrendAnalysis(String area, String aggregatedJobData, UserProfile userProfile) {
        String userContext = formatUserProfileForMarketAnalysis(userProfile);

        String prompt = """
            SEN ÜST DÜZEY BİR TEKNOLOJİ PAZAR ANALİSTİ VE KARİYER DANIŞMANISIN.
            Aşağıdaki veriler, veritabanında bulunan son iş ilanlarından derlenmiştir.

            GÖREVİN:
            1. '%s' alanıyla ilgili tüm iş ilanlarını otomatik olarak tespit et
            2. Bu ilanlardaki beceri trendlerini analiz et
            3. Adayın mevcut profiliyle karşılaştır
            4. Kişiselleştirilmiş gelişim önerileri sun

            ÖNEMLİ KURALLAR:
            - İlanları sadece başlıkla değil, içerikte geçen teknoloji ve becerilere göre filtrele
            - "Machine Learning" aranıyorsa "Yapay Zeka", "AI", "Veri Bilimi" gibi ilgili terimleri de dikkate al
            - İstatistiksel analiz yap: "100 ilanın 85'inde Python gerekiyor (%85)"
            - Somut ve ölçülebilir öneriler sun

            ÇIKTI FORMATI (TÜRKÇE):

            ### 📊 GENEL PAZAR DURUMU
            - Toplam analiz edilen ilan sayısı: [sayı]
            - '%s' ile ilgili bulunan ilan sayısı: [sayı]
            - Pazar büyüklüğü ve talep eğilimleri

            ### 🔥 EN ÇOK TALEP EDİLEN 10 BECERİ
            1. [Beceri 1] - [%X] oranında talep ediliyor
            2. [Beceri 2] - [%Y] oranında talep ediliyor
            ...

            ### ✅ PROFİLİNİZLE EŞLEŞEN BECERİLER
            - [Beceri 1]: Bu beceriye sahipsiniz - pazar değerinizi artırıyor ✓
            - [Beceri 2]: ...

            ### ⚠️ KRİTİK EKSİK BECERİLERİNİZ
            - [Beceri 1]: %[X] talep oranı - ÖNCELİKLİ ÖĞRENMENİZ GEREKİYOR
            - [Beceri 2]: %[Y] talep oranı - ÖNEMLİ BİR EKSİK
            ...

            ### 🎯 SİZE ÖZEL GELİŞİM YOL HARİTASI
            - İLK 3 AY: [En kritik 3 beceri]
            - 3-6 AY: [Orta vadeli hedefler]
            - 6-12 AY: [Uzun vadeli uzmanlaşma]

            ### 💎 SİZİ ÖNE ÇIKARACAK "KILLER SKILLS"
            - [Niche beceri 1]: Neden önemli?
            - [Niche beceri 2]: Rakiplerden farkınız

            ### 📚 ÖNERİLEN ÖĞRENME KAYNAKLARI
            - [Beceri 1 için]: [Kurs/Kaynak önerisi]
            - [Beceri 2 için]: [Kurs/Kaynak önerisi]

            [TÜM İLAN VERİLERİ]
            %s

            [ADAY PROFİLİ]
            %s
            """.formatted(area, area, aggregatedJobData, userContext);

        try {
            return translationService.generateContent(prompt);
        } catch (Exception e) {
            log.error("Pazar Analizi Hatası: ", e);
            return "Pazar analizi şu an gerçekleştirilemiyor.";
        }
    }

    public String formatAllJobPostingsForAI(List<JobPosting> allJobs) {
        StringBuilder sb = new StringBuilder();
        sb.append("TOPLAM İLAN SAYISI: ").append(allJobs.size()).append("\n\n");

        for (int i = 0; i < Math.min(allJobs.size(), 100); i++) {
            JobPosting job = allJobs.get(i);
            sb.append("--- İLAN ").append(i + 1).append(" ---\n");
            sb.append("POZİSYON: ").append(safe(job.getPosition())).append("\n");
            sb.append("GEREKLİ BECERİLER: ").append(safe(job.getRequiredSkills())).append("\n");
            String cleaned = safe(job.getCleanedText());
            sb.append("AÇIKLAMA: ")
              .append(cleaned.substring(0, Math.min(500, cleaned.length())))
              .append("...\n\n");
        }

        return sb.toString();
    }

    private String formatUserProfileForMarketAnalysis(UserProfile user) {
        if (user == null) return "Profil bilgisi bulunamadı.";

        StringBuilder sb = new StringBuilder();
        sb.append("=== TEMEL BİLGİLER ===\n");
        sb.append("Başlık/Uzmanlık: ").append(safe(user.getTitle())).append("\n");
        if (user.getTotalExperienceYear() != null) {
            sb.append("Toplam Deneyim: ").append(user.getTotalExperienceYear()).append(" yıl\n");
        }

        sb.append("\n=== TEKNİK BECERİLER ===\n");
        if (user.getSkills() != null && !user.getSkills().isEmpty()) {
            user.getSkills().forEach(skill -> sb.append("- ").append(safe(skill.getSkillName())).append("\n"));
        } else {
            sb.append("Belirtilmemiş\n");
        }

        sb.append("\n=== DİL BİLGİSİ ===\n");
        if (user.getLanguages() != null && !user.getLanguages().isEmpty()) {
            user.getLanguages().forEach(lang -> sb.append("- ").append(safe(lang.getLanguage()))
                    .append(" (").append(safe(lang.getLevel())).append(")\n"));
        } else {
            sb.append("Belirtilmemiş\n");
        }

        sb.append("\n=== EĞİTİM ===\n");
        if (user.getEducations() != null && !user.getEducations().isEmpty()) {
            user.getEducations().forEach(edu -> sb.append("- ").append(safe(edu.getDepartment()))
                    .append(", ").append(safe(edu.getSchoolName()))
                    .append(" (").append(safe(edu.getDegree())).append(")\n"));
        } else {
            sb.append("Belirtilmemiş\n");
        }

        return sb.toString();
    }

    public String analyzeJobPostingUniversal(String rawJobText) {
        if (rawJobText == null) rawJobText = "";

        String prompt = String.format(
                "SEN KIDEMLI BIR TEKNIK RECRUITER + IS ANALISTISIN.\n" +
                "Asagidaki is ilanini analiz et ve SADECE JSON DONDUR.\n" +
                "JSON DISINDA HICBIR SEY YAZMA. Markdown yok. Kod blogu yok.\n\n" +
                "JSON SCHEMA:\n" +
                "{\n" +
                "  \"position\": \"...\",\n" +
                "  \"company\": \"...\",\n" +
                "  \"location\": \"...\",\n" +
                "  \"workType\": \"...\",\n" +
                "  \"experienceLevel\": \"...\",\n" +
                "  \"educationLevel\": \"...\",\n" +
                "  \"militaryStatus\": \"...\",\n" +
                "  \"languages\": [\"...\"],\n" +
                "  \"salary\": \"...\",\n" +
                "  \"summary\": \"...\",\n" +
                "  \"technicalSkills\": [\"...\"],\n" +
                "  \"responsibilities\": [\"...\"]\n" +
                "}\n\n" +
                "IS ILANI METNI:\n%s\n",
                rawJobText
        );

        try {
            String response = translationService.generateContent(prompt);
            if (response == null) return "{}";
            return response.replaceAll("```json|```", "").trim();
        } catch (Exception e) {
            log.error("AI JSON Analiz Hatası: ", e);
            return "{}";
        }
    }

    public List<String> generateTailoredSummaries(UserProfile profile, String jobContext) {
        String rawTitle = profile != null ? safe(profile.getTitle()) : "Profesyonel";
        String userTitle = toTitleCase(rawTitle);
        String skills = getPrioritizedSkills(profile);
        int years = (profile != null && profile.getTotalExperienceYear() != null) ? profile.getTotalExperienceYear() : 0;

        List<String> summaries = new ArrayList<>();
        summaries.add(String.format("%s deneyime sahip bir %s olarak, %s alanlarındaki yetkinliğimle değer katmayı hedefliyorum.",
                years > 0 ? years + " yıl" : "Yeni mezun", userTitle, years > 0 ? skills : skills));

        try {
            String aiSummary = translationService.generateContent(String.format(
                    "Bir %s için %d yıl deneyimli, şu yeteneklere sahip: %s. Çok kısa, profesyonel bir CV özet cümlesi yaz (Max 2 cümle).",
                    userTitle, years, skills
            ));
            if (aiSummary != null && !aiSummary.isBlank()) summaries.add(aiSummary.replace("\"", "").trim());
        } catch (Exception e) {
            log.warn("AI Özet oluşturulamadı.");
        }

        return summaries;
    }

    public List<OptimizedCvItem> optimizeExperiences(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getExperiences() == null) return Collections.emptyList();
        String jobSkills = (job != null) ? safe(job.getRequiredSkills()) : "";

        return profile.getExperiences().stream().map(exp -> {
            String desc = safe(exp.getDescription());
            if (desc.length() > 10) desc = fixGrammarStrict(desc);

            String matched = findIntersection(desc, jobSkills);
            if (!matched.isEmpty()) desc += " Bu görevde " + matched + " yetkinliklerini aktif olarak kullandım.";

            return new OptimizedCvItem(
                    safe(exp.getPosition()),
                    safe(exp.getCompany()),
                    formatDateRange(exp.getStartDate(), exp.getEndDate()),
                    Collections.singletonList(desc)
            );
        }).collect(Collectors.toList());
    }

    public List<OptimizedCvItem> optimizeProjects(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getProjects() == null) return Collections.emptyList();
        return profile.getProjects().stream().map(p -> new OptimizedCvItem(
                safe(p.getProjectName()), "Proje",
                formatDateRange(p.getStartDate(), (p.getIsOngoing() != null && p.getIsOngoing()) ? null : p.getEndDate()),
                Collections.singletonList(fixGrammarStrict(safe(p.getDescription())))
        )).collect(Collectors.toList());
    }

    public List<UserEducationDTO> optimizeEducation(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getEducations() == null) return Collections.emptyList();
        return profile.getEducations().stream().map(e -> UserEducationDTO.builder()
                .id(e.getId())
                .schoolName(fixGrammarStrict(safe(e.getSchoolName())))
                .department(fixGrammarStrict(safe(e.getDepartment())))
                .degree(safe(e.getDegree()))
                .startYear(safe(e.getStartYear()))
                .graduationYear(e.getEndYear())
                .gpa(safe(e.getGpa()))
                .build()).collect(Collectors.toList());
    }

    public List<UserLanguageDTO> optimizeLanguages(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getLanguages() == null) return Collections.emptyList();
        return profile.getLanguages().stream().map(l -> UserLanguageDTO.builder()
                .id(l.getId())
                .language(safe(l.getLanguage()))
                .level(safe(l.getLevel()))
                .build()).collect(Collectors.toList());
    }

    public List<UserCertificateDTO> optimizeCertificates(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getCertificates() == null) return Collections.emptyList();
        return profile.getCertificates().stream().map(c -> UserCertificateDTO.builder()
                .id(c.getId())
                .name(safe(c.getName()))
                .issuer(safe(c.getIssuer()))
                .date(safe(c.getDate()))
                .url(safe(c.getUrl()))
                .build()).collect(Collectors.toList());
    }

    public String getCareerAdvice(String jobTitle) {
        if (jobTitle == null || jobTitle.isBlank()) return "Tavsiye oluşturulamadı.";
        String prompt = "Kariyer danışmanı olarak '" + jobTitle + "' pozisyonu için trendleri ve gelişim önerilerini Türkçe maddeler halinde yaz.";
        try {
            return translationService.generateContent(prompt);
        } catch (Exception e) {
            log.error("Kariyer Tavsiyesi Hatası: ", e);
            return "Kariyer tavsiyesi şu an oluşturulamıyor.";
        }
    }

    public String analyzeMarketWithAI(String area, List<JobPosting> allJobs, UserProfile userProfile) {
        String allJobsFormatted = formatAllJobPostingsForAI(allJobs);
        String userContext = formatUserProfileForMarketAnalysis(userProfile);

        String prompt = """
            SEN ÜST DÜZEY BİR TEKNOLOJİ PAZAR ANALİSTİSİN.
            Aşağıda veritabanındaki tüm iş ilanları ve bir adayın profili var.

            GÖREVİN:
            1. '%s' alanıyla ilgili TÜM iş ilanlarını BUL (sadece başlık değil, içerikteki becerilere göre)
            2. Bu ilanlardaki BECERİ TRENDLERİNİ analiz et
            3. Adayın mevcut becerileriyle KARŞILAŞTIR
            4. Kişiselleştirilmiş GELİŞİM YOL HARİTASI oluştur

            [TÜM İLAN VERİLERİ]
            %s

            [ADAY PROFİLİ]
            %s
            """.formatted(area, allJobsFormatted, userContext);

        try {
            return translationService.generateContent(prompt);
        } catch (Exception e) {
            log.error("AI Pazar Analizi Hatası: ", e);
            return "Pazar analizi şu an gerçekleştirilemiyor. Lütfen daha sonra tekrar deneyin.";
        }
    }

    public String getQuickMarketAnalysis(String area, List<JobPosting> relevantJobs, UserProfile userProfile) {
        String userContext = formatUserProfileForMarketAnalysis(userProfile);
        String jobsSummary = formatJobsSummaryForQuickAnalysis(relevantJobs);

        String prompt = """
            SEN BİR KARİYER KOÇUSUN.
            '%s' alanındaki iş ilanlarını ve adayın profilini analiz et.

            [İLAN ÖZETİ]
            %s

            [ADAY PROFİLİ]
            %s
            """.formatted(area, jobsSummary, userContext);

        try {
            return translationService.generateContent(prompt);
        } catch (Exception e) {
            log.error("Hızlı Pazar Analizi Hatası: ", e);
            return "Hızlı analiz şu an yapılamıyor.";
        }
    }

    private String formatJobsSummaryForQuickAnalysis(List<JobPosting> jobs) {
        if (jobs == null || jobs.isEmpty()) return "Bu alanda ilan bulunamadı.";

        StringBuilder sb = new StringBuilder();
        sb.append("Toplam İlan: ").append(jobs.size()).append("\n\n");

        Map<String, Integer> skillFrequency = new HashMap<>();
        for (JobPosting job : jobs) {
            if (job.getRequiredSkills() != null) {
                String[] skills = job.getRequiredSkills().split("[,;]");
                for (String skill : skills) {
                    String trimmed = skill.trim();
                    if (!trimmed.isEmpty()) {
                        skillFrequency.put(trimmed, skillFrequency.getOrDefault(trimmed, 0) + 1);
                    }
                }
            }
        }

        sb.append("En Çok Geçen Beceriler:\n");
        skillFrequency.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(10)
                .forEach(entry -> {
                    double percentage = (entry.getValue() * 100.0) / jobs.size();
                    sb.append("- ").append(entry.getKey())
                      .append(": %").append(String.format("%.1f", percentage))
                      .append(" (").append(entry.getValue()).append(" ilan)\n");
                });

        return sb.toString();
    }

    private String formatUserProfile(UserProfile user) {
        if (user == null) return "Profil bilgisi bulunamadı.";

        StringBuilder sb = new StringBuilder();
        sb.append("=== TEMEL BİLGİLER ===\n");
        sb.append("Başlık: ").append(safe(user.getTitle())).append("\n");
        if (user.getTotalExperienceYear() != null) sb.append("Toplam Deneyim: ").append(user.getTotalExperienceYear()).append(" yıl\n");

        sb.append("\n=== ANALİZ İÇİN KRİTİK YETKİNLİKLER (TEKNİK + DİL) ===\n");
        List<String> combinedCapabilities = new ArrayList<>();

        if (user.getLanguages() != null && !user.getLanguages().isEmpty()) {
            user.getLanguages().stream()
                    .map(l -> "DİL: " + safe(l.getLanguage()) + " (Seviye: " + safe(l.getLevel()) + ")")
                    .forEach(combinedCapabilities::add);
        }

        if (user.getSkills() != null) {
            user.getSkills().stream().map(UserSkill::getSkillName).forEach(combinedCapabilities::add);
        }
        sb.append(String.join(", ", combinedCapabilities)).append("\n");

        if (user.getExperiences() != null && !user.getExperiences().isEmpty()) {
            sb.append("\n=== DENEYİM ÖZETİ ===\n");
            user.getExperiences().stream().limit(5).forEach(exp -> sb.append("- ").append(safe(exp.getPosition()))
                    .append(" @ ").append(safe(exp.getCompany()))
                    .append(" (").append(formatDateRange(exp.getStartDate(), exp.getEndDate())).append(")\n"));
        }

        if (user.getEducations() != null && !user.getEducations().isEmpty()) {
            sb.append("\n=== EĞİTİM ===\n");
            user.getEducations().forEach(edu -> sb.append("- ").append(safe(edu.getDepartment()))
                    .append(", ").append(safe(edu.getSchoolName()))
                    .append(" (").append(safe(edu.getDegree())).append(")\n"));
        }

        sb.append("\n=== EK BİLGİLER ===\n");
        String ms = safe(user.getMilitaryStatus());
        if (!ms.isBlank()) sb.append("Askerlik Durumu: ").append(ms).append("\n");

        return sb.toString();
    }

    private String getPrioritizedSkills(UserProfile profile) {
        if (profile == null || profile.getSkills() == null || profile.getSkills().isEmpty()) return "Mesleki Yetkinlikler";
        return profile.getSkills().stream().limit(5).map(UserSkill::getSkillName).collect(Collectors.joining(", "));
    }

    private String fixGrammarStrict(String text) {
        if (text == null || text.length() < 10) return text;
        try {
            String res = translationService.generateContent("Aşağıdaki metni anlamını bozmadan profesyonel bir dille ve imla kurallarına uygun olarak düzelt: " + text);
            return res != null ? res.trim() : text;
        } catch (Exception e) {
            return text;
        }
    }

    private String findIntersection(String text, String skills) {
        if (text == null || skills == null || skills.isBlank()) return "";
        Set<String> match = new HashSet<>();
        String tLower = text.toLowerCase(new Locale("tr", "TR"));
        for (String s : skills.split("[,;]")) {
            String sTrim = s.trim().toLowerCase(new Locale("tr", "TR"));
            if (!sTrim.isEmpty() && tLower.contains(sTrim)) match.add(s.trim());
        }
        return String.join(", ", match);
    }

    private String toTitleCase(String input) {
        if (input == null || input.isEmpty()) return "";
        return Arrays.stream(input.trim().split("\\s+"))
                .map(w -> w.isEmpty() ? "" : Character.toUpperCase(w.charAt(0)) + w.substring(1).toLowerCase(new Locale("tr", "TR")))
                .collect(Collectors.joining(" "));
    }

    private String safe(String text) {
        return (text == null || text.equalsIgnoreCase("null")) ? "" : text.trim();
    }

    private String formatDateRange(String start, String end) {
        String s = (start != null && !start.isBlank()) ? start : "Belirtilmemiş";
        String e = (end != null && !end.isBlank()) ? end : "Devam Ediyor";
        return s + " - " + e;
    }
}
