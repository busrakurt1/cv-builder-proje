// src/components/cv/CVPreview.jsx
import React from "react";
import "./CVPreview.css";

const CVPreview = ({ user, aiData }) => {
  if (!user) {
    return <div className="loading-msg">Kullanıcı verisi bekleniyor...</div>;
  }

  // --- YARDIMCI FONKSİYONLAR (Orijinal Mantık Korundu) ---
  
  const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const getUrlSlug = (url) => {
    if (!url) return "";
    try {
      const u = new URL(normalizeUrl(url));
      // Sadece domain ve path'i temiz gösterelim (örn: linkedin.com/in/adsoyad)
      return u.hostname + u.pathname.replace(/\/$/, ""); 
    } catch {
      return url;
    }
  };

  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/[#*_`>]/g, "").replace(/\s{2,}/g, " ").trim();
  };

  const getLanguageLevelText = (level) => {
    const levels = {
      A1: "Beginner", A2: "Elementary",
      B1: "Intermediate", B2: "Upper Intermediate",
      C1: "Advanced", C2: "Proficient",
      NATIVE: "Native", BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate", ADVANCED: "Advanced",
    };
    return levels[level] || level;
  };

  // --- VERİ HAZIRLIĞI ---

  const userData = {
    fullName: user.fullName || user.adSoyad || "İSİM GİRİLMEDİ",
    title: user.title || user.preferredJobRoles || "",
    email: user.email || "",
    phone: user.phone || user.phoneNumber || "",
    location: user.location || user.address || "",
    summary: aiData?.summary || user.summary || user.aboutMe || "",
    skills: aiData?.skills || user.skills || user.technicalSkills || [],
    languages: aiData?.languages || user.languages || [],
    certificates: aiData?.certificates || user.certificates || [],
    
    linkedinUrl: user.linkedinUrl || user.profile?.linkedinUrl || user.linkedin || "",
    githubUrl: user.githubUrl || user.profile?.githubUrl || user.github || "",
    websiteUrl: user.websiteUrl || user.profile?.websiteUrl || user.website || "",
  };

  // EĞİTİM LİSTESİ HAZIRLIĞI
  let educationList = [];
  if (aiData?.optimizedEducation?.length > 0) {
    educationList = aiData.optimizedEducation;
  } else if (Array.isArray(user.education) && user.education.length > 0) {
    educationList = user.education;
  } else if (user.educationSchool || user.university) {
    educationList.push({
      university: user.educationSchool || user.profile?.educationSchool || user.university,
      degree: user.educationDegree || user.profile?.educationDegree || user.educationLevel,
      field: user.educationDepartment || user.profile?.educationDepartment || user.department,
      startYear: user.educationStartYear || user.profile?.educationStartYear,
      graduationYear: user.educationEndYear || user.profile?.educationEndYear || user.graduationYear,
    });
  }

  // DENEYİM VE PROJE LİSTELERİ
  const experienceList = aiData?.optimizedExperiences?.length > 0 
    ? aiData.optimizedExperiences 
    : user.experiences || [];

  const projectList = aiData?.optimizedProjects?.length > 0
    ? aiData.optimizedProjects
    : aiData?.optimizedUserProjects?.length > 0
    ? aiData.optimizedUserProjects
    : user.projects || [];

  // --- DATA FORMATLAMA (AI ve User format farkını kapatmak için) ---
  
  const formatExperienceItem = (exp) => {
    // AI Formatı
    if (exp.title && exp.subtitle) {
      return {
        position: exp.title,
        company: exp.subtitle,
        date: exp.date || "",
        description: exp.description || [],
        location: exp.location || ""
      };
    }
    // Standart User Formatı
    const start = exp.startDate ? new Date(exp.startDate).toLocaleDateString("tr-TR", { year: "numeric", month: "short" }) : "";
    const end = exp.isOngoing ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString("tr-TR", { year: "numeric", month: "short" }) : "";
    
    return {
      position: exp.position || exp.title,
      company: exp.company || exp.companyName,
      date: (start || end) ? `${start} - ${end}` : "",
      description: exp.description,
      location: exp.location
    };
  };

  const formatProjectItem = (proj) => {
    // AI Formatı
    if (proj.title && proj.subtitle) {
      return {
        name: proj.title,
        description: proj.description || [],
        date: proj.date || ""
      };
    }
    // User Project DTO
    if (proj.projectName) {
       const start = proj.startDate ? new Date(proj.startDate).toLocaleDateString("tr-TR", { year: "numeric", month: "short" }) : "";
       const end = proj.isOngoing ? "Present" : proj.endDate ? new Date(proj.endDate).toLocaleDateString("tr-TR", { year: "numeric", month: "short" }) : "";
       return {
         name: proj.projectName,
         date: (start || end) ? `${start} - ${end}` : "",
         description: proj.description,
         isOngoing: proj.isOngoing
       };
    }
    return proj;
  };

  return (
    <div id="cv-preview" className="cv-container">
      
      {/* --- HEADER (DR. MORGAN STYLE - ORTALANMIŞ) --- */}
      <header className="cv-header">
        <h1 className="full-name">{userData.fullName}</h1>
        {userData.title && <div className="title-role">{userData.title}</div>}
        
        <div className="contact-info">
          {userData.email} 
          {userData.phone && ` | ${userData.phone}`}
          {userData.location && ` | ${userData.location}`}
        </div>

        {/* Sosyal Linkler */}
        <div className="social-links">
          {userData.linkedinUrl && (
            <div className="social-item">
              <a href={normalizeUrl(userData.linkedinUrl)} target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          )}
          {userData.githubUrl && (
            <div className="social-item">
              <a href={normalizeUrl(userData.githubUrl)} target="_blank" rel="noreferrer">GitHub</a>
            </div>
          )}
          {userData.websiteUrl && (
            <div className="social-item">
              <a href={normalizeUrl(userData.websiteUrl)} target="_blank" rel="noreferrer">Portfolio</a>
            </div>
          )}
        </div>
      </header>

      {/* --- SUMMARY --- */}
      {userData.summary && (
        <section className="cv-section">
          <h2 className="section-title">SUMMARY {aiData ? "(AI Optimized)" : ""}</h2>
          <p className="summary-text">{cleanText(userData.summary)}</p>
        </section>
      )}

      {/* --- EXPERIENCE --- */}
      {experienceList.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">EXPERIENCE</h2>
          <div className="section-content">
            {experienceList.map((exp, index) => {
              const formattedExp = formatExperienceItem(exp);
              return (
                <div key={index} className="experience-item">
                  <div className="row-space-between">
                    <div className="job-title">{formattedExp.position}</div>
                    <div className="dates">{formattedExp.date}</div>
                  </div>
                  <div className="row-space-between">
                    <div className="company-info">{formattedExp.company}</div>
                    {formattedExp.location && <div className="location">{formattedExp.location}</div>}
                  </div>
                  
                  {Array.isArray(formattedExp.description) ? (
                    <ul className="responsibilities">
                      {formattedExp.description.map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                    </ul>
                  ) : (
                    <p className="description">{cleanText(formattedExp.description)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- EDUCATION --- */}
      {educationList.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">EDUCATION</h2>
          <div className="section-content">
            {educationList.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="row-space-between">
                  <div className="university">{edu.university || edu.educationSchool}</div>
                  <div className="education-dates">
                    {edu.startYear ? `${edu.startYear} - ` : ""}
                    {edu.graduationYear || edu.educationEndYear || "Present"}
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

      {/* --- PROJECTS --- */}
      {projectList.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">PROJECTS</h2>
          <div className="section-content">
            {projectList.map((proj, index) => {
              const formattedProject = formatProjectItem(proj);
              return (
                <div key={index} className="project-item">
                  <div className="row-space-between">
                    <div className="project-title">{formattedProject.name}</div>
                    <div className="project-dates">{formattedProject.date}</div>
                  </div>
                  {Array.isArray(formattedProject.description) ? (
                    <ul className="project-description-list">
                      {formattedProject.description.map((d, i) => <li key={i}>{cleanText(d)}</li>)}
                    </ul>
                  ) : (
                    <p className="description">{cleanText(formattedProject.description)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

  {/* --- SKILLS (3 Sütunlu Liste) --- */}
      {userData.skills.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">SKILLS</h2>
          <div className="skills-grid">
            {userData.skills.map((skill, index) => (
              <div key={index} className="skill-item">
                {typeof skill === "object" ? skill.name || skill.skillName : skill}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- LANGUAGES (3 Sütunlu Liste) --- */}
      {userData.languages.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">LANGUAGES</h2>
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

      {/* --- CERTIFICATES (Experience Hizalaması) --- */}
      {userData.certificates.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">CERTIFICATES</h2>
          <div className="section-content">
            {userData.certificates.map((cert, index) => {
               // Tarih formatlama
               const certDate = cert.date 
                 ? cert.date 
                 : (cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("tr-TR", { year: "numeric" }) : "");

               return (
                <div key={index} className="certificate-item">
                  {/* Satır 1: İsim (Sol) - Tarih (Sağ) */}
                  <div className="row-space-between">
                    <div className="job-title" style={{ fontSize: "11pt", fontWeight: "700" }}>
                        {cert.name}
                    </div>
                    <div className="dates">{certDate}</div>
                  </div>
                  {/* Satır 2: Kurum (Sol) */}
                  {cert.issuer && (
                    <div className="certificate-issuer">
                        {cert.issuer}
                    </div>
                  )}
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