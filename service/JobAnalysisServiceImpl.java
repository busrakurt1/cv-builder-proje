package com.cvbuilder.service;

import com.cvbuilder.dto.JobAnalysisResponse;
import com.cvbuilder.dto.MarketAnalysisResponse;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.User;
import com.cvbuilder.external.AiClient;
import com.cvbuilder.external.JobScraperClient;
import com.cvbuilder.repository.JobPostingRepository;
import com.cvbuilder.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobAnalysisServiceImpl implements JobAnalysisService {

    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final JobScraperClient scraper;
    private final AiClient aiClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public JobAnalysisResponse analyzeJobPosting(Long userId, String url) {
        log.info("Analyzing Job for User ID: {}, URL: {}", userId, url);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Map<String, String> scrapedData = scraper.fetchJobData(url);
        String jobContent = scrapedData.getOrDefault("jobContent", scrapedData.getOrDefault("fullText", ""));

        String jsonResult = aiClient.analyzeJobPostingUniversal(jobContent);
        JobAiResult aiData = parseAiResult(jsonResult);

        List<String> userSkills = getUserSkillsNormalized(user);
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String reqSkill : aiData.technicalSkills) {
            if (isUserHasSkill(userSkills, reqSkill)) matchedSkills.add(reqSkill);
            else missingSkills.add(reqSkill);
        }

        String report = generateUniversalReport(aiData, matchedSkills);
        JobPosting jp = saveJobPosting(user, url, aiData, jobContent, report);

        int totalReq = aiData.technicalSkills.size();
        int matchedCount = matchedSkills.size();
        int score = totalReq == 0 ? 0 : (int) Math.round((matchedCount * 100.0) / totalReq);

        return JobAnalysisResponse.builder()
                .jobId(jp.getId())
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .position(emptyToUnspecified(aiData.position))
                .company(emptyToUnspecified(aiData.company))
                .location(emptyToUnspecified(aiData.location))
                .workType(emptyToUnspecified(aiData.workType))
                .experienceLevel(emptyToUnspecified(aiData.experienceLevel))
                .educationLevel(emptyToUnspecified(aiData.educationLevel))
                .militaryStatus(emptyToUnspecified(aiData.militaryStatus))
                .salary(emptyToUnspecified(aiData.salary))
                .summary(emptyToUnspecified(aiData.summary))
                .responsibilities(aiData.responsibilities)
                .matchScore(score)
                .formattedAnalysis(report)
                .build();
    }

    @Override
    public List<JobPosting> getJobsByUserId(Long userId) {
        return jobPostingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public JobPosting getJobById(Long jobId) {
        return jobPostingRepository.findById(jobId).orElseThrow();
    }

    private JobAiResult parseAiResult(String json) {
        JobAiResult result = new JobAiResult();
        try {
            JsonNode root = objectMapper.readTree(json == null ? "{}" : json);

            result.position = getText(root, "position");
            result.company = getText(root, "company");
            result.location = getText(root, "location");
            result.workType = getText(root, "workType");
            result.experienceLevel = getText(root, "experienceLevel");
            result.educationLevel = getText(root, "educationLevel");
            result.militaryStatus = getText(root, "militaryStatus");
            result.salary = getText(root, "salary");
            result.summary = getText(root, "summary");

            if (root.has("technicalSkills") && root.get("technicalSkills").isArray()) {
                result.technicalSkills = StreamSupport.stream(root.get("technicalSkills").spliterator(), false)
                        .map(JsonNode::asText)
                        .filter(s -> s != null && !s.isBlank())
                        .distinct()
                        .collect(Collectors.toList());
            }

            if (root.has("responsibilities") && root.get("responsibilities").isArray()) {
                result.responsibilities = StreamSupport.stream(root.get("responsibilities").spliterator(), false)
                        .map(JsonNode::asText)
                        .filter(s -> s != null && !s.isBlank())
                        .distinct()
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("JSON Parse Hatası: ", e);
        }
        return result;
    }

    private String getText(JsonNode node, String field) {
        if (node == null || field == null) return "";
        if (!node.has(field) || node.get(field).isNull()) return "";
        return node.get(field).asText("");
    }

    private JobPosting saveJobPosting(User user, String url, JobAiResult aiData, String rawText, String report) {
        String cleanText = safeTruncate(rawText, 4000);
        String cleanReport = safeTruncate(report, 4000);
        String skillsStr = String.join(", ", aiData.technicalSkills);
        String respStr = String.join("; ", aiData.responsibilities);

        JobPosting jp = JobPosting.builder()
                .user(user)
                .url(url)
                .position(safeTruncate(aiData.position, 255))
                .cleanedText(cleanText)
                .requiredSkills(safeTruncate(skillsStr, 2000))
                .responsibilities(safeTruncate(respStr, 2000))
                .analysisReport(cleanReport)
                .createdAt(new Date())
                .build();

        return jobPostingRepository.save(jp);
    }

    private String generateUniversalReport(JobAiResult data, List<String> matched) {
        StringBuilder sb = new StringBuilder();

        sb.append("### DETAYLI İŞ ANALİZİ RAPORU\n\n");
        sb.append("Pozisyon: ").append(emptyToUnspecified(data.position)).append("\n");
        sb.append("Firma: ").append(emptyToUnspecified(data.company)).append("\n");
        sb.append("Konum: ").append(emptyToUnspecified(data.location)).append("\n");
        sb.append("Çalışma Tipi: ").append(emptyToUnspecified(data.workType)).append("\n");
        sb.append("Eğitim: ").append(emptyToUnspecified(data.educationLevel)).append("\n");
        sb.append("Deneyim: ").append(emptyToUnspecified(data.experienceLevel)).append("\n");
        sb.append("Askerlik: ").append(emptyToUnspecified(data.militaryStatus)).append("\n");
        sb.append("Maaş: ").append(emptyToUnspecified(data.salary)).append("\n\n");

        sb.append("Gereklilikler:\n");
        if (data.technicalSkills.isEmpty()) {
            sb.append("Belirtilmemiş\n");
        } else {
            for (String skill : data.technicalSkills) {
                if (matched.contains(skill)) sb.append("✅ ").append(skill).append("\n");
                else sb.append("❌ ").append(skill).append("\n");
            }
        }

        sb.append("\nSorumluluklar:\n");
        if (data.responsibilities.isEmpty()) sb.append("Belirtilmemiş\n");
        else for (String r : data.responsibilities) sb.append("- ").append(r).append("\n");

        sb.append("\nÖzet:\n");
        sb.append(emptyToUnspecified(data.summary)).append("\n");

        return sb.toString();
    }

    private List<String> getUserSkillsNormalized(User user) {
        if (user == null || user.getProfile() == null || user.getProfile().getSkills() == null) return new ArrayList<>();
        return user.getProfile().getSkills().stream()
                .map(s -> s.getSkillName() == null ? "" : s.getSkillName().toLowerCase(Locale.forLanguageTag("tr")).trim())
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private boolean isUserHasSkill(List<String> userSkills, String reqSkill) {
        if (reqSkill == null || reqSkill.isBlank()) return false;
        String reqLower = reqSkill.toLowerCase(Locale.forLanguageTag("tr")).trim();
        for (String uSkill : userSkills) {
            if (uSkill.isBlank()) continue;
            if (reqLower.contains(uSkill) || uSkill.contains(reqLower)) return true;
        }
        return false;
    }

    private String safeTruncate(String value, int length) {
        if (value == null) return "";
        String v = value.trim();
        return v.length() > length ? v.substring(0, Math.max(0, length - 3)) + "..." : v;
    }

    private String emptyToUnspecified(String s) {
        if (s == null) return "Belirtilmemiş";
        String t = s.trim();
        if (t.isEmpty()) return "Belirtilmemiş";
        if (t.equalsIgnoreCase("null")) return "Belirtilmemiş";
        return t;
    }

    private static class JobAiResult {
        String position = "";
        String company = "";
        String location = "";
        String workType = "";
        String experienceLevel = "";
        String educationLevel = "";
        String militaryStatus = "";
        String salary = "";
        String summary = "";
        List<String> technicalSkills = new ArrayList<>();
        List<String> responsibilities = new ArrayList<>();
    }

	@Override
	public JobAnalysisResponse analyzeJobByRawText(Long userId, String jobContent) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public MarketAnalysisResponse performMarketAnalysis(String area, Long userId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public JobAnalysisResponse analyzeJobPosting(Object object, String url) {
		// TODO Auto-generated method stub
		return null;
	}
}
