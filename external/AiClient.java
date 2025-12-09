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
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AiClient {

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
    public String generateTailoredSummary(UserProfile profile, String jobContext) {
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

        return String.format(
                "%s alanında sağlam bir teknik altyapıya sahip, sonuç odaklı biriyim. " +
                        "Özellikle %s konularındaki yetkinliğimle karmaşık problemleri çözme ve ölçeklenebilir projeler geliştirme konusunda deneyimliyim. " +
                        "Kariyer hedefim, teknik birikimimi kullanarak şirketin vizyonuna katkı sağlamak ve ekip içinde değer yaratan projelerde yer almak isterim.",
                userTitle,
                userSkills
        );
    }

    // =========================================================
    // 3) DENEYİMLERİ OPTİMİZE EDEN METOT
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
                    String originalDesc = safe(exp.getDescription());

                    List<String> bulletPoints = List.of(
                            !originalDesc.isEmpty()
                                    ? originalDesc
                                    : "Bu pozisyonda yazılım geliştirme süreçlerinde aktif rol aldım.",
                            !requiredSkills.isEmpty()
                                    ? "Proje gereksinimlerine uygun olarak " + requiredSkills + " teknolojilerini etkin şekilde kullandım."
                                    : "Modern yazılım geliştirme metodolojileri ve best-practice'lere uygun kod geliştirimi sağladım.",
                            "Çapraz fonksiyonlu ekiplerle iş birliği yaparak proje hedeflerinin zamanında tamamlanmasına katkıda bulundum."
                    );

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
    // 4) PROJELERİ OPTİMİZE EDEN METOT (OptimizedCvItem döndüren)
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

                    List<String> descriptions = List.of(
                            "Proje geliştirme süreçlerinde aktif rol aldım.",
                            "Teknik çözümler üreterek proje hedeflerine ulaşılmasına katkı sağladım.",
                            "Ekip içi iş birliği yaparak projenin başarıyla tamamlanmasını sağladım."
                    );

                    return new OptimizedCvItem(
                            safe(project.getProjectName()),
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
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");
        return date.format(formatter);
    }

    // ---- String overload (bizde String tarih olduğu için) ----
    private String formatLocalDate(String date) {
        return date != null ? date : "";
    }

    // =========================================================
    // 5) USER PROJECT'LERİ OPTİMİZE EDEN METOT (UserProjectDTO döndüren)
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
                    if (Boolean.TRUE.equals(p1.getIsOngoing()) && !Boolean.TRUE.equals(p2.getIsOngoing())) {
                        return -1;
                    }
                    if (!Boolean.TRUE.equals(p1.getIsOngoing()) && Boolean.TRUE.equals(p2.getIsOngoing())) {
                        return 1;
                    }

                    if (p1.getStartDate() != null && p2.getStartDate() != null) {
                        return p2.getStartDate().compareTo(p1.getStartDate());
                    } else if (p1.getStartDate() != null) {
                        return -1;
                    } else if (p2.getStartDate() != null) {
                        return 1;
                    }

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
    // 8) EĞİTİM BİLGİLERİNİ OPTİMİZE EDEN METOT (UserProfile’a göre)
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
                // degree / field artık kullanılmıyor
               // .degree(null)
                //.field(null)
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
