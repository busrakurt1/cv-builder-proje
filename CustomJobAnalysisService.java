package com.cvbuilder.service;

import com.cvbuilder.dto.AnalysisResult;
import com.cvbuilder.dto.JobMatchRequest;
import com.cvbuilder.entity.User;
import com.cvbuilder.entity.UserSkill;
import com.cvbuilder.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class CustomJobAnalysisService {

    private final UserRepository userRepository;
    private final Map<String, SkillCategory> skillDatabase = createSkillDatabase();
    private final Pattern experiencePattern = Pattern.compile("(\\d+)\\s*yıl?|(\\d+)\\s*yr?", Pattern.CASE_INSENSITIVE);
    private final Pattern preferredIndicatorPattern = Pattern.compile("tercih|artı|plus|prefer|advantage", Pattern.CASE_INSENSITIVE);

    public CustomJobAnalysisService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Data
    @AllArgsConstructor
    private static class SkillCategory {
        private String name;
        private String category;
        private int importanceWeight;
    }

    @Data
    private static class JobRequirements {
        private int minExperience = 0;
        private List<String> requiredSkills = new ArrayList<>();
        private List<String> preferredSkills = new ArrayList<>();
    }

    @Data
    private static class MatchAnalysis {
        private double overallScore;
        private List<AnalysisResult.SkillMatch> matchingSkills;
        private List<String> missingSkills;
        private List<String> recommendations;
    }

    public AnalysisResult analyzeJobMatch(JobMatchRequest request) {
        log.info("📊 Özel iş eşleşme analizi başlatılıyor - Kullanıcı: {}", request.getUserId());
        
        JobRequirements requirements = parseJobDescription(request.getJobDescription());
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + request.getUserId()));
        
        MatchAnalysis analysis = performMatchAnalysis(user, requirements);
        return buildAnalysisResult(analysis, user, requirements);
    }

    private JobRequirements parseJobDescription(String jobDescription) {
        JobRequirements requirements = new JobRequirements();
        String lowerDesc = jobDescription.toLowerCase();
        
        extractExperience(lowerDesc, requirements);
        extractSkills(lowerDesc, requirements);
        
        return requirements;
    }

    private void extractExperience(String text, JobRequirements requirements) {
        Matcher matcher = experiencePattern.matcher(text);
        if (matcher.find()) {
            for (int i = 1; i <= matcher.groupCount(); i++) {
                if (matcher.group(i) != null) {
                    requirements.setMinExperience(Integer.parseInt(matcher.group(i)));
                    break;
                }
            }
        }
    }

    private void extractSkills(String text, JobRequirements requirements) {
        List<String> requiredSkills = new ArrayList<>();
        List<String> preferredSkills = new ArrayList<>();
        
        for (String skillKey : skillDatabase.keySet()) {
            if (text.contains(skillKey)) {
                if (isPreferredSkill(text, skillKey)) {
                    preferredSkills.add(skillKey);
                } else {
                    requiredSkills.add(skillKey);
                }
            }
        }
        
        requirements.setRequiredSkills(requiredSkills);
        requirements.setPreferredSkills(preferredSkills);
    }

    private boolean isPreferredSkill(String text, String skill) {
        int skillIndex = text.indexOf(skill);
        String surroundingText = text.substring(Math.max(0, skillIndex - 50), 
                                               Math.min(text.length(), skillIndex + 50));
        return preferredIndicatorPattern.matcher(surroundingText).find();
    }

    private MatchAnalysis performMatchAnalysis(User user, JobRequirements job) {
        MatchAnalysis analysis = new MatchAnalysis();
        
        double skillMatchScore = calculateSkillMatch(user.getSkills(), job);
        double experienceMatchScore = calculateExperienceMatch(user.getExperienceYears(), job.getMinExperience());
        double overallScore = (skillMatchScore * 0.7) + (experienceMatchScore * 0.3);
        
        analysis.setOverallScore(overallScore);
        analysis.setMatchingSkills(findMatchingSkills(user, job));
        analysis.setMissingSkills(findMissingSkills(user, job));
        analysis.setRecommendations(generateRecommendations(user, job));
        
        return analysis;
    }

    private double calculateSkillMatch(Set<UserSkill> userSkills, JobRequirements job) {
        if (job.getRequiredSkills().isEmpty()) return 0.0;
        if (userSkills == null || userSkills.isEmpty()) return 0.0;
        
        long matchedRequired = userSkills.stream()
                .filter(skill -> job.getRequiredSkills().contains(skill.getSkillName().toLowerCase()))
                .count();
        
        return (double) matchedRequired / job.getRequiredSkills().size();
    }

    private double calculateExperienceMatch(Integer userExperience, Integer jobExperience) {
        if (jobExperience == 0) return 1.0;
        if (userExperience == null || userExperience == 0) return 0.0;
        
        double ratio = (double) userExperience / jobExperience;
        return Math.min(ratio, 1.0);
    }

    private List<AnalysisResult.SkillMatch> findMatchingSkills(User user, JobRequirements job) {
        List<AnalysisResult.SkillMatch> matches = new ArrayList<>();
        
        if (user.getSkills() == null) return matches;
        
        for (UserSkill userSkill : user.getSkills()) {
            String skillName = userSkill.getSkillName().toLowerCase();
            if (job.getRequiredSkills().contains(skillName) || job.getPreferredSkills().contains(skillName)) {
                AnalysisResult.SkillMatch match = new AnalysisResult.SkillMatch();
                match.setSkill(skillDatabase.get(skillName).getName());
                match.setMatchType(job.getRequiredSkills().contains(skillName) ? "REQUIRED" : "PREFERRED");
                match.setUserLevel(userSkill.getLevel() != null ? userSkill.getLevel() : "INTERMEDIATE");
                match.setImportance(skillDatabase.get(skillName).getImportanceWeight());
                matches.add(match);
            }
        }
        
        return matches;
    }

    private List<String> findMissingSkills(User user, JobRequirements job) {
        List<String> missing = new ArrayList<>();
        
        for (String requiredSkill : job.getRequiredSkills()) {
            if (!userHasSkill(user, requiredSkill)) {
                missing.add(skillDatabase.get(requiredSkill).getName());
            }
        }
        
        return missing;
    }

    private boolean userHasSkill(User user, String skill) {
        if (user.getSkills() == null) return false;
        
        return user.getSkills().stream()
                .anyMatch(userSkill -> {
                    String skillName = userSkill.getSkillName();
                    return skillName != null && skillName.equalsIgnoreCase(skill);
                });
    }

    private List<String> generateRecommendations(User user, JobRequirements job) {
        List<String> recommendations = new ArrayList<>();
        
        for (String missingSkill : findMissingSkills(user, job)) {
            SkillCategory skill = skillDatabase.get(missingSkill.toLowerCase());
            if (skill != null) {
                recommendations.add(String.format(
                        "📚 %s yetkinliğini geliştirmeniz önerilir (%s kategorisi)", 
                        skill.getName(), skill.getCategory()
                ));
            }
        }
        
        if (user.getExperienceYears() < job.getMinExperience()) {
            recommendations.add(String.format(
                    "⏳ %d yıl daha deneyim gerekiyor. Benzer projelerle portföyünüzü güçlendirin.",
                    job.getMinExperience() - user.getExperienceYears()
            ));
        }
        
        for (String preferredSkill : job.getPreferredSkills()) {
            if (!userHasSkill(user, preferredSkill)) {
                recommendations.add(String.format(
                        "🌟 %s bilgisi tercih sebebi, öğrenmeniz avantaj sağlayacaktır",
                        skillDatabase.get(preferredSkill).getName()
                ));
            }
        }
        
        if (recommendations.isEmpty()) {
            recommendations.add("🎉 Mükemmel! Tüm temel gereksinimleri karşılıyorsunuz.");
        }
        
        return recommendations;
    }

    private AnalysisResult buildAnalysisResult(MatchAnalysis analysis, User user, JobRequirements job) {
        AnalysisResult result = new AnalysisResult();
        
        result.setMatchPercentage(Math.round(analysis.getOverallScore() * 100));
        result.setMatchLevel(determineMatchLevel(analysis.getOverallScore()));
        result.setMatchingSkills(analysis.getMatchingSkills());
        result.setMissingSkills(analysis.getMissingSkills());
        result.setRecommendations(analysis.getRecommendations());
        result.setAnalysisSummary(generateSummary(analysis, user, job));
        
        return result;
    }

    private String determineMatchLevel(double score) {
        if (score >= 0.8) return "YÜKSEK";
        if (score >= 0.6) return "ORTA";
        if (score >= 0.4) return "DÜŞÜK";
        return "ÇOK DÜŞÜK";
    }

    private String generateSummary(MatchAnalysis analysis, User user, JobRequirements job) {
        return String.format(
            "👤 %s - %d yıl deneyim\n📊 Eşleşme: %.0f%% (%s)\n✅ Eşleşen: %d yetenek\n❌ Eksik: %d yetenek",
            user.getFullName(),
            user.getExperienceYears(),
            analysis.getOverallScore() * 100,
            determineMatchLevel(analysis.getOverallScore()),
            analysis.getMatchingSkills().size(),
            analysis.getMissingSkills().size()
        );
    }

    private Map<String, SkillCategory> createSkillDatabase() {
        Map<String, SkillCategory> database = new HashMap<>();
        
        // Backend Technologies
        database.put("java", new SkillCategory("Java", "BACKEND", 10));
        database.put("spring boot", new SkillCategory("Spring Boot", "BACKEND", 9));
        database.put("spring", new SkillCategory("Spring Framework", "BACKEND", 9));
        database.put("python", new SkillCategory("Python", "BACKEND", 8));
        database.put("node.js", new SkillCategory("Node.js", "BACKEND", 8));
        
        // Frontend Technologies
        database.put("react", new SkillCategory("React", "FRONTEND", 8));
        database.put("angular", new SkillCategory("Angular", "FRONTEND", 8));
        database.put("javascript", new SkillCategory("JavaScript", "FRONTEND", 9));
        database.put("typescript", new SkillCategory("TypeScript", "FRONTEND", 8));
        
        // DevOps & Cloud
        database.put("docker", new SkillCategory("Docker", "DEVOPS", 8));
        database.put("kubernetes", new SkillCategory("Kubernetes", "DEVOPS", 9));
        database.put("aws", new SkillCategory("AWS", "CLOUD", 9));
        database.put("azure", new SkillCategory("Azure", "CLOUD", 8));
        
        // Database
        database.put("sql", new SkillCategory("SQL", "DATABASE", 8));
        database.put("mysql", new SkillCategory("MySQL", "DATABASE", 7));
        database.put("postgresql", new SkillCategory("PostgreSQL", "DATABASE", 8));
        database.put("mongodb", new SkillCategory("MongoDB", "DATABASE", 7));
        
        return database;
    }
}