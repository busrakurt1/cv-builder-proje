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
import com.cvbuilder.entity.UserExperience;
import com.cvbuilder.external.AiClient;
import com.cvbuilder.repository.GeneratedCvRepository;
import com.cvbuilder.repository.JobPostingRepository;
import com.cvbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Slf4j
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
        log.info("🎯 CV Generation started - User: {}, Job: {}", userId, jobPostingId);

        // 1) Kullanıcı ve ilanı DB'den çek
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        JobPosting job = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Job posting not found with id: " + jobPostingId));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            throw new RuntimeException("User profile not found for user id: " + userId);
        }

        log.info("📊 Profile found - Name: {}, Skills: {}",
                user.getFullName(),
                profile.getSkills() != null ? profile.getSkills().size() : 0);

        // 2) Kullanıcının skill listesi → String listesine çevir
        List<String> userSkills = extractUserSkillNames(profile);
        log.debug("🛠️ User skills extracted: {}", userSkills);

        // 3) İlanın skill anahtar kelimeleri ve Sıralama
        String jobRequiredSkills = job.getRequiredSkills();
        List<String> prioritizedSkills = prioritizeSkills(userSkills, jobRequiredSkills);
        log.debug("📈 Prioritized skills: {}", prioritizedSkills);

        // 4) AI için iş bağlamını hazırla
        String jobContext = buildJobContext(job);
        log.debug("📝 Job context prepared (length: {})", jobContext.length());

        // 5) 🔥 AI ile "Tailored Summary" Üret
        /*String tailoredSummary = aiClient.generateTailoredSummary(profile, jobContext);
        log.info("📄 Tailored summary generated");*/
        
        List<String> tailoredSummaries = aiClient.generateTailoredSummaries(profile, jobContext);

        // 6) 🔥 Deneyim, Proje, Dil, Sertifika, Eğitim Optimizasyonu
        // Deneyimlerde artık AI kullanmıyoruz, doğrudan profil'deki description alanını kullanıyoruz
        List<OptimizedCvItem> optExperiences = aiClient.optimizeExperiences(profile, job);

        // Projeler / diller / sertifikalar için AI optimize etmeye devam ediyor
        List<OptimizedCvItem> optProjects = aiClient.optimizeProjects(profile, job);
        List<UserLanguageDTO> optLanguages = aiClient.optimizeLanguages(profile, job);
        List<UserCertificateDTO> optCertificates = aiClient.optimizeCertificates(profile, job);
        List<UserEducationDTO> optEducation = aiClient.optimizeEducation(profile, job);

        log.info("✅ AI Optimization completed - Experiences: {}, Projects: {}, Languages: {}, Certificates: {}",
                optExperiences.size(), optProjects.size(), optLanguages.size(), optCertificates.size());

        // DEBUG: Deneyimlerdeki açıklamaları kontrol et
        for (int i = 0; i < optExperiences.size(); i++) {
            OptimizedCvItem exp = optExperiences.get(i);
            log.debug("🔍 Experience {} - {} at {}", i + 1, exp.getTitle(), exp.getSubtitle());
            if (exp.getDescription() != null) {
                for (String desc : exp.getDescription()) {
                    log.debug("   - {}", desc);
                }
            }
        }

        String tailoredSummary = null;
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
        log.info("💾 CV saved to database - ID: {}", generatedCv.getId());

        // 8) Frontend'e dönecek Response (DTO)
        GeneratedCvResponse resp = new GeneratedCvResponse();
        resp.setCvId(generatedCv.getId());
        resp.setTemplateName(generatedCv.getTemplateName());
        resp.setTailoredSummary(tailoredSummary);
        resp.setPrioritizedSkills(prioritizedSkills);
        resp.setOptimizedExperiences(optExperiences);
        resp.setOptimizedProjects(optProjects);
        resp.setOptimizedLanguages(optLanguages);
        resp.setOptimizedCertificates(optCertificates);
        resp.setOptimizedEducation(optEducation);
        resp.setTailoredSummaries(tailoredSummaries);   // 🔥 EK

        log.info("✅ CV Generation completed successfully!");
        return resp;
    }

    /**
     * PROFILDEKİ DENEYİMLERİ -> OptimizedCvItem'e çevirir.
     * İş Tanımı textarea'sına ne yazdıysan, CV'de o çıkar.
     */
    private List<OptimizedCvItem> mapExperiencesFromProfile(UserProfile profile) {
        if (profile.getExperiences() == null || profile.getExperiences().isEmpty()) {
            return new ArrayList<>();
        }

        List<OptimizedCvItem> list = new ArrayList<>();

        for (UserExperience exp : profile.getExperiences()) {
            OptimizedCvItem item = new OptimizedCvItem();

            // Başlık (Pozisyon)
            item.setTitle(exp.getPosition());

            // Alt başlık: Şirket + Şehir (varsa)
            StringBuilder subtitle = new StringBuilder();
            if (exp.getCompany() != null && !exp.getCompany().isBlank()) {
                subtitle.append(exp.getCompany());
            }
            if (exp.getCity() != null && !exp.getCity().isBlank()) {
                if (subtitle.length() > 0) {
                    subtitle.append(" - ");
                }
                subtitle.append(exp.getCity());
            }
            item.setSubtitle(subtitle.toString());

            // Tarih aralığı
            StringBuilder date = new StringBuilder();
            if (exp.getStartDate() != null && !exp.getStartDate().isBlank()) {
                date.append(exp.getStartDate());
            }
            if (exp.getEndDate() != null && !exp.getEndDate().isBlank()) {
                if (date.length() > 0) {
                    date.append(" - ");
                }
                date.append(exp.getEndDate());
            }
            item.setDate(date.toString());

            // Açıklama: DB’de ne yazıyorsa onu kullan (satırlara böl)
            List<String> descList = new ArrayList<>();
            if (exp.getDescription() != null && !exp.getDescription().isBlank()) {
                String[] lines = exp.getDescription().split("\\r?\\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty()) {
                        descList.add(trimmed);
                    }
                }
            }
            item.setDescription(descList);

            list.add(item);
        }

        return list;
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

    /**
     * CV içeriğini oluştururken DÜZELTME: • işaretini kaldırmayın!
     */
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
        sb.append("=".repeat(50)).append("\n");
        sb.append("CV / RESUME\n");
        sb.append("=".repeat(50)).append("\n\n");

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

            sb.append("\n🔗 Links:\n");

            if (profile.getLinkedinUrl() != null && !profile.getLinkedinUrl().isBlank()) {
                sb.append("  • LinkedIn: ").append(profile.getLinkedinUrl()).append("\n");
            }
            if (profile.getGithubUrl() != null && !profile.getGithubUrl().isBlank()) {
                sb.append("  • GitHub: ").append(profile.getGithubUrl()).append("\n");
            }
            if (profile.getWebsiteUrl() != null && !profile.getWebsiteUrl().isBlank()) {
                sb.append("  • Website: ").append(profile.getWebsiteUrl()).append("\n");
            }
        }

        sb.append("\n").append("-".repeat(50)).append("\n\n");

        // SUMMARY
        sb.append("🎯 PROFESSIONAL SUMMARY\n");
        sb.append("-".repeat(25)).append("\n");
        sb.append(tailoredSummary != null ? tailoredSummary : "").append("\n\n");

        // CORE SKILLS
        sb.append("🛠️ TECHNICAL SKILLS\n");
        sb.append("-".repeat(20)).append("\n");
        for (String skill : prioritizedSkills) {
            sb.append("• ").append(skill).append("\n");
        }
        sb.append("\n");

        // WORK EXPERIENCE
        sb.append("💼 WORK EXPERIENCE\n");
        sb.append("-".repeat(20)).append("\n");
        if (optExperiences != null && !optExperiences.isEmpty()) {
            for (OptimizedCvItem exp : optExperiences) {
                sb.append("📌 ").append(exp.getTitle()).append("\n");
                sb.append("   ").append(exp.getSubtitle());
                if (exp.getDate() != null && !exp.getDate().isBlank()) {
                    sb.append(" | ").append(exp.getDate());
                }
                sb.append("\n");

                if (exp.getDescription() != null && !exp.getDescription().isEmpty()) {
                    for (String desc : exp.getDescription()) {
                        // Eğer • yoksa ekle
                        String formattedDesc = desc.trim();
                        if (!formattedDesc.startsWith("•")) {
                            formattedDesc = "• " + formattedDesc;
                        }
                        sb.append("   ").append(formattedDesc).append("\n");
                    }
                }
                sb.append("\n");
            }
        } else {
            sb.append("No work experience listed.\n\n");
        }

        // PROJECTS
        if (optProjects != null && !optProjects.isEmpty()) {
            sb.append("🚀 PROJECTS\n");
            sb.append("-".repeat(20)).append("\n");
            for (OptimizedCvItem p : optProjects) {
                sb.append("📁 ").append(p.getTitle());
                if (p.getSubtitle() != null && !p.getSubtitle().isBlank()) {
                    sb.append(" - ").append(p.getSubtitle());
                }
                sb.append("\n");
                if (p.getDate() != null && !p.getDate().isBlank()) {
                    sb.append("   📅 ").append(p.getDate()).append("\n");
                }
                if (p.getDescription() != null && !p.getDescription().isEmpty()) {
                    for (String d : p.getDescription()) {
                        String formattedDesc = d.trim();
                        if (!formattedDesc.startsWith("•")) {
                            formattedDesc = "• " + formattedDesc;
                        }
                        sb.append("   ").append(formattedDesc).append("\n");
                    }
                }
                sb.append("\n");
            }
        }

        // LANGUAGES
        if (optLanguages != null && !optLanguages.isEmpty()) {
            sb.append("🌐 LANGUAGES\n");
            sb.append("-".repeat(20)).append("\n");
            for (UserLanguageDTO lang : optLanguages) {
                sb.append("• ").append(lang.getLanguage())
                  .append(" (").append(lang.getLevel()).append(")\n");
            }
            sb.append("\n");
        }

        // CERTIFICATES
        if (optCertificates != null && !optCertificates.isEmpty()) {
            sb.append("📜 CERTIFICATIONS\n");
            sb.append("-".repeat(20)).append("\n");
            for (UserCertificateDTO cert : optCertificates) {
                sb.append("• ").append(cert.getName());
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

        // EDUCATION
        if (optEducation != null && !optEducation.isEmpty()) {
            sb.append("🎓 EDUCATION\n");
            sb.append("-".repeat(20)).append("\n");
            for (UserEducationDTO edu : optEducation) {
                sb.append("🏫 ").append(edu.getUniversity()).append("\n");
                if (edu.getStartYear() != null && !edu.getStartYear().isBlank()) {
                    sb.append("   📅 ")
                      .append(edu.getStartYear())
                      .append(" - ")
                      .append(edu.getGraduationYear() != null && !edu.getGraduationYear().isBlank()
                              ? edu.getGraduationYear()
                              : "Present");
                    sb.append("\n");
                }
                sb.append("\n");
            }
        } else if (profile.getEducationSchool() != null && !profile.getEducationSchool().isBlank()) {
            sb.append("🎓 EDUCATION\n");
            sb.append("-".repeat(20)).append("\n");
            sb.append("🏫 ").append(profile.getEducationSchool()).append("\n");
            if (profile.getEducationStartYear() != null && !profile.getEducationStartYear().isBlank()) {
                sb.append("   📅 ")
                  .append(profile.getEducationStartYear())
                  .append(" - ")
                  .append(profile.getEducationEndYear() != null && !profile.getEducationEndYear().isBlank()
                          ? profile.getEducationEndYear()
                          : "Present");
                sb.append("\n");
            }
            sb.append("\n");
        }

        sb.append("=".repeat(50)).append("\n");
        sb.append("END OF CV\n");
        sb.append("=".repeat(50)).append("\n");

        return sb.toString();
    }

    /**
     * Test metodu: AI'nın açıklama üretip üretmediğini kontrol et
     */
    public String testAiDescriptionGeneration(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getProfile() == null || user.getProfile().getExperiences() == null) {
            return "No experiences found";
        }

        UserProfile profile = user.getProfile();
        StringBuilder result = new StringBuilder();

        result.append("🔍 AI Description Generation Test\n");
        result.append("=================================\n\n");

        // Deneyimleri kontrol et
        for (int i = 0; i < profile.getExperiences().size(); i++) {
            UserExperience exp = profile.getExperiences().get(i);
            result.append("Experience ").append(i + 1).append(":\n");
            result.append("  Position: ").append(exp.getPosition()).append("\n");
            result.append("  Company: ").append(exp.getCompany()).append("\n");
            result.append("  Description (raw from DB):\n");
            result.append("    '").append(exp.getDescription()).append("'\n");

            // AI Client'ı çağır (sadece debug için)
            List<OptimizedCvItem> optimized = aiClient.optimizeExperiences(profile, null);
            if (i < optimized.size()) {
                OptimizedCvItem optExp = optimized.get(i);
                result.append("  AI Optimized Description:\n");
                for (String desc : optExp.getDescription()) {
                    result.append("    - '").append(desc).append("'\n");
                }
            }
            result.append("\n");
        }

        return result.toString();
    }
}
