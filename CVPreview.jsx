import React from 'react';
import './CVPreview.css';

const CVPreview = ({ user }) => {
  if (!user) {
    return <div>Kullanıcı bilgileri yükleniyor...</div>;
  }

  // Kullanıcı verilerini işleme
  const formatWorkExperience = () => {
    if (!user.workExperience) return [];
    
    // Eğer yapılandırılmış veri geliyorsa
    if (Array.isArray(user.workExperience)) {
      return user.workExperience;
    }
    
    // Eğer string olarak geliyorsa, basit bir yapıya dönüştür
    return [{
      title: user.preferredJobRoles || 'Yazılım Geliştirici',
      company: user.workCompany || 'Şirket',
      description: user.workExperience.split('\n').filter(line => line.trim())
    }];
  };

  const formatProjects = () => {
    if (!user.projects) return [];
    
    if (Array.isArray(user.projects)) {
      return user.projects;
    }
    
    return [{
      title: user.projectTitle || 'Proje',
      description: user.projects.split('\n').filter(line => line.trim())
    }];
  };

  const formatEducation = () => {
    if (!user.educationLevel && !user.university) return [];
    
    return [{
      university: user.university || 'Üniversite',
      degree: user.educationLevel || 'Eğitim Seviyesi',
      field: user.department || 'Bölüm',
      graduationYear: user.graduationYear
    }];
  };

  const workExperience = formatWorkExperience();
  const projects = formatProjects();
  const education = formatEducation();
  const coreSkills = user.technicalSkills || 'Beceri bilgisi girilmemiş';
  const titleRole = user.preferredJobRoles || 'Yazılım Geliştirici';
  const summary = user.summary || 'Profesyonel özetiniz buraya gelecek.';

  return (
    <div id="cv-preview" className="cv-container classic-template">
      
      {/* BAŞLIK BÖLÜMÜ */}
      <header className="cv-header centered-header">
        <div className="center-info">
          <h1 className="full-name">{user.fullName || 'Ad Soyad'}</h1>
          <p className="title-role">{titleRole}</p> 
        </div>
        
        {/* İletişim Bilgileri */}
        <div className="contact-info-centered">
          <p>
            {user.email && `${user.email} |`}
            {user.phone && `${user.phone} |`}
            {user.location || 'Konum belirtilmemiş'}
          </p>
        </div>
      </header>

      {/* PROFESYONEL ÖZET */}
      {summary && (
        <section className="cv-section summary-section">
          <h2 className="section-title">Summary</h2>
          <p className="summary-text-new">{summary}</p>
        </section>
      )}

      {/* İŞ DENEYİMİ */}
      {workExperience.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">Work Experience</h2>
          {workExperience.map((exp, index) => (
            <div key={index} className="experience-item">
              <div className="item-header">
                <h3 className="job-title">{exp.title}</h3>
                {exp.dates && <span className="dates">{exp.dates}</span>}
              </div>
              {exp.company && <p className="company">{exp.company}</p>}
              {Array.isArray(exp.description) ? (
                <ul className="description-list">
                  {exp.description.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="description-text">{exp.description}</p>
              )}
            </div>
          ))}
        </section>
      )}
      
      {/* PROJELER */}
      {projects.length > 0 && (
        <section className="cv-section">
          <h2 className="section-title">Projects</h2>
          {projects.map((proj, index) => (
            <div key={index} className="project-item">
              <div className="item-header">
                <h3 className="project-title">{proj.title}</h3>
                {proj.dates && <span className="dates">{proj.dates}</span>}
              </div>
              {Array.isArray(proj.description) ? (
                <ul className="description-list">
                  {proj.description.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="description-text">{proj.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* TEMEL BECERİLER */}
      {coreSkills && (
        <section className="cv-section">
          <h2 className="section-title">Core Skills</h2>
          <p className="skills-list">{coreSkills}</p>
        </section>
      )}

      {/* EĞİTİM */}
      {education.length > 0 && (
        <section className="cv-section education-section">
          <h2 className="section-title">Education</h2>
          {education.map((edu, index) => (
            <div key={index} className="education-item">
              <div className="item-header">
                <h3 className="university">{edu.university}</h3>
                {edu.graduationYear && (
                  <span className="dates">{edu.graduationYear}</span>
                )}
              </div>
              <p className="degree-field">
                {edu.degree} 
                {edu.field && ` - ${edu.field}`}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* EKSİK BİLGİ UYARISI */}
      {(!user.fullName || !user.technicalSkills || !user.summary) && (
        <div className="missing-info-warning">
          <p>💡 <strong>Not:</strong> Bazı bilgiler eksik. CV'nizi tamamlamak için profil sayfasını ziyaret edin.</p>
        </div>
      )}

    </div>
  );
};

export default CVPreview;