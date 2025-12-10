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
import java.util.stream.Collectors;

@Slf4j
@Service
public class CustomJobAnalysisService {

    private final UserRepository userRepository;
    private final Map<String, SkillCategory> skillDatabase = createSkillDatabase();
    
    // Regex Patterns
    private final Pattern experiencePattern =
            Pattern.compile("(\\d+)\\s*yıl?|(\\d+)\\s*yr?", Pattern.CASE_INSENSITIVE);
    private final Pattern preferredIndicatorPattern =
            Pattern.compile("tercih|artı|plus|prefer|advantage", Pattern.CASE_INSENSITIVE);

    public CustomJobAnalysisService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ========= YARDIMCI INNER CLASSLAR =========
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

    // ========= ANA METOT =========
    public AnalysisResult analyzeJobMatch(JobMatchRequest request) {
        log.info("📊 Özel iş eşleşme analizi başlatılıyor - Kullanıcı ID: {}", request.getUserId());

        // 1. İlanı Analiz Et
        JobRequirements requirements = parseJobDescription(request.getJobDescription());

        // 2. Kullanıcıyı Getir
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + request.getUserId()));

        // 3. Eşleştirme Yap
        MatchAnalysis analysis = performMatchAnalysis(user, requirements);

        // 4. Sonucu Döndür
        return buildAnalysisResult(analysis, user, requirements);
    }

    // ========= İLAN PARSE İŞLEMLERİ =========
    private JobRequirements parseJobDescription(String jobDescription) {
        JobRequirements requirements = new JobRequirements();
        if (jobDescription == null) return requirements;

        String lowerDesc = jobDescription.toLowerCase();

        extractExperience(lowerDesc, requirements);
        extractSkills(lowerDesc, requirements);

        return requirements;
    }

    private void extractExperience(String text, JobRequirements requirements) {
        Matcher matcher = experiencePattern.matcher(text);
        if (matcher.find()) {
            // Regex gruplarından hangisi doluysa onu al (Türkçe veya İngilizce)
            String group1 = matcher.group(1); // yıl
            String group2 = matcher.group(2); // yr
            
            if (group1 != null) {
                requirements.setMinExperience(Integer.parseInt(group1));
            } else if (group2 != null) {
                requirements.setMinExperience(Integer.parseInt(group2));
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
        if (skillIndex == -1) return false;

        // Kelimenin etrafındaki 50 karaktere bak, "tercihen" gibi kelimeler var mı?
        String surroundingText = text.substring(
                Math.max(0, skillIndex - 50),
                Math.min(text.length(), skillIndex + 50)
        );
        return preferredIndicatorPattern.matcher(surroundingText).find();
    }

    // ========= EŞLEŞME MANTIĞI =========
    private MatchAnalysis performMatchAnalysis(User user, JobRequirements job) {
        MatchAnalysis analysis = new MatchAnalysis();

        Set<UserSkill> userSkills = getUserSkills(user);

        double skillMatchScore = calculateSkillMatch(userSkills, job);
        double experienceMatchScore = calculateExperienceMatch(user.getExperienceYears(), job.getMinExperience());
        
        // Skor Ağırlığı: %70 Yetenek, %30 Deneyim
        double overallScore = (skillMatchScore * 0.7) + (experienceMatchScore * 0.3);

        analysis.setOverallScore(overallScore);
        analysis.setMatchingSkills(findMatchingSkills(user, job));
        analysis.setMissingSkills(findMissingSkills(user, job));
        analysis.setRecommendations(generateRecommendations(user, job));

        return analysis;
    }

    /**
     * DÜZELTİLEN KISIM BURASI:
     * Artık user.getProfile().getSkills() DEĞİL, user.getSkills() kullanıyoruz.
     */
    private Set<UserSkill> getUserSkills(User user) {
        if (user.getProfile() == null || user.getProfile().getSkills() == null) {
            return Collections.emptySet();
        }
        return new HashSet<>(user.getProfile().getSkills());
    }

    private double calculateSkillMatch(Set<UserSkill> userSkills, JobRequirements job) {
        if (job.getRequiredSkills().isEmpty()) return 1.0; // İlan yetenek istemiyorsa tam puan
        if (userSkills.isEmpty()) return 0.0;

        long matchedCount = userSkills.stream()
                .filter(skill -> skill.getSkillName() != null)
                .map(skill -> skill.getSkillName().toLowerCase())
                .filter(name -> job.getRequiredSkills().contains(name))
                .count();

        return (double) matchedCount / job.getRequiredSkills().size();
    }

    private double calculateExperienceMatch(Integer userExperience, Integer jobExperience) {
        if (jobExperience == 0) return 1.0;
        if (userExperience == null) userExperience = 0;

        double ratio = (double) userExperience / jobExperience;
        return Math.min(ratio, 1.0); // %100'ü geçmesin
    }

    private List<AnalysisResult.SkillMatch> findMatchingSkills(User user, JobRequirements job) {
        List<AnalysisResult.SkillMatch> matches = new ArrayList<>();
        Set<UserSkill> userSkills = getUserSkills(user);

        if (userSkills.isEmpty()) return matches;

        for (UserSkill userSkill : userSkills) {
            String name = userSkill.getSkillName();
            if (name == null) continue;
            
            String lowerName = name.toLowerCase();

            if (job.getRequiredSkills().contains(lowerName) || job.getPreferredSkills().contains(lowerName)) {
                SkillCategory cat = skillDatabase.get(lowerName);
                
                AnalysisResult.SkillMatch match = new AnalysisResult.SkillMatch();
                match.setSkill(cat != null ? cat.getName() : name); // Varsa düzgün ismini, yoksa ham ismini kullan
                match.setMatchType(job.getRequiredSkills().contains(lowerName) ? "ZORUNLU" : "TERCİH");
                match.setUserLevel(userSkill.getLevel() != null ? userSkill.getLevel() : "BELİRTİLMEMİŞ");
                match.setImportance(cat != null ? cat.getImportanceWeight() : 5);
                
                matches.add(match);
            }
        }
        return matches;
    }

    private List<String> findMissingSkills(User user, JobRequirements job) {
        List<String> missing = new ArrayList<>();

        for (String reqSkill : job.getRequiredSkills()) {
            if (!userHasSkill(user, reqSkill)) {
                SkillCategory cat = skillDatabase.get(reqSkill);
                missing.add(cat != null ? cat.getName() : reqSkill);
            }
        }
        return missing;
    }

    private boolean userHasSkill(User user, String skillToFind) {
        Set<UserSkill> userSkills = getUserSkills(user);
        return userSkills.stream()
                .anyMatch(us -> us.getSkillName() != null && 
                                us.getSkillName().equalsIgnoreCase(skillToFind));
    }

    private List<String> generateRecommendations(User user, JobRequirements job) {
        List<String> recommendations = new ArrayList<>();

        // 1. Eksik Yetenek Tavsiyeleri
        List<String> missing = findMissingSkills(user, job);
        for (String m : missing) {
            recommendations.add("Eksik yetkinlik: " + m + ". Bu alanda proje geliştirmenizi öneririz.");
        }

        // 2. Deneyim Tavsiyesi
        int userExp = user.getExperienceYears() != null ? user.getExperienceYears() : 0;
        if (job.getMinExperience() > userExp) {
            int diff = job.getMinExperience() - userExp;
            recommendations.add("Deneyim süreniz ilan için " + diff + " yıl eksik. Staj veya freelance projelerle kapatmayı deneyin.");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Tebrikler! Bu ilan için teknik profiliniz oldukça güçlü görünüyor.");
        }

        return recommendations;
    }

    private AnalysisResult buildAnalysisResult(MatchAnalysis analysis, User user, JobRequirements job) {
        AnalysisResult result = new AnalysisResult();
        
        result.setMatchPercentage((int) Math.round(analysis.getOverallScore() * 100));
        result.setMatchLevel(determineMatchLevel(analysis.getOverallScore()));
        result.setMatchingSkills(analysis.getMatchingSkills());
        result.setMissingSkills(analysis.getMissingSkills());
        result.setRecommendations(analysis.getRecommendations());
        result.setAnalysisSummary(generateSummary(analysis, user));

        return result;
    }

    private String determineMatchLevel(double score) {
        if (score >= 0.8) return "YÜKSEK";
        if (score >= 0.5) return "ORTA";
        return "DÜŞÜK";
    }

    private String generateSummary(MatchAnalysis analysis, User user) {
        return String.format("%s kullanıcısı için analiz tamamlandı. Toplam %d yetenek eşleşti, %d kritik yetenek eksik.",
                user.getFullName(),
                analysis.getMatchingSkills().size(),
                analysis.getMissingSkills().size());
    }

    // ========= SABİT VERİTABANI (Daha sonra DB'den çekilebilir) =========
    private Map<String, SkillCategory> createSkillDatabase() {
        Map<String, SkillCategory> db = new HashMap<>();
        // Backend
        db.put("java", new SkillCategory("Java", "Backend", 10));
        db.put("spring", new SkillCategory("Spring Framework", "Backend", 9));
        db.put("spring boot", new SkillCategory("Spring Boot", "Backend", 9));
        db.put("python", new SkillCategory("Python", "Backend", 8));
        db.put("c#", new SkillCategory("C#", "Backend", 8));
        db.put(".net", new SkillCategory(".NET Core", "Backend", 8));
        
        // Frontend
        db.put("react", new SkillCategory("React.js", "Frontend", 8));
        db.put("angular", new SkillCategory("Angular", "Frontend", 8));
        db.put("vue", new SkillCategory("Vue.js", "Frontend", 7));
        db.put("javascript", new SkillCategory("JavaScript", "Frontend", 9));
        
        // DevOps
        db.put("docker", new SkillCategory("Docker", "DevOps", 8));
        db.put("kubernetes", new SkillCategory("Kubernetes", "DevOps", 9));
        db.put("aws", new SkillCategory("AWS", "Cloud", 9));
        db.put("azure", new SkillCategory("Azure", "Cloud", 8));
        
        // DB
        db.put("sql", new SkillCategory("SQL", "Database", 8));
        db.put("mysql", new SkillCategory("MySQL", "Database", 7));
        db.put("postgresql", new SkillCategory("PostgreSQL", "Database", 8));
        db.put("mongodb", new SkillCategory("MongoDB", "Database", 7));

        return db;
    }
}