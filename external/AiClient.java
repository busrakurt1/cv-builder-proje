package com.cvbuilder.external;

import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.UserProfile;
import com.cvbuilder.entity.UserSkill;
import org.springframework.stereotype.Component;

@Component
public class AiClient {

    public String generateCv(UserProfile profile, JobPosting jobPosting) {

        String userName = profile != null && profile.getUser() != null
                ? safe(profile.getUser().getFullName())
                : "Ad Soyad Belirtilmemiş";

        String title = profile != null ? safe(profile.getTitle()) : "Pozisyon Belirtilmemiş";

        // 🔥 LOCATION artık User üzerinden okunuyor!
        String location = (profile != null && profile.getUser() != null)
                ? safe(profile.getUser().getLocation())
                : "Lokasyon Belirtilmemiş";

        String summary = profile != null ? safe(profile.getSummary()) : "Özet bilgisi henüz eklenmemiş.";

        Integer expYears = profile != null && profile.getTotalExperienceYear() != null
                ? profile.getTotalExperienceYear()
                : 0;

        String skillsText = buildSkillsText(profile);

        String jobUrl           = jobPosting != null ? safe(jobPosting.getUrl())              : "";
        String requiredSkills   = jobPosting != null ? safe(jobPosting.getRequiredSkills())   : "";
        String responsibilities = jobPosting != null ? safe(jobPosting.getResponsibilities()) : "";
        String niceToHave       = jobPosting != null ? safe(jobPosting.getNiceToHave())       : "";

        return """
                ================== ATS FRIENDLY CV ==================
                NAME        : %s
                TITLE       : %s
                EXPERIENCE  : %d YEARS
                LOCATION    : %s

                ------------------- SUMMARY -------------------------
                %s

                ------------------- SKILLS --------------------------
                %s

                ------------------- TARGET JOB ----------------------
                URL          : %s
                REQUIRED     : %s
                RESPONSIB.   : %s
                NICE TO HAVE : %s
                =====================================================
                """.formatted(
                userName,
                title,
                expYears,
                location,
                summary,
                skillsText,
                jobUrl,
                requiredSkills,
                responsibilities,
                niceToHave
        );
    }

    private String buildSkillsText(UserProfile profile) {
        if (profile == null || profile.getSkills() == null || profile.getSkills().isEmpty()) {
            return "Skills not provided yet.";
        }

        StringBuilder sb = new StringBuilder();
        for (UserSkill s : profile.getSkills()) {
            sb.append("- ")
                    .append(s.getSkillName() != null ? s.getSkillName() : "Unknown Skill")
                    .append(" (")
                    .append(s.getLevel() != null ? s.getLevel() : "N/A")
                    .append(")\n");
        }

        return sb.toString();
    }

    private String safe(String text) {
        return text != null ? text : "";
    }
}
