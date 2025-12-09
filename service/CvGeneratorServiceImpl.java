package com.cvbuilder.service;

import com.cvbuilder.dto.GeneratedCvResponse;
import com.cvbuilder.dto.OptimizedCvItem;
import com.cvbuilder.dto.UserCertificateDTO;
import com.cvbuilder.dto.UserEducationDTO;
import com.cvbuilder.dto.UserLanguageDTO;
import com.cvbuilder.dto.UserProjectDTO;
import com.cvbuilder.entity.GeneratedCv;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.User;
import com.cvbuilder.entity.UserProfile;
import com.cvbuilder.entity.UserSkill;
import com.cvbuilder.external.AiClient;
import com.cvbuilder.repository.GeneratedCvRepository;
import com.cvbuilder.repository.JobPostingRepository;
import com.cvbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CvGeneratorServiceImpl implements CvGeneratorService {

    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final GeneratedCvRepository generatedCvRepository;
    private final AiClient aiClient;

    @Override
    @Transactional
    public GeneratedCvResponse generateCvForJob(Long userId, Long jobPostingId) {

        // 1) Kullanıcı ve ilanı DB'den çek
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        JobPosting job = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Job posting not found with id: " + jobPostingId));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            throw new RuntimeException("User profile not found for user id: " + userId);
        }

        // 2) Kullanıcının skill listesi → String listesine çevir
        List<String> userSkills = extractUserSkillNames(profile);

        // 3) İlanın skill anahtar kelimeleri ve Sıralama
        String jobRequiredSkills = job.getRequiredSkills();
        List<String> prioritizedSkills = prioritizeSkills(userSkills, jobRequiredSkills);

        // 4) AI için iş bağlamını hazırla
        String jobContext = buildJobContext(job);

        // 5) 🔥 AI ile "Tailored Summary" Üret
        String tailoredSummary = aiClient.generateTailoredSummary(profile, jobContext);

        // 6) 🔥 Deneyim, Proje, Dil, Sertifika, Eğitim Optimizasyonu
        List<OptimizedCvItem> optExperiences = aiClient.optimizeExperiences(profile, job);
        List<OptimizedCvItem> optProjects = aiClient.optimizeProjects(profile, job);
        List<UserProjectDTO> optUserProjects = aiClient.optimizeUserProjects(profile, job);
        List<UserLanguageDTO> optLanguages = aiClient.optimizeLanguages(profile, job);
        List<UserCertificateDTO> optCertificates = aiClient.optimizeCertificates(profile, job);
        List<UserEducationDTO> optEducation = aiClient.optimizeEducation(profile, job);

        // 7) Veritabanına kaydedilecek tam CV içeriğini oluştur
        String fullContentToSave = buildAtsFriendlyContent(
                user, profile, tailoredSummary, prioritizedSkills,
                optExperiences, optProjects, optLanguages, optCertificates, optEducation
        );

        GeneratedCv generatedCv = GeneratedCv.builder()
                .user(user)
                .jobPosting(job)
                .templateName("ATS_SMART_FULL")
                .content(fullContentToSave)
                .build();

        generatedCvRepository.save(generatedCv);

        // 8) Frontend'e dönecek Response (DTO)
        GeneratedCvResponse resp = new GeneratedCvResponse();
        resp.setCvId(generatedCv.getId());
        resp.setTemplateName(generatedCv.getTemplateName());

        resp.setTailoredSummary(tailoredSummary);
        resp.setPrioritizedSkills(prioritizedSkills);
        resp.setOptimizedExperiences(optExperiences);
        resp.setOptimizedProjects(optProjects);
        resp.setOptimizedUserProjects(optUserProjects);
        resp.setOptimizedLanguages(optLanguages);
        resp.setOptimizedCertificates(optCertificates);
        resp.setOptimizedEducation(optEducation);

        return resp;
    }

    // ================== YARDIMCI METOTLAR ==================

    private List<String> extractUserSkillNames(UserProfile profile) {
        if (profile.getSkills() == null || profile.getSkills().isEmpty()) {
            return Collections.emptyList();
        }
        List<String> skillNames = new ArrayList<>();
        for (UserSkill s : profile.getSkills()) {
            if (s.getSkillName() != null && !s.getSkillName().isBlank()) {
                skillNames.add(s.getSkillName().trim());
            }
        }
        return skillNames;
    }

    private String buildJobContext(JobPosting job) {
        StringBuilder sb = new StringBuilder();
        if (job.getAnalysisReport() != null && !job.getAnalysisReport().isBlank()) {
            sb.append(job.getAnalysisReport()).append("\n\n");
        }
        if (job.getResponsibilities() != null && !job.getResponsibilities().isBlank()) {
            sb.append("Sorumluluklar: ").append(job.getResponsibilities()).append("\n\n");
        }
        if (job.getRequiredSkills() != null && !job.getRequiredSkills().isBlank()) {
            sb.append("Gereken Yetkinlikler: ").append(job.getRequiredSkills()).append("\n");
        }
        return sb.toString();
    }

    private List<String> prioritizeSkills(List<String> userSkills, String jobKeywordsString) {
        if (userSkills == null || userSkills.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> jobKeywords = new ArrayList<>();
        if (jobKeywordsString != null && !jobKeywordsString.isBlank()) {
            jobKeywords = Arrays.asList(jobKeywordsString.split(","));
        }
        List<String> prioritized = new ArrayList<>();
        List<String> others = new ArrayList<>();

        for (String skill : userSkills) {
            if (skill == null || skill.isBlank()) continue;
            boolean isMatch = jobKeywords.stream()
                    .anyMatch(k -> k != null && k.trim().equalsIgnoreCase(skill.trim()));

            if (isMatch) prioritized.add(skill.trim());
            else others.add(skill.trim());
        }
        prioritized.addAll(others);
        return prioritized;
    }

    private String buildAtsFriendlyContent(User user,
                                           UserProfile profile,
                                           String tailoredSummary,
                                           List<String> prioritizedSkills,
                                           List<OptimizedCvItem> optExperiences,
                                           List<OptimizedCvItem> optProjects,
                                           List<UserLanguageDTO> optLanguages,
                                           List<UserCertificateDTO> optCertificates,
                                           List<UserEducationDTO> optEducation) {

        StringBuilder sb = new StringBuilder();

        // HEADER
        sb.append(user.getFullName() != null ? user.getFullName().toUpperCase() : "").append("\n");
        if (profile.getTitle() != null && !profile.getTitle().isBlank()) {
            sb.append(profile.getTitle()).append("\n");
        }
        sb.append((user.getEmail() != null ? user.getEmail() : "") + " | " +
                  (user.getPhone() != null ? user.getPhone() : "") + " | " +
                  (user.getLocation() != null ? user.getLocation() : "")).append("\n");

        // 🔗 Linkedin & GitHub
        if ((profile.getLinkedinUrl() != null && !profile.getLinkedinUrl().isBlank()) ||
            (profile.getGithubUrl() != null && !profile.getGithubUrl().isBlank()) ||
            (profile.getWebsiteUrl() != null && !profile.getWebsiteUrl().isBlank())) {

            sb.append("Links: ");
            boolean first = true;

            if (profile.getLinkedinUrl() != null && !profile.getLinkedinUrl().isBlank()) {
                sb.append("LinkedIn: ").append(profile.getLinkedinUrl());
                first = false;
            }
            if (profile.getGithubUrl() != null && !profile.getGithubUrl().isBlank()) {
                if (!first) sb.append(" | ");
                sb.append("GitHub: ").append(profile.getGithubUrl());
                first = false;
            }
            if (profile.getWebsiteUrl() != null && !profile.getWebsiteUrl().isBlank()) {
                if (!first) sb.append(" | ");
                sb.append("Website: ").append(profile.getWebsiteUrl());
            }
            sb.append("\n");
        }

        sb.append("\n");

        // SUMMARY
        sb.append("SUMMARY\n");
        sb.append(tailoredSummary != null ? tailoredSummary : "").append("\n\n");

        // CORE SKILLS
        sb.append("CORE SKILLS\n");
        for (String skill : prioritizedSkills) {
            sb.append("- ").append(skill).append("\n");
        }
        sb.append("\n");

        // WORK EXPERIENCE
        sb.append("WORK EXPERIENCE\n");
        if (optExperiences != null) {
            for (OptimizedCvItem exp : optExperiences) {
                sb.append(exp.getTitle()).append(" at ").append(exp.getSubtitle()).append("\n");
                sb.append(exp.getDate()).append("\n");
                for (String desc : exp.getDescription()) {
                    sb.append("* ").append(desc).append("\n");
                }
                sb.append("\n");
            }
        }

        // PROJECTS
        if (optProjects != null && !optProjects.isEmpty()) {
            sb.append("PROJECTS\n");
            for (OptimizedCvItem p : optProjects) {
                sb.append(p.getTitle());
                if (p.getSubtitle() != null && !p.getSubtitle().isBlank()) {
                    sb.append(" - ").append(p.getSubtitle());
                }
                sb.append("\n");
                if (p.getDate() != null && !p.getDate().isBlank()) {
                    sb.append(p.getDate()).append("\n");
                }
                if (p.getDescription() != null) {
                    for (String d : p.getDescription()) {
                        sb.append("* ").append(d).append("\n");
                    }
                }
                sb.append("\n");
            }
        }

        // LANGUAGES
        if (optLanguages != null && !optLanguages.isEmpty()) {
            sb.append("LANGUAGES\n");
            for (UserLanguageDTO lang : optLanguages) {
                sb.append("- ").append(lang.getLanguage())
                  .append(" (").append(lang.getLevel()).append(")\n");
            }
            sb.append("\n");
        }

        // CERTIFICATES
        if (optCertificates != null && !optCertificates.isEmpty()) {
            sb.append("CERTIFICATES\n");
            for (UserCertificateDTO cert : optCertificates) {
                sb.append("- ").append(cert.getName());
                if (cert.getIssuer() != null && !cert.getIssuer().isBlank()) {
                    sb.append(" - ").append(cert.getIssuer());
                }
                if (cert.getDate() != null && !cert.getDate().isBlank()) {
                    sb.append(" (").append(cert.getDate()).append(")");
                }
                sb.append("\n");
            }
            sb.append("\n");
        }

        // 🔥 EDUCATION – SADELEŞTİRİLMİŞ
        if (optEducation != null && !optEducation.isEmpty()) {
            sb.append("EDUCATION\n");
            for (UserEducationDTO edu : optEducation) {

                // Sadece üniversite adı
                sb.append(edu.getUniversity()).append("\n");

                // Yıl aralığı
                if (edu.getStartYear() != null && !edu.getStartYear().isBlank()) {
                    sb.append(edu.getStartYear())
                      .append(" - ")
                      .append(edu.getGraduationYear() != null && !edu.getGraduationYear().isBlank()
                              ? edu.getGraduationYear()
                              : "Present");
                }
                sb.append("\n\n");
            }
        } else if (profile.getEducationSchool() != null && !profile.getEducationSchool().isBlank()) {
            // Fallback – yine sade: sadece okul + yıl
            sb.append("EDUCATION\n");
            sb.append(profile.getEducationSchool()).append("\n");

            if (profile.getEducationStartYear() != null && !profile.getEducationStartYear().isBlank()) {
                sb.append(profile.getEducationStartYear())
                  .append(" - ")
                  .append(profile.getEducationEndYear() != null && !profile.getEducationEndYear().isBlank()
                          ? profile.getEducationEndYear()
                          : "Present");
            }
            sb.append("\n\n");
        }

        return sb.toString();
    }
}
