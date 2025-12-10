package com.cvbuilder.external;

import com.cvbuilder.dto.OptimizedCvItem;
import com.cvbuilder.dto.UserCertificateDTO;
import com.cvbuilder.dto.UserEducationDTO;
import com.cvbuilder.dto.UserLanguageDTO;
import com.cvbuilder.dto.UserProjectDTO;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.UserProfile;
import com.cvbuilder.entity.UserSkill;
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
 // 2) TAILORED SUMMARY (ÇOKLU VERSİYON)
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

     String jobText = safe(jobContext); // istersen ilanda geçen kelimelere göre de oyna

     List<String> summaries = new ArrayList<>();

     // 1) Klasik / Kurumsal
     summaries.add(String.format(
             "%s alanında güçlü bir teknik altyapıya sahip, sonuç odaklı bir yazılım geliştiricisiyim. " +
             "Özellikle %s konularındaki deneyimimle, ölçeklenebilir ve sürdürülebilir uygulamalar geliştirmeye odaklanıyorum. " +
             "Hedefim, yer alacağım ekipte hem teknik kaliteyi hem de iş değerini artıran projelerde aktif rol almak.",
             userTitle, userSkills
     ));

     // 2) Sonuç & etki odaklı
     summaries.add(String.format(
             "%s rolünde, %s teknolojilerini kullanarak performans, güvenilirlik ve kullanıcı deneyimini merkeze alan çözümler üretiyorum. " +
             "Kod kalitesi, clean code prensipleri ve test odaklı geliştirme yaklaşımlarını benimseyerek ekiplerin daha hızlı ve hatasız teslimat yapmasına katkı sağlıyorum.",
             userTitle, userSkills
     ));

     // 3) Öğrenme & gelişim odaklı
     summaries.add(String.format(
             "%s olarak, sürekli öğrenme ve kendini geliştirme kültürünü benimsemiş bir geliştiriciyim. " +
             "%s başta olmak üzere yeni teknolojileri yakından takip ediyor, bunları gerçek projelerde uygulayarak hem kişisel hem de ekip seviyesinde gelişim sağlamayı amaçlıyorum.",
             userTitle, userSkills
     ));

     // 4) Ekip & iletişim odaklı
     summaries.add(String.format(
             "%s pozisyonunda, teknik yetkinliğimin yanı sıra ekip içi iletişim ve iş birliğine önem veriyorum. " +
             "%s teknolojilerini kullanarak geliştirilen projelerde, analitik düşünme becerim ve güçlü problem çözme yaklaşımım ile ekip hedeflerine katkı sunmayı hedefliyorum.",
             userTitle, userSkills
     ));

     // 5) İlan / şirket vizyonu ile bağlayan (jobContext varsa)
     summaries.add(String.format(
             "%s olarak, şirketinizin vizyonu ve hedefleriyle uyumlu şekilde, %s alanındaki deneyimimi gerçek iş problemlerini çözen projelere dönüştürmek istiyorum. " +
             "İlanınızda belirtilen sorumluluklara hızlı adapte olarak, hem teknik hem de iş süreçlerine değer katmayı hedefliyorum.",
             userTitle, userSkills
     ));

     return summaries;
 }

 // Eski metodu BOZMADAN, ilk metni döndürsün
 public String generateTailoredSummary(UserProfile profile, String jobContext) {
     List<String> list = generateTailoredSummaries(profile, jobContext);
     return list.isEmpty() ? "" : list.get(0);
 }


    // =========================================================
    // 3) DENEYİMLERİ OPTİMİZE EDEN METOT (EXPERIENCE SEKSİYONU)
    // =========================================================
    public List<OptimizedCvItem> optimizeExperiences(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getExperiences() == null || profile.getExperiences().isEmpty()) {
            return Collections.emptyList();
        }

        String requiredSkills = (job != null && job.getRequiredSkills() != null)
                ? job.getRequiredSkills()
                : "";

        return profile.getExperiences().stream()
                .map(exp -> {
                    String dateRange = formatDateRange(exp.getStartDate(), exp.getEndDate());
                    String originalDesc = safe(exp.getDescription()); // Örn: "java, kotlin"

                    List<String> bulletPoints = new ArrayList<>();

                    // 1. ADIM: Girdi "anahtar kelime" formatında mı? (İçinde virgül var mı veya çok mu kısa?)
                    if (originalDesc.contains(",") || originalDesc.length() < 50) {
                        // Anahtar kelimeleri cümlelere dönüştür
                        List<String> generatedBullets = generateSentencesFromKeywords(originalDesc);
                        bulletPoints.addAll(generatedBullets);
                    } else if (!originalDesc.isEmpty()) {
                        // Kullanıcı zaten uzun bir cümle yazmışsa olduğu gibi koru
                        bulletPoints.add(originalDesc);
                    }

                    // 2. ADIM: Eğer yukarıdan yeterli madde çıkmadıysa veya boşsa Standart Dolgu (Fallback) ekle
                    if (bulletPoints.isEmpty()) {
                        bulletPoints.add("Backend geliştirme süreçlerinde aktif rol aldım ve iş gereksinimlerine uygun çözümler ürettim.");
                    }

                    // 3. ADIM: İlanla ilgili (Job Posting) ekstra madde ekle
                    if (!requiredSkills.isEmpty()) {
                        bulletPoints.add("İlan kapsamında belirtilen " + requiredSkills + " teknolojilerini projelere entegre ederek verimliliği artırdım.");
                    } else {
                        bulletPoints.add("Kod kalitesi, performans ve güvenliği dikkate alarak geliştirme yaparken, birim testleri (Unit Test) süreçlerine katkı sağladım.");
                    }

                    // 4. ADIM: Genel kapanış maddesi
                    bulletPoints.add("Agile/Scrum metodolojileriyle çalışan ekip içinde sprint hedeflerinin zamanında tamamlanmasına destek oldum.");

                    return new OptimizedCvItem(
                            safe(exp.getPosition()),
                            safe(exp.getCompany()),
                            dateRange,
                            bulletPoints
                    );
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // YENİ HELPER METOT: Keyword -> Cümle Dönüştürücü
    // =========================================================
    private List<String> generateSentencesFromKeywords(String rawKeywords) {
        if (rawKeywords == null || rawKeywords.isBlank()) return new ArrayList<>();

        List<String> sentences = new ArrayList<>();
        String[] keys = rawKeywords.split(",");

        for (String key : keys) {
            String cleanKey = key.trim();
            if (cleanKey.isEmpty()) continue;

            // Teknolojiye göre özel cümle seçimi (Case Insensitive)
            String lowerKey = cleanKey.toLowerCase();

            if (lowerKey.contains("java") || lowerKey.contains("spring")) {
                sentences.add("**" + cleanKey + "** ekosistemi kullanılarak ölçeklenebilir, güvenli ve yüksek performanslı RESTful API mimarileri geliştirildi.");
            }
            else if (lowerKey.contains("kotlin")) {
                sentences.add("**" + cleanKey + "** ile modern, null-safe ve sürdürülebilir kod yapıları oluşturularak backend servisleri modernize edildi.");
            }
            else if (lowerKey.contains("sql") || lowerKey.contains("database") || lowerKey.contains("postgres") || lowerKey.contains("mysql")) {
                sentences.add("**" + cleanKey + "** üzerinde karmaşık sorgular optimize edildi ve veri tabanı yanıt sürelerinde iyileştirme sağlandı.");
            }
            else if (lowerKey.contains("docker") || lowerKey.contains("kubernetes") || lowerKey.contains("k8s")) {
                sentences.add("**" + cleanKey + "** teknolojisi ile konteynerizasyon süreçleri yönetildi ve CI/CD süreçlerine katkı sağlandı.");
            }
            else if (lowerKey.contains("aws") || lowerKey.contains("cloud") || lowerKey.contains("azure")) {
                sentences.add("**" + cleanKey + "** bulut servisleri kullanılarak sunucusuz (serverless) mimariler ve mikroservis yapıları kurgulandı.");
            }
            else if (lowerKey.contains("test") || lowerKey.contains("junit")) {
                sentences.add("**" + cleanKey + "** ile kapsamlı birim test senaryoları yazılarak yazılımın hata oranı minimize edildi.");
            }
            else {
                // Bilinmeyen bir teknoloji ise genel şablon
                sentences.add("**" + cleanKey + "** teknolojisi proje gereksinimlerine uygun şekilde entegre edilerek geliştirme süreçlerinde aktif kullanıldı.");
            }
        }
        return sentences;
    }

    // =========================================================
    // 4) PROJELERİ OPTİMİZE EDEN METOT (PROJECTS SEKSİYONU)
    // =========================================================
    public List<OptimizedCvItem> optimizeProjects(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getProjects() == null || profile.getProjects().isEmpty()) {
            return Collections.emptyList();
        }

        return profile.getProjects().stream()
                .map(project -> {

                    String startDate = formatLocalDate(project.getStartDate());
                    String endDate;

                    if (Boolean.TRUE.equals(project.getIsOngoing())) {
                        endDate = "Present";
                    } else {
                        endDate = formatLocalDate(project.getEndDate());
                    }

                    String dateRange = startDate.isEmpty()
                            ? ""
                            : (endDate == null || endDate.isEmpty()
                            ? startDate
                            : startDate + " - " + endDate);

                    // PROJECTS altında gösterilecek maddeler
                    List<String> descriptions = List.of(
                            "Proje geliştirme süreçlerinde aktif rol aldım ve gereksinimlere uygun fonksiyonel modüller geliştirdim.",
                            "Teknik çözümler üreterek projenin hedeflerine ve zaman planına uygun şekilde ilerlemesini sağladım.",
                            "Ekip içi iş birliği ve düzenli geribildirimlerle projenin başarıyla tamamlanmasına katkıda bulundum."
                    );

                    return new OptimizedCvItem(
                            safe(project.getProjectName()), // Örn: FRONTEND GELİŞTİRME
                            "Personal Project",
                            dateRange,
                            descriptions
                    );
                })
                .collect(Collectors.toList());
    }

    // ---- LocalDate format helper (Entity tarafı LocalDate ise) ----
    private String formatLocalDate(LocalDate date) {
        if (date == null) return "";
        return date.format(DATE_FORMATTER);
    }

    // ---- String overload (bizde String tarih olduğu için) ----
    private String formatLocalDate(String date) {
        return date != null ? date : "";
    }

    // =========================================================
    // 5) USER PROJECT'LERİ OPTİMİZE EDEN METOT (DTO için)
    // =========================================================
    public List<UserProjectDTO> optimizeUserProjects(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getProjects() == null || profile.getProjects().isEmpty()) {
            return Collections.emptyList();
        }

        return profile.getProjects().stream()
                .map(project -> UserProjectDTO.builder()
                        .id(project.getId())
                        .projectName(safe(project.getProjectName()))
                        .startDate(project.getStartDate())
                        .endDate(project.getEndDate())
                        .isOngoing(project.getIsOngoing())
                        .build())
                .sorted((p1, p2) -> {
                    // Devam eden projeler öne gelsin
                    if (Boolean.TRUE.equals(p1.getIsOngoing()) && !Boolean.TRUE.equals(p2.getIsOngoing())) {
                        return -1;
                    }
                    if (!Boolean.TRUE.equals(p1.getIsOngoing()) && Boolean.TRUE.equals(p2.getIsOngoing())) {
                        return 1;
                    }

                    // Başlangıç yılına göre sırala (yeni -> eski)
                    if (p1.getStartDate() != null && p2.getStartDate() != null) {
                        return p2.getStartDate().compareTo(p1.getStartDate());
                    } else if (p1.getStartDate() != null) {
                        return -1;
                    } else if (p2.getStartDate() != null) {
                        return 1;
                    }

                    // Son çare: isme göre sırala
                    return p1.getProjectName().compareToIgnoreCase(p2.getProjectName());
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // 6) DİL BİLGİLERİNİ OPTİMİZE EDEN METOT
    // =========================================================
    public List<UserLanguageDTO> optimizeLanguages(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getLanguages() == null || profile.getLanguages().isEmpty()) {
            return Collections.emptyList();
        }

        String jobDescription = (job != null && job.getDescription() != null)
                ? job.getDescription().toLowerCase()
                : "";
        String jobRequiredSkills = (job != null && job.getRequiredSkills() != null)
                ? job.getRequiredSkills().toLowerCase()
                : "";

        return profile.getLanguages().stream()
                .map(lang -> UserLanguageDTO.builder()
                        .id(lang.getId())
                        .language(safe(lang.getLanguage()))
                        .level(safe(lang.getLevel()))
                        .build())
                .sorted((l1, l2) -> {
                    boolean l1IsEnglish = isEnglish(l1.getLanguage());
                    boolean l2IsEnglish = isEnglish(l2.getLanguage());
                    if (l1IsEnglish && !l2IsEnglish) return -1;
                    if (!l1IsEnglish && l2IsEnglish) return 1;

                    boolean l1InJob = jobDescription.contains(l1.getLanguage().toLowerCase()) ||
                            jobRequiredSkills.contains(l1.getLanguage().toLowerCase());
                    boolean l2InJob = jobDescription.contains(l2.getLanguage().toLowerCase()) ||
                            jobRequiredSkills.contains(l2.getLanguage().toLowerCase());
                    if (l1InJob && !l2InJob) return -1;
                    if (!l1InJob && l2InJob) return 1;

                    return Integer.compare(
                            getLanguageLevelPriority(l2.getLevel()),
                            getLanguageLevelPriority(l1.getLevel())
                    );
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // 7) SERTİFİKA BİLGİLERİNİ OPTİMİZE EDEN METOT
    // =========================================================
    public List<UserCertificateDTO> optimizeCertificates(UserProfile profile, JobPosting job) {
        if (profile == null || profile.getCertificates() == null || profile.getCertificates().isEmpty()) {
            return Collections.emptyList();
        }

        String jobDescription = (job != null && job.getDescription() != null)
                ? job.getDescription().toLowerCase()
                : "";
        String jobRequiredSkills = (job != null && job.getRequiredSkills() != null)
                ? job.getRequiredSkills().toLowerCase()
                : "";

        return profile.getCertificates().stream()
                .map(cert -> UserCertificateDTO.builder()
                        .id(cert.getId())
                        .name(safe(cert.getName()))
                        .issuer(safe(cert.getIssuer()))
                        .date(safe(cert.getDate()))
                        .url(safe(cert.getUrl()))
                        .build())
                .sorted((c1, c2) -> {
                    boolean c1InJob = jobDescription.contains(c1.getName().toLowerCase()) ||
                            jobRequiredSkills.contains(c1.getName().toLowerCase());
                    boolean c2InJob = jobDescription.contains(c2.getName().toLowerCase()) ||
                            jobRequiredSkills.contains(c2.getName().toLowerCase());
                    if (c1InJob && !c2InJob) return -1;
                    if (!c1InJob && c2InJob) return 1;

                    if (c1.getDate() != null && c2.getDate() != null) {
                        return c2.getDate().compareTo(c1.getDate());
                    } else if (c1.getDate() != null) {
                        return -1;
                    } else if (c2.getDate() != null) {
                        return 1;
                    }

                    return c1.getName().compareToIgnoreCase(c2.getName());
                })
                .collect(Collectors.toList());
    }

    // =========================================================
    // 8) EĞİTİM BİLGİLERİNİ OPTİMİZE EDEN METOT
    // =========================================================
    public List<UserEducationDTO> optimizeEducation(UserProfile profile, JobPosting job) {
        if (profile == null) {
            return Collections.emptyList();
        }

        boolean hasEducation =
                (profile.getEducationSchool() != null && !profile.getEducationSchool().isBlank());

        if (!hasEducation) {
            return Collections.emptyList();
        }

        String start = profile.getEducationStartYear();
        String end = (profile.getEducationEndYear() != null && !profile.getEducationEndYear().isBlank())
                ? profile.getEducationEndYear()
                : "Present";

        UserEducationDTO dto = UserEducationDTO.builder()
                .university(safe(profile.getEducationSchool()))
                .startYear(safe(start))
                .graduationYear(safe(end))
                .build();

        return List.of(dto);
    }

    // =========================================================
    // 9) YARDIMCI METOTLAR
    // =========================================================
    private String safe(String text) {
        return text != null ? text : "";
    }

    private boolean isEnglish(String language) {
        if (language == null) return false;
        String lowerLang = language.toLowerCase();
        return lowerLang.contains("ingilizce") ||
                lowerLang.contains("english") ||
                lowerLang.equals("en") ||
                lowerLang.equals("ing");
    }

    private int getLanguageLevelPriority(String level) {
        if (level == null) return 0;
        String upperLevel = level.toUpperCase();
        switch (upperLevel) {
            case "NATIVE":
                return 7;
            case "C2":
                return 6;
            case "C1":
                return 5;
            case "B2":
                return 4;
            case "B1":
                return 3;
            case "A2":
                return 2;
            case "A1":
                return 1;
            default:
                return 0;
        }
    }

    private String formatDateRange(String startDate, String endDate) {
        if (startDate == null && endDate == null) return "";

        StringBuilder sb = new StringBuilder();
        if (startDate != null) {
            sb.append(startDate);
        }

        sb.append(" - ");

        if (endDate != null && !endDate.isEmpty()) {
            sb.append(endDate);
        } else {
            sb.append("Devam Ediyor");
        }

        return sb.toString();
    }
}
