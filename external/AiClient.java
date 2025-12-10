package com.cvbuilder.external;

import com.cvbuilder.dto.OptimizedCvItem;
import com.cvbuilder.dto.UserCertificateDTO;
import com.cvbuilder.dto.UserEducationDTO;
import com.cvbuilder.dto.UserLanguageDTO;
import com.cvbuilder.dto.UserProjectDTO;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.UserProfile;
import com.cvbuilder.entity.UserSkill;
import com.cvbuilder.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AiClient {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM/yyyy");
    
    private final TranslationService translationService;

    @Autowired
    public AiClient(TranslationService translationService) {
        this.translationService = translationService;
    }

    // =========================================================
    // 1) DEBUG / HAM TEXT CV
    // =========================================================
    public String generateCv(UserProfile profile, JobPosting jobPosting) {
        String userName = (profile != null && profile.getUser() != null)
                ? safe(profile.getUser().getFullName())
                : "Ad Soyad Belirtilmemiş";
        return "CV GENERATION DEBUG FOR: " + userName;
    }

    // =========================================================
    // 2) TAILORED SUMMARY
    // =========================================================
    public List<String> generateTailoredSummaries(UserProfile profile, String jobContext) {
        String userTitle = profile != null ? safe(profile.getTitle()) : "Yazılım Geliştirici";
        String userSkills = "";
        if (profile != null && profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            userSkills = profile.getSkills().stream()
                    .map(UserSkill::getSkillName)
                    .filter(s -> s != null && !s.isBlank())
                    .limit(5)
                    .collect(Collectors.joining(", "));
        }
        if (userSkills.isEmpty()) userSkills = "güncel yazılım teknolojileri";

        List<String> summaries = new ArrayList<>();
        summaries.add(String.format("%s alanında güçlü bir teknik altyapıya sahip, sonuç odaklı bir yazılım geliştiricisiyim. Özellikle %s konularındaki deneyimimle, ölçeklenebilir ve sürdürülebilir uygulamalar geliştirmeye odaklanıyorum.", userTitle, userSkills));
        summaries.add(String.format("%s rolünde, %s teknolojilerini kullanarak performans, güvenilirlik ve kullanıcı deneyimini merkeze alan çözümler üretiyorum.", userTitle, userSkills));
        summaries.add(String.format("%s olarak, sürekli öğrenme ve kendini geliştirme kültürünü benimsemiş bir geliştiriciyim. %s başta olmak üzere yeni teknolojileri yakından takip ediyorum.", userTitle, userSkills));
        return summaries;
    }

    public String generateTailoredSummary(UserProfile profile, String jobContext) {
        List<String> list = generateTailoredSummaries(profile, jobContext);
        return list.isEmpty() ? "" : list.get(0);
    }

    // =========================================================
    // 3) OPTIMIZE EXPERIENCES (HİBRİT YAPI)
    // =========================================================
    public List<OptimizedCvItem> optimizeExperiences(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getExperiences() == null || profile.getExperiences().isEmpty()) {
            return Collections.emptyList();
        }

        String requiredSkills = (job != null && job.getRequiredSkills() != null) ? job.getRequiredSkills() : "";

        return profile.getExperiences().stream()
                .map(exp -> {
                    String dateRange = formatDateRange(exp.getStartDate(), exp.getEndDate());
                    String originalDesc = safe(exp.getDescription());

                    List<String> bulletPoints = new ArrayList<>();

                    // Eğer description "Java, Spring" gibi keyword halindeyse HİBRİT metodu çağır
                    if (originalDesc.contains(",") || (originalDesc.length() > 0 && originalDesc.length() < 50)) {
                        List<String> generated = generateSentencesFromKeywords(originalDesc);
                        bulletPoints.addAll(generated);
                    } else if (!originalDesc.isEmpty()) {
                        bulletPoints.add(originalDesc);
                    }

                    if (bulletPoints.isEmpty()) {
                        bulletPoints.add("Backend geliştirme süreçlerinde aktif rol aldım.");
                    }
                    if (!requiredSkills.isEmpty()) {
                        bulletPoints.add("İlan kapsamında belirtilen " + requiredSkills + " teknolojilerini projelere entegre ederek verimliliği artırdım.");
                    }
                    bulletPoints.add("Agile/Scrum metodolojileriyle çalışan ekip içinde sprint hedeflerinin zamanında tamamlanmasına destek oldum.");

                    return new OptimizedCvItem(safe(exp.getPosition()), safe(exp.getCompany()), dateRange, bulletPoints);
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // 4) 🔥 DÜZELTİLEN KISIM: OPTIMIZE PROJECTS (HİBRİT YAPI EKLENDİ)
    // =========================================================
    public List<OptimizedCvItem> optimizeProjects(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getProjects() == null || profile.getProjects().isEmpty()) {
            return Collections.emptyList();
        }

        return profile.getProjects().stream()
                .map(project -> {
                    String dateRange = formatDateRange(project.getStartDate(), project.getIsOngoing() ? null : project.getEndDate());
                    
                    // 1. Kullanıcının girdiği açıklama
                    String originalDesc = safe(project.getDescription());
                    List<String> bulletPoints = new ArrayList<>();

                    // 2. Mantık: Virgül varsa veya kısaysa AI/Keyword motoruna sok
                    if (originalDesc.contains(",") || (originalDesc.length() > 0 && originalDesc.length() < 50)) {
                        // 🔥 HİBRİT MOTORU ÇAĞIRIYORUZ
                        List<String> generated = generateSentencesFromKeywords(originalDesc);
                        bulletPoints.addAll(generated);
                    } else if (!originalDesc.isEmpty()) {
                        // Kullanıcı zaten uzun cümle yazmışsa olduğu gibi koru
                        bulletPoints.add(originalDesc);
                    }

                    // 3. Fallback: Standart metinler
                    if (bulletPoints.isEmpty()) {
                        bulletPoints.add("Proje geliştirme süreçlerinde aktif rol aldım ve gereksinimlere uygun fonksiyonel modüller geliştirdim.");
                        bulletPoints.add("Teknik çözümler üreterek projenin hedeflerine ve zaman planına uygun şekilde ilerlemesini sağladım.");
                        bulletPoints.add("Ekip içi iş birliği ve düzenli geribildirimlerle projenin başarıyla tamamlanmasına katkıda bulundum.");
                    }

                    return new OptimizedCvItem(
                            safe(project.getProjectName()), 
                            "Personal Project", 
                            dateRange, 
                            bulletPoints
                    );
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // 5) 🔥 DÜZELTİLEN KISIM: USER PROJECT DTO (Description Eklendi)
    // =========================================================
    public List<UserProjectDTO> optimizeUserProjects(UserProfile profile, JobPosting job) {
         if (profile == null || profile.getProjects() == null) return Collections.emptyList();
         
         return profile.getProjects().stream()
                 .map(p -> UserProjectDTO.builder()
                         .id(p.getId())
                         .projectName(safe(p.getProjectName()))
                         .startDate(p.getStartDate())
                         .endDate(p.getEndDate())
                         .isOngoing(p.getIsOngoing())
                         .description(safe(p.getDescription())) // 🔥 BURASI EKSİKTİ, EKLENDİ
                         .build())
                 .collect(Collectors.toList());
    }

    // =========================================================
    // 🔥 HİBRİT MOTOR: ÖNCE LOCAL KONTROL, YOKSA API
    // =========================================================
    private List<String> generateSentencesFromKeywords(String rawKeywords) {
        if (rawKeywords == null || rawKeywords.isBlank()) return new ArrayList<>();

        List<String> finalSentences = new ArrayList<>();
        List<String> unknownKeywords = new ArrayList<>(); // API'ye sorulacaklar

        String[] keys = rawKeywords.split("[,;\\n]");
        System.out.println("🔍 Kelime Analizi: " + rawKeywords);

        for (String key : keys) {
            String cleanKey = key.trim();
            if (cleanKey.isEmpty()) continue;

            // 1. ADIM: Önce Kod İçindeki Listeye Bak (0ms Gecikme)
            String hardcoded = checkHardcodedList(cleanKey);
            if (hardcoded != null) {
                System.out.println("✅ LOCAL BULUNDU: " + cleanKey);
                finalSentences.add(hardcoded);
            } else {
                System.out.println("❓ BİLİNMİYOR (API'ye Sorulacak): " + cleanKey);
                unknownKeywords.add(cleanKey);
            }
        }

        // 2. ADIM: Bilinmeyenleri TOPLU (Batch) Olarak AI'ya Sor
        if (!unknownKeywords.isEmpty()) {
            try {
                String keywordsString = String.join(", ", unknownKeywords);
                String prompt = String.format(
                    "Aşağıdaki teknoloji listesi için Türkçe CV (Özgeçmiş) deneyim maddeleri yaz.\n" +
                    "Teknolojiler: [%s]\n" +
                    "Kurallar:\n" +
                    "1. Her teknoloji için SADECE 1 cümle yaz.\n" +
                    "2. Cümleler 'geliştirildi, tasarlandı, kullanıldı' gibi profesyonel ve edilgen yapıda olsun.\n" +
                    "3. Sadece maddeleri ver, başka hiçbir açıklama yapma.\n" +
                    "4. Teknolojinin adını **kalın** yap.", 
                    keywordsString
                );

                String aiResponse = translationService.generateContent(prompt);
                
                if (aiResponse != null && !aiResponse.isBlank()) {
                    String[] lines = aiResponse.split("\n");
                    for (String line : lines) {
                        String cleanLine = line.replaceAll("^[-*•]\\s*", "").trim();
                        if (!cleanLine.isEmpty()) {
                            finalSentences.add(cleanLine);
                            System.out.println("🤖 API CEVABI: " + cleanLine);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ AI Hatası (Fallback Devrede): " + e.getMessage());
                for (String k : unknownKeywords) {
                    finalSentences.add("**" + k + "** teknolojisi proje gereksinimlerine uygun şekilde entegre edilerek aktif kullanıldı.");
                }
            }
        }
        return finalSentences;
    }

    private String checkHardcodedList(String key) {
        String lowerKey = key.toLowerCase();
        if (lowerKey.contains("java") || lowerKey.contains("jakarta")) return "**" + key + "** ekosistemi ile ölçeklenebilir backend mimarileri kurgulandı.";
        if (lowerKey.contains("spring")) return "**" + key + "** framework'ü kullanılarak modüler mikroservisler geliştirildi.";
        if (lowerKey.contains("react") || lowerKey.contains("vue")) return "**" + key + "** ile modern ve responsive kullanıcı arayüzleri tasarlandı.";
        if (lowerKey.contains("docker")) return "**" + key + "** ile konteynerizasyon süreçleri yönetildi.";
        if (lowerKey.contains("aws") || lowerKey.contains("azure")) return "**" + key + "** bulut servisleri kullanılarak yüksek erişilebilirliğe sahip yapılar kuruldu.";
        if (lowerKey.contains("sql") || lowerKey.contains("postgres")) return "**" + key + "** üzerinde veri modelleme ve performans optimizasyonu yapıldı.";
        return null;
    }

    public List<UserLanguageDTO> optimizeLanguages(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getLanguages() == null) return Collections.emptyList();
        return profile.getLanguages().stream().map(l -> UserLanguageDTO.builder().id(l.getId()).language(safe(l.getLanguage())).level(safe(l.getLevel())).build()).collect(Collectors.toList());
    }

    public List<UserCertificateDTO> optimizeCertificates(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getCertificates() == null) return Collections.emptyList();
        return profile.getCertificates().stream().map(c -> UserCertificateDTO.builder().id(c.getId()).name(safe(c.getName())).issuer(safe(c.getIssuer())).date(safe(c.getDate())).url(safe(c.getUrl())).build()).collect(Collectors.toList());
    }

    public List<UserEducationDTO> optimizeEducation(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getEducationSchool() == null) return Collections.emptyList();
        UserEducationDTO dto = UserEducationDTO.builder()
                .university(safe(profile.getEducationSchool()))
                .startYear(safe(profile.getEducationStartYear()))
                .graduationYear(profile.getEducationEndYear() != null ? profile.getEducationEndYear() : "Present")
                .build();
        return List.of(dto);
    }

    private String safe(String text) { return text != null ? text : ""; }
    private String formatDateRange(String start, String end) {
        if (start == null) return "";
        return start + (end != null ? " - " + end : " - Devam Ediyor");
    }
    private String formatLocalDate(LocalDate date) { return date != null ? date.format(DATE_FORMATTER) : ""; }
}