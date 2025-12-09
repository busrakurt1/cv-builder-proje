package com.cvbuilder.service;

import com.cvbuilder.dto.JobAnalysisResponse;
import com.cvbuilder.entity.JobPosting;
import com.cvbuilder.entity.User;
import com.cvbuilder.entity.UserSkill;
import com.cvbuilder.external.JobScraperClient;
import com.cvbuilder.repository.JobPostingRepository;
import com.cvbuilder.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobAnalysisServiceImpl implements JobAnalysisService {

    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final JobScraperClient scraper;

    // =================================================================================
    // 🧠 TEKNİK BİLGİ TABANI - GENİŞLETİLMİŞ
    // =================================================================================
    private static final Map<String, List<String>> KNOWLEDGE_BASE = Map.ofEntries(
            // ERP & KURUMSAL SİSTEMLER
            Map.entry("ERP & Kurumsal Sistemler", List.of(
                    "Canias", "Canias ERP", "Troia", "SAP", "SAP ABAP", "SAP FICO", "SAP MM", "SAP SD", "SAP HANA",
                    "Oracle EBS", "Oracle Fusion", "Oracle Financials", "NetSuite", "Workday", "Dynamics 365",
                    "Microsoft Dynamics", "Axapta", "Navision", "Logo", "Logo Tiger", "Logo Go", "Mikro", "Nethesis",
                    "IBS", "Arvento", "Kobi", "Parasut", "Eta", "Link", "Efes", "Zoho", "Odoo", "OpenERP"
            )),

            // PROGRAMLAMA DİLLERİ
            Map.entry("Programlama Dilleri", List.of(
                    "Java", "Java EE", "Spring", "Spring Boot", "Spring MVC", "Spring Security", "Spring Data",
                    "Python", "Django", "Flask", "FastAPI", "NumPy", "Pandas", "SciPy", "TensorFlow", "PyTorch",
                    "C#", ".NET", ".NET Core", "ASP.NET", "ASP.NET MVC", "ASP.NET Core", "Entity Framework",
                    "JavaScript", "TypeScript", "ES6+", "Node.js", "Express.js", "NestJS", "Deno",
                    "Go", "Golang", "Ruby", "Ruby on Rails", "PHP", "Laravel", "Symfony", "CodeIgniter",
                    "Swift", "SwiftUI", "Kotlin", "Kotlin Multiplatform", "C++", "C", "Rust", "Dart",
                    "Scala", "Perl", "Haskell", "Elixir", "Clojure", "F#", "VB.NET", "Objective-C"
            )),

            // FRONTEND TEKNOLOJİLERİ
            Map.entry("Frontend Teknolojileri", List.of(
                    "React", "React.js", "React Native", "Redux", "Redux Toolkit", "MobX", "Next.js", "Gatsby",
                    "Angular", "Angular 2+", "RxJS", "NgRx", "Vue", "Vue.js", "Vuex", "Nuxt.js", "Vuetify",
                    "HTML", "CSS", "SASS", "SCSS", "LESS", "Styled Components", "Tailwind CSS", "Bootstrap",
                    "Material UI", "Ant Design", "Chakra UI", "jQuery", "Webpack", "Babel", "ESLint", "Prettier",
                    "GraphQL", "Apollo", "WebSocket", "WebRTC", "PWA", "SPA", "SSR", "Jamstack"
            )),

            // MOBİL GELİŞTİRME
            Map.entry("Mobil Geliştirme", List.of(
                    "Android", "Android SDK", "Android Jetpack", "Android Architecture Components",
                    "iOS", "Swift", "SwiftUI", "UIKit", "Core Data", "Core Animation",
                    "Flutter", "Dart", "React Native", "Xamarin", "Ionic", "Cordova", "PhoneGap",
                    "Kotlin", "Kotlin Multiplatform", "Jetpack Compose", "Firebase", "Push Notification",
                    "App Store", "Google Play", "Mobile UI/UX", "Mobile Security"
            )),

            // BACKEND & FRAMEWORK
            Map.entry("Backend & Framework", List.of(
                    "Spring Boot", "Spring Framework", "Spring Cloud", "Spring Security", "Spring Data JPA",
                    "Node.js", "Express.js", "NestJS", "Fastify", "Koa", "Hapi", "Sails.js",
                    "Django", "Django REST", "Flask", "FastAPI", "Sanic", "Tornado",
                    "ASP.NET Core", "ASP.NET MVC", "Web API", "WCF", "WPF", "Blazor",
                    "Laravel", "Symfony", "CodeIgniter", "CakePHP", "Zend Framework",
                    "Ruby on Rails", "Sinatra", "Grails", "Play Framework", "Micronaut", "Quarkus"
            )),

            // VERİ TABANLARI
            Map.entry("Veri Tabanları", List.of(
                    "SQL", "MySQL", "PostgreSQL", "Oracle Database", "Microsoft SQL Server", "SQLite",
                    "MariaDB", "DB2", "Teradata", "NoSQL", "MongoDB", "Cassandra", "Redis", "Elasticsearch",
                    "DynamoDB", "Couchbase", "Neo4j", "ArangoDB", "Firebase Realtime Database", "Firestore",
                    "InfluxDB", "TimescaleDB", "ClickHouse", "Snowflake", "BigQuery", "Redshift",
                    "PL/SQL", "T-SQL", "Hibernate", "JPA", "Entity Framework Core", "Sequelize", "Mongoose",
                    "Database Design", "Database Optimization", "Indexing", "Partitioning", "Sharding", "Replication"
            )),

            // DEVOPS & CLOUD
            Map.entry("DevOps & Cloud", List.of(
                    "Docker", "Docker Compose", "Kubernetes", "Helm", "Istio", "Linkerd", "Service Mesh",
                    "AWS", "Amazon Web Services", "EC2", "S3", "Lambda", "RDS", "DynamoDB", "CloudFormation",
                    "Azure", "Microsoft Azure", "Azure DevOps", "Azure Functions", "Azure SQL",
                    "Google Cloud", "GCP", "Google Kubernetes Engine", "Cloud Functions", "Firebase",
                    "CI/CD", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis CI", "Bamboo",
                    "Terraform", "Ansible", "Chef", "Puppet", "SaltStack", "Prometheus", "Grafana",
                    "ELK Stack", "Logstash", "Kibana", "Splunk", "New Relic", "Datadog", "AppDynamics"
            )),

            // TEST & QA
            Map.entry("Test & QA", List.of(
                    "Unit Testing", "Integration Testing", "End-To-End Testing", "Selenium", "Cypress",
                    "JUnit", "TestNG", "Mockito", "PowerMock", "Jest", "Mocha", "Chai", "Sinon",
                    "Pytest", "unittest", "Robot Framework", "Cucumber", "Gherkin", "BDD", "TDD",
                    "Postman", "SoapUI", "Rest-Assured", "JMeter", "Load Testing", "Performance Testing",
                    "Security Testing", "OWASP", "Penetration Testing", "Automation Testing", "Manual Testing",
                    "Test Plan", "Test Case", "Bug Tracking", "Jira", "Bugzilla", "TestRail", "Quality Assurance"
            )),

            // ARAÇLAR & METODOLOJİ
            Map.entry("Araçlar & Metodoloji", List.of(
                    "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Mercurial", "Git Flow",
                    "Jira", "Confluence", "Trello", "Asana", "ClickUp", "Monday.com", "Notion",
                    "Agile", "Scrum", "Kanban", "SAFe", "Lean", "Waterfall", "DevOps",
                    "UML", "Design Patterns", "Clean Code", "SOLID Principles", "DRY", "KISS", "YAGNI",
                    "Microservices", "Monolith", "Serverless", "REST API", "GraphQL", "gRPC", "WebSocket",
                    "API Design", "API Gateway", "Message Queue", "RabbitMQ", "Kafka", "ActiveMQ", "Redis Pub/Sub",
                    "Visual Studio", "Visual Studio Code", "IntelliJ IDEA", "Eclipse", "NetBeans", "PyCharm",
                    "WebStorm", "Android Studio", "Xcode", "Postman", "Swagger", "Insomnia"
            )),

            // DATA SCIENCE & AI
            Map.entry("Data Science & AI", List.of(
                    "Machine Learning", "Deep Learning", "Neural Networks", "Computer Vision", "NLP",
                    "Natural Language Processing", "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
                    "OpenCV", "NLTK", "spaCy", "Hugging Face", "Transformers",
                    "Data Analysis", "Data Visualization", "Pandas", "NumPy", "Matplotlib", "Seaborn",
                    "Plotly", "Tableau", "Power BI", "Looker", "Qlik", "Data Warehouse", "Data Lake",
                    "Big Data", "Hadoop", "Spark", "Hive", "Pig", "HBase", "Flink", "Storm",
                    "Statistical Analysis", "Probability", "Regression", "Classification", "Clustering"
            )),

            // GÜVENLİK
            Map.entry("Güvenlik", List.of(
                    "Cybersecurity", "Application Security", "Network Security", "Cloud Security",
                    "OWASP Top 10", "Penetration Testing", "Vulnerability Assessment", "Ethical Hacking",
                    "Cryptography", "SSL/TLS", "JWT", "OAuth", "OpenID Connect", "SAML",
                    "Firewall", "WAF", "IDS/IPS", "SIEM", "SOC", "Incident Response", "Forensics",
                    "GDPR", "KVKK", "HIPAA", "PCI DSS", "ISO 27001", "Security Compliance"
            ))
    );

    // =================================================================================
    // 🚀 ANA SERVİS METODU
    // =================================================================================
    @Override
    @Transactional
    public JobAnalysisResponse analyzeJobPosting(Long userId, String url) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Map<String, String> scrapedData = scraper.fetchJobData(url);

        String jobContent = scrapedData.getOrDefault("jobContent", scrapedData.getOrDefault("fullText", ""));
        String structuredData = scrapedData.getOrDefault("structuredData", "");
        String metaLocation = scrapedData.getOrDefault("location", "");
        String metaCompany = scrapedData.getOrDefault("company", "");
        String pageTitle = scrapedData.getOrDefault("pageTitle", "");

        JobExtractedData extractedData = extractAllData(
                jobContent, structuredData, metaLocation, metaCompany, pageTitle, url
        );
        List<String> userSkills = getUserSkillsNormalized(user);

        Map<String, List<String>> categorizedSkills = analyzeTechnicalSkills(extractedData.getJobTextLower());
        Set<String> allFoundSkills = new LinkedHashSet<>();
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        categorizedSkills.values().forEach(allFoundSkills::addAll);

        for (String skill : allFoundSkills) {
            if (isUserHasSkill(userSkills, skill)) {
                matchedSkills.add(skill);
            } else {
                missingSkills.add(skill);
            }
        }

        missingSkills = filterRedundantSkills(missingSkills, extractedData.getJobTextLower());
        matchedSkills = filterRedundantSkills(matchedSkills, extractedData.getJobTextLower());

        String report = generateReport(
                extractedData,
                categorizedSkills,
                missingSkills,
                userSkills.size(),
                matchedSkills.size(),
                allFoundSkills.size()
        );

        JobPosting jp = saveJobPosting(
                user,
                url,
                jobContent,
                allFoundSkills,
                extractedData.getResponsibilities(),
                report
        );

        return JobAnalysisResponse.builder()
                .jobId(jp.getId())
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .formattedAnalysis(report)
                .build();
    }

    // =================================================================================
    // 🛠️ EXTRACTION METODLARI
    // =================================================================================

    private JobExtractedData extractAllData(String content, String structuredData,
                                            String metaLocation, String metaCompany,
                                            String pageTitle, String url) {
        JobExtractedData data = new JobExtractedData();
        String cleaned = cleanText(content);
        String textLower = cleaned.toLowerCase(new Locale("tr", "TR"));

        data.setJobTextLower(textLower);

        if (structuredData != null && !structuredData.isEmpty()) {
            extractFromStructuredData(structuredData, data);
        }

        if (data.getJobTitle() == null || data.getJobTitle().isEmpty()) {
            data.setJobTitle(extractJobTitle(cleaned, textLower, pageTitle));
        }

        if (data.getCompanyName() == null || data.getCompanyName().isEmpty()) {
            data.setCompanyName(!metaCompany.isEmpty() ? metaCompany : extractCompanyName(url, cleaned));
        }

        if (data.getResponsibilities() == null || data.getResponsibilities().isEmpty()) {
            data.setResponsibilities(extractResponsibilities(cleaned));
        }

        return data;
    }

    private void extractFromStructuredData(String jsonLd, JobExtractedData data) {
        try {
            if (jsonLd.contains("\"title\"") || jsonLd.contains("\"Title\"")) {
                Pattern titlePattern = Pattern.compile("\"(?:title|Title)\"\\s*:\\s*\"([^\"]+)\"");
                Matcher m = titlePattern.matcher(jsonLd);
                if (m.find()) {
                    String title = m.group(1).replace("\\", "");
                    if (title.length() > 3 && title.length() < 100) {
                        data.setJobTitle(title);
                    }
                }
            }

            if (jsonLd.contains("\"hiringOrganization\"") || jsonLd.contains("\"employer\"")) {
                Pattern companyPattern = Pattern.compile("\"(?:name|Name)\"\\s*:\\s*\"([^\"]+)\"");
                Matcher m = companyPattern.matcher(jsonLd);
                if (m.find()) {
                    String company = m.group(1).replace("\\", "");
                    if (company.length() > 2) {
                        data.setCompanyName(company);
                    }
                }
            }

        } catch (Exception e) {
            // loglanabilir
        }
    }

    private String extractJobTitle(String text, String textLower, String pageTitle) {
        if (pageTitle != null && !pageTitle.isEmpty()) {
            String cleanPageTitle = cleanTitle(pageTitle);
            if (isValidJobTitle(cleanPageTitle)) {
                return cleanPageTitle;
            }
        }

        Pattern positionPattern = Pattern.compile(
                "(?:Pozisyon|İlan|İş Adı|Position|Job Title)[\\s:]*([^\\n]{5,60})",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS
        );
        Matcher matcher = positionPattern.matcher(text);
        if (matcher.find()) {
            String title = matcher.group(1).trim();
            title = cleanJobTitle(title);
            if (isValidJobTitle(title)) {
                return title;
            }
        }

        String[] lines = text.split("\n");
        for (int i = 0; i < Math.min(10, lines.length); i++) {
            String line = lines[i].trim();
            if (line.length() > 10 && line.length() < 70 && !line.contains("http") && !line.contains("@")) {
                String lineLower = line.toLowerCase(new Locale("tr", "TR"));
                if ((lineLower.matches(".*(yazılım|software|mühendis|uzman|developer|analist|danışman|tasarımcı|lead|architect).*") ||
                        lineLower.matches(".*(engineer|specialist|consultant|designer|manager).*")) &&
                        !lineLower.contains("ilan") && !lineLower.contains("kariyer") &&
                        !lineLower.contains("tarih") && !lineLower.matches(".*\\d{1,2}\\.\\d{1,2}\\.\\d{4}.*")) {
                    String cleanedLine = cleanJobTitle(line);
                    return cleanedLine;
                }
            }
        }

        Pattern techPattern = Pattern.compile(
                "\\b(?:(?:Senior|Junior|Lead|Principal)\\s+)?(?:Backend|Frontend|Full[\\s-]?Stack|Mobile|Android|iOS|Java|Python|\\.NET|React|Node\\.js|DevOps|Data|Test|QA|ERP|SAP|Embedded)\\s+(?:Developer|Engineer|Specialist|Architect|Consultant|Analyst)\\b",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS
        );
        matcher = techPattern.matcher(text);
        if (matcher.find()) {
            return cleanJobTitle(matcher.group());
        }

        return "Yazılım Pozisyonu";
    }

    private String cleanJobTitle(String title) {
        if (title == null || title.isEmpty()) return title;

        title = title.replaceAll("\\s*[-–]\\s*\\d{1,2}\\.\\d{1,2}\\.\\d{4}.*", "")
                .replaceAll("\\s*[-–]\\s*\\d{4}-\\d{1,2}-\\d{1,2}.*", "")
                .replaceAll("\\s*\\(\\d{1,2}\\.\\d{1,2}\\.\\d{4}\\).*", "")
                .replaceAll("\\s*\\|.*", "")
                .replaceAll("\\s*-\\s*$", "");

        if (title.matches(".*\\b(?:A\\.Ş\\.|Ltd\\.|Şti\\.|Inc\\.|Corp\\.)\\s*$")) {
            title = title.replaceAll("\\b(?:A\\.Ş\\.|Ltd\\.|Şti\\.|Inc\\.|Corp\\.)\\s*$", "").trim();
        }

        String[] commonCompanySuffixes = {"A.Ş.", "Ltd.", "Şti.", "Inc.", "Corp.", "Company", "Firması", "Şirketi"};
        for (String suffix : commonCompanySuffixes) {
            Pattern pattern = Pattern.compile("^.*?" + Pattern.quote(suffix) + "\\s+(.+)$", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(title);
            if (matcher.find()) {
                title = matcher.group(1).trim();
                break;
            }
        }

        return title.trim();
    }

    private String cleanTitle(String title) {
        String cleaned = title.replaceAll("\\s*-\\s*Kariyer\\.net.*", "")
                .replaceAll("\\s*-\\s*LinkedIn.*", "")
                .replaceAll("\\s*-\\s*Yenibiriş.*", "")
                .replaceAll("\\s*\\|.*", "")
                .replaceAll("İş İlanı", "")
                .replaceAll("Job Posting", "")
                .trim();

        return cleanJobTitle(cleaned);
    }

    private boolean isValidJobTitle(String title) {
        if (title == null || title.length() < 3 || title.length() > 100) return false;

        String lower = title.toLowerCase(new Locale("tr", "TR"));
        if (lower.matches(".*(ana sayfa|homepage|giriş yap|login|kayıt ol|register|şifremi unuttum).*")) {
            return false;
        }

        if (lower.matches(".*\\d{1,2}\\.\\d{1,2}\\.\\d{4}.*") || lower.matches(".*\\d{4}-\\d{1,2}-\\d{1,2}.*")) {
            return false;
        }

        return lower.matches(".*(yazılım|software|mühendis|developer|engineer|uzman|specialist|analist|analyst|tasarımcı|designer).*") ||
                lower.matches(".*(java|python|\\.net|react|node|angular|vue|flutter|android|ios|devops|data|test).*");
    }

    // =================================================================================
    // 🔍 TEKNİK YETKİNLİK ANALİZİ
    // =================================================================================
    private Map<String, List<String>> analyzeTechnicalSkills(String textLower) {
        Map<String, List<String>> categorized = new LinkedHashMap<>();
        Set<String> alreadyFound = new HashSet<>();

        KNOWLEDGE_BASE.forEach((category, keywords) -> {
            List<String> foundInCat = new ArrayList<>();

            for (String key : keywords) {
                if (isTechnicalTermValid(textLower, key, alreadyFound)) {
                    foundInCat.add(key);
                    alreadyFound.add(key.toLowerCase(new Locale("tr", "TR")));
                    removeRedundantShorterTerms(key, alreadyFound);
                }
            }

            if (!foundInCat.isEmpty()) {
                categorized.put(category, foundInCat);
            }
        });

        return categorized;
    }

    /**
     * C, C#, C++ ayrımı dahil teknik terim var mı kontrolü
     */
    private boolean isTechnicalTermValid(String text, String term, Set<String> alreadyFound) {
        String textLower = text.toLowerCase(new Locale("tr", "TR"));
        String termLower = term.toLowerCase(new Locale("tr", "TR"));

        // 🔹 Özel durum: "C" dili
        if (termLower.equals("c")) {
            Pattern cPattern = Pattern.compile(
                    "(?<![\\p{L}\\p{N}])c(?![#\\+\\p{L}\\p{N}])",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS
            );
            if (cPattern.matcher(textLower).find()) {
                return !isFalsePositive(term, textLower, alreadyFound);
            }
            return false; // sadece C#, C++ içinde geçiyorsa C olarak SAYMA
        }

        // 🔹 Özel karakter içeren terimler (C#, C++, .NET vs.)
        if (term.matches(".*[.#+].*")) {
            Pattern pattern = Pattern.compile(
                    "(?<![\\p{L}\\p{N}])" + Pattern.quote(termLower) + "(?![\\p{L}\\p{N}])",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS
            );
            return pattern.matcher(textLower).find();
        }

        // 🔹 Normal kelimeler
        String regex = "(?<![\\p{L}\\p{N}])" + Pattern.quote(termLower) + "(?![\\p{L}\\p{N}])";
        Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS);

        if (pattern.matcher(textLower).find()) {
            return !isFalsePositive(term, textLower, alreadyFound);
        }

        return false;
    }

    private boolean isFalsePositive(String term, String textLower, Set<String> alreadyFound) {
        if (term.equalsIgnoreCase("java") && textLower.contains("javascript")) {
            if (alreadyFound.contains("javascript") || textLower.matches(".*\\bjavascript\\b.*")) {
                return true;
            }
        }

        if (term.equalsIgnoreCase("spring") && textLower.contains("spring boot")) {
            if (alreadyFound.contains("spring boot") || textLower.matches(".*\\bspring boot\\b.*")) {
                return true;
            }
        }

        if (term.equalsIgnoreCase("c#") && textLower.contains(".net")) {
            if (alreadyFound.contains(".net") || textLower.matches(".*\\.net\\b.*")) {
                return false;
            }
        }

        if (term.equalsIgnoreCase("javascript") && textLower.contains("node.js")) {
            return false;
        }

        return false;
    }

    private void removeRedundantShorterTerms(String longTerm, Set<String> alreadyFound) {
        String longTermLower = longTerm.toLowerCase(new Locale("tr", "TR"));
        Set<String> toRemove = new HashSet<>();
        for (String term : alreadyFound) {
            if (!term.equals(longTermLower) &&
                    longTermLower.contains(term) &&
                    term.length() < longTermLower.length()) {
                toRemove.add(term);
            }
        }
        alreadyFound.removeAll(toRemove);
    }

    // =================================================================================
    // 🎯 GEREKSİZ YETKİNLİKLERİ FİLTRELEME
    // =================================================================================
    private List<String> filterRedundantSkills(List<String> skills, String jobTextLower) {
        if (skills == null || skills.isEmpty()) return skills;

        List<String> filtered = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (String skill : skills) {
            String skillLower = skill.toLowerCase(new Locale("tr", "TR"));

            if (skillLower.matches("(programlama|yazılım|teknoloji|bilgisayar|sistem|bilişim|it|software|technology|computer)")) {
                continue;
            }

            if (!isSkillInValidContext(skill, jobTextLower)) {
                continue;
            }

            boolean isRedundant = false;
            for (String existing : seen) {
                if (isRedundantSkill(skillLower, existing)) {
                    isRedundant = true;
                    break;
                }
            }

            if (!isRedundant && !seen.contains(skillLower)) {
                filtered.add(skill);
                seen.add(skillLower);
            }
        }

        return filtered.stream()
                .sorted((s1, s2) -> {
                    int lengthCompare = Integer.compare(s2.length(), s1.length());
                    if (lengthCompare != 0) return lengthCompare;
                    return s1.compareTo(s2);
                })
                .collect(Collectors.toList());
    }

    private boolean isRedundantSkill(String newSkill, String existingSkill) {
        if (newSkill.contains(existingSkill) || existingSkill.contains(newSkill)) {
            return newSkill.length() <= existingSkill.length();
        }

        Map<String, String> synonyms = Map.of(
                "golang", "go",
                "typescript", "javascript",
                "asp.net", ".net",
                "node.js", "node",
                "spring boot", "spring",
                "react.js", "react",
                "vue.js", "vue",
                "angular 2+", "angular",
                "django rest", "django",
                "asp.net core", "asp.net"
        );

        String synonym1 = synonyms.get(newSkill.toLowerCase());
        String synonym2 = synonyms.get(existingSkill.toLowerCase());

        return (synonym1 != null && synonym1.equalsIgnoreCase(existingSkill)) ||
                (synonym2 != null && synonym2.equalsIgnoreCase(newSkill));
    }

    private boolean isSkillInValidContext(String skill, String jobTextLower) {
        String skillLower = skill.toLowerCase(new Locale("tr", "TR"));

        Pattern contextPattern = Pattern.compile(
                "([^.!?]{0,150}" + Pattern.quote(skillLower) + "[^.!?]{0,150})",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS
        );

        Matcher matcher = contextPattern.matcher(jobTextLower);
        if (matcher.find()) {
            String context = matcher.group(1).toLowerCase(new Locale("tr", "TR"));

            return context.matches(".*\\b(?:tecrübe|deneyim|bilgi|beceri|yetenek|tercih|aranan|gereksinim|gerektirir|istiyoruz|yeterlilik|teknolojisi|teknoloji|framework|kütüphane|dili|language|tool|araç|platform|ortam|environment)\\b.*") ||
                    context.matches(".*\\b(?:experience|knowledge|skill|requirement|preferred|required|qualification|technology|framework|library|language|tool|platform|environment)\\b.*") ||
                    context.contains("teknolojiler") || context.contains("teknoloji") ||
                    context.contains("skills") || context.contains("requirements");
        }

        return true;
    }

    // =================================================================================
    // 🎯 DİĞER EXTRACTION METODLARI
    // =================================================================================
    private String extractCompanyName(String url, String text) {
        if (url.contains("kariyer.net")) {
            Pattern pattern = Pattern.compile("kariyer\\.net/is-ilan[Ii]/([a-zA-Z0-9-]+)-");
            Matcher matcher = pattern.matcher(url);
            if (matcher.find()) {
                String slug = matcher.group(1);
                String[] parts = slug.split("-");
                if (parts.length > 0) {
                    String company = capitalizeWords(parts[0].replace("-", " "));
                    if (company.length() > 1) return company;
                }
            }
        }

        Pattern companyPattern = Pattern.compile(
                "(?:Firma|Şirket|Company|Kurum)[\\s:]*([^\\n]{3,50})",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS
        );
        Matcher matcher = companyPattern.matcher(text);
        if (matcher.find()) {
            String company = matcher.group(1).trim();
            if (company.length() > 2 && !company.matches(".*\\d.*")) {
                return capitalizeWords(company);
            }
        }

        return "Firma Bilgisi Belirtilmemiş";
    }

    private List<String> extractResponsibilities(String text) {
        List<String> responsibilities = new ArrayList<>();
        String[] lines = text.split("\n");
        boolean captureMode = false;
        String currentSection = "";

        for (String line : lines) {
            String cleanLine = line.trim();
            if (cleanLine.length() < 5) continue;

            String lower = cleanLine.toLowerCase(new Locale("tr", "TR"));

            if (lower.matches("^(iş tanımı|sorumluluklar|görevler|neler yapacaksınız|neler yapacak|responsibilities|duties|pozisyonun gereklilikleri).*")) {
                captureMode = true;
                currentSection = "responsibilities";
                continue;
            }

            if (captureMode && lower.matches("^(aranan nitelikler|aday profili|gereksinimler|qualifications|requirements|beceriler|skills|eğitim|deneyim|kazanımlar).*")) {
                captureMode = false;
                break;
            }

            if (captureMode && currentSection.equals("responsibilities")) {
                if (cleanLine.matches("^[•\\-*►▪→➢\\d\\.].*")) {
                    String content = cleanLine.replaceAll("^[•\\-*►▪→➢\\d\\.]+\\s*", "").trim();
                    if (content.length() > 15 && content.length() < 300) {
                        responsibilities.add(content);
                    }
                } else if (!responsibilities.isEmpty() && cleanLine.length() < 150) {
                    String last = responsibilities.get(responsibilities.size() - 1);
                    if (last.length() + cleanLine.length() < 350) {
                        responsibilities.set(responsibilities.size() - 1, last + " " + cleanLine);
                    }
                }
            }
        }

        if (responsibilities.isEmpty()) {
            for (String line : lines) {
                if (line.trim().matches("^[•\\-*].+")) {
                    String content = line.replaceAll("^[•\\-*]+\\s*", "").trim();
                    if (content.length() > 20 && content.length() < 300) {
                        responsibilities.add(content);
                    }
                }
            }
        }

        if (responsibilities.isEmpty()) {
            responsibilities.add("İlan detaylarında belirtilen görevleri yerine getirmek");
            responsibilities.add("Proje süreçlerine aktif katılım sağlamak");
            responsibilities.add("Teknik analiz ve geliştirme çalışmaları yapmak");
        }

        return responsibilities.size() > 10 ? responsibilities.subList(0, 10) : responsibilities;
    }

    private String cleanText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
    }

    private String capitalizeWords(String text) {
        if (text == null || text.isEmpty()) return text;
        return Arrays.stream(text.split("\\s+"))
                .map(w -> w.isEmpty() ? "" :
                        Character.toUpperCase(w.charAt(0)) +
                                w.substring(1).toLowerCase(new Locale("tr", "TR")))
                .collect(Collectors.joining(" "));
    }

    private List<String> getUserSkillsNormalized(User user) {

        // ✔ Profil yoksa boş liste dön
        if (user.getProfile() == null || user.getProfile().getSkills() == null) {
            return new ArrayList<>();
        }

        return user.getProfile().getSkills().stream()
                .map(UserSkill::getSkillName)
                .filter(Objects::nonNull)
                .map(s -> s.toLowerCase(new Locale("tr", "TR")).trim())
                .collect(Collectors.toList());
    }


    private boolean isUserHasSkill(List<String> userSkills, String skill) {
        String skillLower = skill.toLowerCase(new Locale("tr", "TR"));

        if (userSkills.contains(skillLower)) return true;

        for (String userSkill : userSkills) {
            if (skillLower.contains(userSkill) || userSkill.contains(skillLower)) {
                return true;
            }
        }

        return false;
    }

    private String generateReport(JobExtractedData data,
                                  Map<String, List<String>> categorizedSkills,
                                  List<String> missing,
                                  int userSkillsCount,
                                  int matchedSkillsCount,
                                  int totalRequiredSkills) {

        StringBuilder sb = new StringBuilder();
        sb.append("### **İŞ İLANI ANALİZİ**\n\n");
        sb.append("**🏢 Pozisyon:** ").append(data.getJobTitle()).append("\n");
        sb.append("**🏭 Firma:** ").append(data.getCompanyName()).append("\n\n");

        sb.append("#### 🛠️ **Teknik Yetkinlikler**\n");
        if (categorizedSkills.isEmpty()) {
            sb.append("*İlan metninde teknik detay tespit edilemedi.*\n");
        } else {
            categorizedSkills.forEach((cat, skills) ->
                    sb.append("**").append(cat).append(":** ")
                            .append(String.join(", ", skills))
                            .append("\n"));
        }

        sb.append("\n#### 📝 **Sorumluluklar**\n");
        if (data.getResponsibilities().isEmpty()) {
            sb.append("*Sorumluluklar belirtilmemiş.*\n");
        } else {
            data.getResponsibilities().forEach(r -> sb.append("- ").append(r).append("\n"));
        }

        sb.append("\n#### 💡 **Değerlendirme**\n");

        if (userSkillsCount == 0) {
            sb.append("⚠️ **Profilinizde henüz yetkinlik bulunmuyor.**\n\n");
            sb.append("Profilinize yetkinlik ekleyerek daha doğru analiz alabilirsiniz.\n");
            if (!categorizedSkills.isEmpty()) {
                sb.append("\n**Bu pozisyon için öne çıkan yetkinlikler:**\n");
                categorizedSkills.values().stream()
                        .flatMap(List::stream)
                        .limit(10)
                        .forEach(skill -> sb.append("- ").append(skill).append("\n"));
            }
        } else if (matchedSkillsCount == 0 && totalRequiredSkills > 0) {
            sb.append("❌ **Profiliniz bu pozisyonun gerektirdiği yetkinliklerle eşleşmiyor.**\n\n");
            sb.append("**Geliştirmeniz gereken yetkinlikler:**\n");
            missing.stream().limit(10)
                    .forEach(m -> sb.append("- **").append(m).append("**\n"));
        } else if (matchedSkillsCount > 0 && missing.size() > 0) {
            double matchPercentage = (double) matchedSkillsCount / totalRequiredSkills * 100;
            sb.append("📊 **Eşleşme Oranı:** %")
                    .append(String.format("%.1f", matchPercentage))
                    .append("\n");
            sb.append("**Eşleşen Yetkinlikler:** ")
                    .append(matchedSkillsCount)
                    .append(" / ")
                    .append(totalRequiredSkills)
                    .append("\n\n");

            if (matchPercentage >= 70) {
                sb.append("✅ **Güçlü bir adaysınız!** Bu pozisyon için başvurabilirsiniz.\n");
            } else if (matchPercentage >= 40) {
                sb.append("⚠️ **Orta seviye eşleşme.** Eksik yetkinlikleri geliştirmeniz faydalı olacaktır.\n");
            } else {
                sb.append("❌ **Düşük eşleşme.** Bu pozisyon için temel yetkinlikleri öğrenmeniz gerekiyor.\n");
            }

            if (!missing.isEmpty()) {
                sb.append("\n**Öncelikli geliştirmeniz gerekenler:**\n");
                missing.stream().limit(8)
                        .forEach(m -> sb.append("- ").append(m).append("\n"));
            }
        } else if (matchedSkillsCount > 0 && missing.isEmpty()) {
            sb.append("🎉 **Mükemmel uyum!** Tüm gereken yetkinliklere sahipsiniz.\n");
            sb.append("Bu pozisyon için başvurmaktan çekinmeyin!\n");
        } else {
            sb.append("📋 **Detaylı analiz için ilanın orijinalini inceleyin.**\n");
        }

        return sb.toString();
    }

    private JobPosting saveJobPosting(User user, String url, String rawText,
                                      Set<String> skills,
                                      List<String> responsibilities,
                                      String report) {
        String cleanText = rawText.length() > 4000
                ? rawText.substring(0, 3997) + "..."
                : rawText;
        JobPosting jp = JobPosting.builder()
                .user(user)
                .url(url)
                .cleanedText(cleanText)
                .requiredSkills(String.join(", ", skills))
                .responsibilities(String.join("; ", responsibilities))
                .analysisReport(report)
                .createdAt(new Date())
                .build();
        return jobPostingRepository.save(jp);
    }

    @Data
    private static class JobExtractedData {
        private String jobTitle;
        private String companyName;
        private String location;
        private String workType;
        private String experience;
        private String education;
        private List<String> responsibilities = new ArrayList<>();
        private List<String> softSkills = new ArrayList<>();
        private String jobTextLower;
    }
}
