import React, { useState } from "react";
import "./CVPreview.css";

const CVPreview = ({ user, aiData, language = "tr" }) => {
  if (!user) {
    return <div className="loading-msg">Kullanıcı verisi bekleniyor...</div>;
  }

  // --- 1. DİL SÖZLÜĞÜ (SABİT BAŞLIKLAR İÇİN) ---
  const LABELS = {
    tr: {
      summary: "ÖZET",
      experience: "DENEYİM",
      education: "EĞİTİM",
      projects: "PROJELER",
      skills: "YETENEKLER",
      languages: "DİLLER",
      certificates: "SERTİFİKALAR",
      present: "Devam Ediyor",
      changeText: "Metni Değiştir"
    },
    en: {
      summary: "SUMMARY",
      experience: "EXPERIENCE",
      education: "EDUCATION",
      projects: "PROJECTS",
      skills: "SKILLS",
      languages: "LANGUAGES",
      certificates: "CERTIFICATES",
      present: "Present",
      changeText: "Change Text"
    }
  };

  const t = LABELS[language];

  // --- 2. YARDIMCI FONKSİYONLAR ---
  
  const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  };

  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/[#*_`>]/g, "").replace(/\s{2,}/g, " ").trim();
  };

  const getLanguageLevelText = (level) => {
    if (!level) return "";
    const normalized = level.toUpperCase();
    const mapTR = { "BEGINNER": "Başlangıç", "INTERMEDIATE": "Orta", "ADVANCED": "İleri", "NATIVE": "Ana Dil" };
    const mapEN = { "BEGINNER": "Beginner", "INTERMEDIATE": "Intermediate", "ADVANCED": "Advanced", "NATIVE": "Native" };
    const map = language === "tr" ? mapTR : mapEN;
    return map[normalized] || level; 
  };

  const formatDate = (dateString, isOngoing) => {
    if (isOngoing) return t.present;
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return dateString;
      return date.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
        year: "numeric",
        month: language === "tr" ? "long" : "short"
      });
    } catch {
      return dateString;
    }
  };

  // --- 3. VERİ HAZIRLIĞI ---

  const baseSummary = aiData?.summary || user.summary || user.aboutMe || "";
  const summaries = aiData?.summaries && aiData.summaries.length > 0
      ? aiData.summaries
      : baseSummary ? [baseSummary] : [];
  const [summaryIndex, setSummaryIndex] = useState(0);

  const handleChangeSummary = () => {
    if (summaries.length <= 1) return;
    setSummaryIndex((prev) => (prev + 1) % summaries.length);
  };
  const currentSummary = summaries[summaryIndex] || "";

  const userData = {
    fullName: user.fullName || user.adSoyad || "İSİM GİRİLMEDİ",
    title: user.title || user.preferredJobRoles || "",
    email: user.email || "",
    phone: user.phone || user.phoneNumber || "",
    location: user.location || user.address || "",
    summary: currentSummary,
    skills: aiData?.skills || user.skills || user.technicalSkills || [],
    languages: aiData?.languages || user.languages || [],
    certificates: aiData?.certificates || user.certificates || [],
    linkedinUrl: user.linkedinUrl || user.profile?.linkedinUrl || user.linkedin || "",
    githubUrl: user.githubUrl || user.profile?.githubUrl || user.github || "",
    websiteUrl: user.websiteUrl || user.profile?.websiteUrl || user.website || "",
  };

  const experienceList = aiData?.optimizedExperiences?.length > 0 ? aiData.optimizedExperiences : user.experiences || [];
  
  const projectList = aiData?.optimizedProjects?.length > 0 
    ? aiData.optimizedProjects 
    : (aiData?.optimizedUserProjects?.length > 0 ? aiData.optimizedUserProjects : user.projects || []);

  let educationList = aiData?.optimizedEducation?.length > 0 
    ? aiData.optimizedEducation 
    : (user.education || []);

  if (educationList.length === 0 && (user.educationSchool || user.university)) {
    educationList.push({
      university: user.educationSchool || user.university,
      degree: user.educationDegree || user.educationLevel,
      field: user.educationDepartment || user.department,
      startYear: user.educationStartYear,
      graduationYear: user.educationEndYear,
    });
  }

  // --- 4. RENDER ---
  return (
    <div id="cv-preview" className="cv-container">
      
      {/* HEADER */}
      <header className="cv-header">
        <h1 className="full-name">{userData.fullName}</h1>
        {userData.title && <div className="title-role">{userData.title}</div>}
        
        <div className="contact-info">
          {userData.email} 
          {userData.phone && ` | ${userData.phone}`}
          {userData.location && ` | ${userData.location}`}
        </div>

        <div className="social-links">
          {userData.linkedinUrl && (
            <div className="social-item"><a href={normalizeUrl(userData.linkedinUrl)} target="_blank" rel="noreferrer">LinkedIn</a></div>
          )}
          {userData.githubUrl && (
            <div className="social-item"><a href={normalizeUrl(userData.githubUrl)} target="_blank" rel="noreferrer">GitHub</a></div>
          )}
          {userData.websiteUrl && (
            <div className="social-item"><a href={normalizeUrl(userData.websiteUrl)} target="_blank" rel="noreferrer">Portfolio</a></div>
          )}
        </div>
      </header>

      {/* SUMMARY */}
      {userData.summary && (
        <section className="cv-section">
          <h2 className="section-title">{t.summary}</h2>
          {summaries.length > 1 && (
            <div className="summary-title-wrapper pdf-exclude" style={{ justifyContent: 'flex-end', display: 'flex' }}>
              <button type="button" className="summary-change-button" onClick={handleChangeSummary}>
                {t.changeText} ({summaryIndex + 1}/{summaries.length})
              </button>
            </div>
          )}
          <p className="summary-text">{cleanText(userData.summary)}</p>
        </section>
      )}

      {/* EXPERIENCE */}
      {experienceList.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">{t.experience}</h2>
          <div className="section-content">
            {experienceList.map((exp, index) => {
              const pos = exp.position || exp.title;
              const comp = exp.company || exp.companyName || exp.subtitle;
              const start = exp.startDate || (exp.date ? exp.date.split(' - ')[0] : "");
              const end = exp.endDate || (exp.date ? exp.date.split(' - ')[1] : "");
              const dateDisplay = (exp.date && exp.date.length > 10) ? exp.date : `${formatDate(start)} - ${formatDate(end, exp.isOngoing)}`;

              return (
                <div key={index} className="experience-item">
                  <div className="row-space-between">
                    <div className="job-title">{pos}</div>
                    <div className="dates">{dateDisplay}</div>
                  </div>
                  <div className="row-space-between">
                    <div className="company-info">{comp}</div>
                    {exp.location && <div className="location">{exp.location}</div>}
                  </div>
                  
                  {Array.isArray(exp.description) ? (
                    <ul className="responsibilities">
                      {exp.description.map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                    </ul>
                  ) : (
                    <p className="description">{cleanText(exp.description)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* EDUCATION */}
      {educationList.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">{t.education}</h2>
          <div className="section-content">
            {educationList.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="row-space-between">
                  <div className="university">{edu.university || edu.educationSchool}</div>
                  <div className="education-dates">
                    {formatDate(edu.startYear || edu.startDate)} - {formatDate(edu.graduationYear || edu.endDate, edu.isOngoing)}
                  </div>
                </div>
                <div className="degree">
                   {edu.degree} {edu.field ? `, ${edu.field}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROJECTS (DÜZELTİLDİ: Sınıf ismi 'responsibilities' yapıldı) */}
      {projectList.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">{t.projects}</h2>
          <div className="section-content">
            {projectList.map((proj, index) => {
              const name = proj.name || proj.title || proj.projectName;
              const dateDisplay = (proj.date && proj.date.length > 10)
                  ? proj.date
                  : `${formatDate(proj.startDate)} - ${formatDate(proj.endDate, proj.isOngoing)}`;

              return (
                <div key={index} className="project-item">
                  <div className="row-space-between">
                    <div className="project-title">{name}</div>
                    <div className="project-dates">{dateDisplay}</div>
                  </div>
                  {Array.isArray(proj.description) ? (
                    // 🔥 BURASI DÜZELTİLDİ: project-description-list YERİNE responsibilities
                    <ul className="responsibilities">
                      {proj.description.map((d, i) => <li key={i}>{cleanText(d)}</li>)}
                    </ul>
                  ) : (
                    <p className="description">{cleanText(proj.description)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SKILLS */}
      {userData.skills.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">{t.skills}</h2>
          <div className="skills-grid">
            {userData.skills.map((skill, index) => (
              <div key={index} className="skill-item">
                {typeof skill === "object" ? skill.name || skill.skillName : skill}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LANGUAGES */}
      {userData.languages.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">{t.languages}</h2>
          <div className="languages-grid">
            {userData.languages.map((lang, index) => (
               <div key={index} className="language-item">
                 <span style={{ fontWeight: "600" }}>{lang.language}</span>
                 {lang.level && <span className="language-level"> - {getLanguageLevelText(lang.level)}</span>}
               </div>
            ))}
          </div>
        </section>
      )}

      {/* CERTIFICATES */}
      {userData.certificates.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">{t.certificates}</h2>
          <div className="section-content">
            {userData.certificates.map((cert, index) => {
               const certDate = cert.date ? cert.date : formatDate(cert.issueDate);
               return (
                <div key={index} className="certificate-item">
                  <div className="row-space-between">
                    <div className="job-title" style={{ fontSize: "11pt", fontWeight: "500" }}>{cert.name}</div>
                    <div className="dates">{certDate}</div>
                  </div>
                  {cert.issuer && <div className="certificate-issuer">{cert.issuer}</div>}
                </div>
               );
            })}
          </div>
        </section>
      )}

    </div>
  );
};

export default CVPreview;