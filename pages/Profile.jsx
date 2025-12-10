// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';

const emptyProfile = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  websiteUrl: '',
  title: '',
  totalExperienceYear: 0,
  summary: '',

  // Eski tekil alanlar (istersen sonra silebilirsin)
  educationSchool: '',
  educationDegree: '',
  educationDepartment: '',
  educationStartYear: '',
  educationEndYear: '',

  // ✅ Yeni: Çoklu eğitim desteği
  educations: [],

  skills: [],
  experiences: [],
  languages: [],
  certificates: [],
  projects: [],
};

function ProfilePage() {
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // ---------------- PROFILE GET ----------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await profileAPI.getMe();
        const data = res.data || {};

        setForm((prev) => ({
          ...prev,
          ...data,
          skills: Array.isArray(data.skills) ? data.skills : [],
          experiences: Array.isArray(data.experiences) ? data.experiences : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          certificates: Array.isArray(data.certificates) ? data.certificates : [],
          projects: Array.isArray(data.projects) ? data.projects : [],

          // ✅ Backend'den "educations" dizisi geliyorsa onu kullan, yoksa eski alanlardan tek kayıt oluştur
          educations: Array.isArray(data.educations)
            ? data.educations
            : (data.educationSchool
                ? [{
                    school: data.educationSchool || '',
                    degree: data.educationDegree || '',
                    department: data.educationDepartment || '',
                    startYear: data.educationStartYear || '',
                    endYear: data.educationEndYear || '',
                    city: data.educationCity || '',
                    isOngoing: !data.educationEndYear, // bitiş yılı yoksa devam ediyor varsay
                  }]
                : []),
        }));
      } catch (err) {
        console.error('Profil yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ---------------- INPUT HANDLER ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalExperienceYear') {
      setForm((prev) => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ---------------- SKILLS ----------------
  const addSkill = () => {
    setForm((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), { skillName: '', level: 'INTERMEDIATE', years: 0 }],
    }));
  };

  const updateSkill = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.skills];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, skills: list };
    });
  };

  const removeSkill = (index) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  // ---------------- EXPERIENCE ----------------
  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences || []),
        {
          position: '',
          company: '',
          city: '',
          employmentType: 'Full-time',
          startDate: '',
          endDate: '',
          technologies: '',
          description: '',
        },
      ],
    }));
  };

  const updateExperience = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.experiences];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, experiences: list };
    });
  };

  const removeExperience = (index) => {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  // ---------------- ✅ EDUCATIONS (YENİ) ----------------
  const addEducation = () => {
    setForm((prev) => ({
      ...prev,
      educations: [
        ...(prev.educations || []),
        {
          school: '',
          degree: '',
          department: '',
          city: '',
          startYear: '',
          endYear: '',
          isOngoing: false,
        },
      ],
    }));
  };

  const updateEducation = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.educations];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, educations: list };
    });
  };

  const toggleEducationOngoing = (index) => {
    setForm((prev) => {
      const list = [...prev.educations];
      const current = list[index];
      const newIsOngoing = !current.isOngoing;
      list[index] = {
        ...current,
        isOngoing: newIsOngoing,
        endYear: newIsOngoing ? '' : current.endYear,
      };
      return { ...prev, educations: list };
    });
  };

  const removeEducation = (index) => {
    setForm((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };

  // ---------------- LANGUAGES ----------------
  const addLanguage = () => {
    setForm((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), { language: '', level: 'Intermediate' }],
    }));
  };

  const updateLanguage = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.languages];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, languages: list };
    });
  };

  const removeLanguage = (index) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  // ---------------- CERTIFICATES ----------------
  const addCertificate = () => {
    setForm((prev) => ({
      ...prev,
      certificates: [...(prev.certificates || []), { name: '', issuer: '', date: '', url: '' }],
    }));
  };

  const updateCertificate = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.certificates];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, certificates: list };
    });
  };

  const removeCertificate = (index) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  // ---------------- PROJECTS ----------------
  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        {
          projectName: '',
          startDate: '',
          endDate: '',
          isOngoing: false,
          technologies: '',
          url: '',
          description: '',
        },
      ],
    }));
  };

  const updateProject = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.projects];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, projects: list };
    });
  };

  const toggleProjectOngoing = (index) => {
    setForm((prev) => {
      const list = [...prev.projects];
      const current = list[index];
      const newIsOngoing = !current.isOngoing;
      list[index] = {
        ...current,
        isOngoing: newIsOngoing,
        endDate: newIsOngoing ? '' : current.endDate,
      };
      return { ...prev, projects: list };
    });
  };

  const removeProject = (index) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  // ---------------- SAVE PROFILE ----------------
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await profileAPI.updateMe(form);
      setForm((prev) => ({
        ...prev,
        ...(res.data || {}),
      }));
      alert('Profil başarıyla güncellendi!');
    } catch (err) {
      alert('Kaydetme başarısız. Lütfen konsolu kontrol edin.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Profil yükleniyor...</div>;

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <h2>Profil Bilgileri (CV İçin)</h2>

      {/* --- KİŞİSEL BİLGİLER --- */}
      <section>
        <h3>Kişisel Bilgiler</h3>
        <div className="row">
          <input name="fullName" placeholder="Ad Soyad" value={form.fullName ?? ''} onChange={handleChange} />
          <input value={form.email ?? ''} disabled placeholder="Email" />
        </div>
        <div className="row">
          <input name="phone" placeholder="Telefon" value={form.phone ?? ''} onChange={handleChange} />
          <input name="location" placeholder="Lokasyon (Şehir, Ülke)" value={form.location ?? ''} onChange={handleChange} />
        </div>
        <div className="row">
          <input name="linkedinUrl" placeholder="LinkedIn URL" value={form.linkedinUrl ?? ''} onChange={handleChange} />
          <input name="githubUrl" placeholder="GitHub URL" value={form.githubUrl ?? ''} onChange={handleChange} />
          <input name="websiteUrl" placeholder="Website / Portfolio URL" value={form.websiteUrl ?? ''} onChange={handleChange} />
        </div>
      </section>

      <hr />

      {/* --- PROFİL ÖZETİ --- */}
      <section>
        <h3>Meslek </h3>
        <input 
          name="title" 
          placeholder="Ünvan (Örn: Yazılım Mühendisi)" 
          value={form.title ?? ''} 
          onChange={handleChange} 
        />
      </section>

      <hr />

      {/* --- ✅ ÇOKLU EĞİTİM --- */}
      <section>
        <h3>Eğitim</h3>

        {(form.educations || []).map((edu, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '5px',
            }}
          >
            <div className="row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                style={{ flex: 2 }}
                placeholder="Okul / Üniversite"
                value={edu.school ?? ''}
                onChange={(e) => updateEducation(idx, 'school', e.target.value)}
              />
              <input
                style={{ flex: 1 }}
                placeholder="Şehir"
                value={edu.city ?? ''}
                onChange={(e) => updateEducation(idx, 'city', e.target.value)}
              />
            </div>

            <div className="row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                style={{ flex: 1 }}
                placeholder="Derece (Lisans, YL, Doktora)"
                value={edu.degree ?? ''}
                onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
              />
              <input
                style={{ flex: 1 }}
                placeholder="Bölüm (Bilgisayar Mühendisliği)"
                value={edu.department ?? ''}
                onChange={(e) => updateEducation(idx, 'department', e.target.value)}
              />
            </div>

            <div className="row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                style={{ flex: 1 }}
                placeholder="Başlangıç Yılı (2020)"
                value={edu.startYear ?? ''}
                onChange={(e) => updateEducation(idx, 'startYear', e.target.value)}
              />
              {!edu.isOngoing && (
                <input
                  style={{ flex: 1 }}
                  placeholder="Bitiş Yılı (2024)"
                  value={edu.endYear ?? ''}
                  onChange={(e) => updateEducation(idx, 'endYear', e.target.value)}
                />
              )}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={edu.isOngoing || false}
                  onChange={() => toggleEducationOngoing(idx)}
                />{' '}
                Devam ediyor
              </label>
            </div>

            <button
              type="button"
              onClick={() => removeEducation(idx)}
              style={{
                marginTop: '5px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
              }}
            >
              Eğitimi Sil
            </button>
          </div>
        ))}

        <button type="button" onClick={addEducation}>
          + Eğitim Ekle
        </button>
      </section>

      <hr />

      {/* --- DENEYİMLER --- */}
      <section>
        <h3>Deneyimler</h3>
        {(form.experiences || []).map((exp, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '5px',
            }}
          >
            <div className="row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                style={{ flex: 1 }}
                placeholder="Pozisyon (Örn: Java Developer)"
                value={exp.position ?? ''}
                onChange={(e) => updateExperience(idx, 'position', e.target.value)}
              />
              <input
                style={{ flex: 1 }}
                placeholder="Şirket Adı"
                value={exp.company ?? ''}
                onChange={(e) => updateExperience(idx, 'company', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Çalışma Tipi:</label>
              <select
                style={{ width: '100%', padding: '8px' }}
                value={exp.employmentType ?? 'Full-time'}
                onChange={(e) => updateExperience(idx, 'employmentType', e.target.value)}
              >
                <option value="Full-time">Tam Zamanlı (Full-time)</option>
                <option value="Internship">Staj (Internship)</option>
                <option value="Part-time">Yarı Zamanlı (Part-time)</option>
                <option value="Freelance">Serbest (Freelance)</option>
              </select>
            </div>

            <div className="row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px' }}>Başlangıç Tarihi</label>
                <input
                  type="month"
                  style={{ width: '100%' }}
                  value={exp.startDate ?? ''}
                  onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px' }}>Bitiş Tarihi (Boşsa Devam Ediyor)</label>
                <input
                  type="month"
                  style={{ width: '100%' }}
                  value={exp.endDate ?? ''}
                  onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                />
              </div>
            </div>

            <textarea
              placeholder="İş Tanımı: Hangi problemleri çözdün? Ne başardın?"
              value={exp.description ?? ''}
              onChange={(e) => updateExperience(idx, 'description', e.target.value)}
              rows={3}
              style={{ width: '100%', marginTop: '5px' }}
            />

            <button
              type="button"
              onClick={() => removeExperience(idx)}
              style={{
                marginTop: '10px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
              }}
            >
              Deneyimi Sil
            </button>
          </div>
        ))}
        <button type="button" onClick={addExperience}>
          + Deneyim Ekle
        </button>
      </section>

      <hr />

      {/* --- PROJELER --- */}
      <section>
        <h3>Projeler</h3>
        {(form.projects || []).map((proj, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '5px',
            }}
          >
            <input
              placeholder="Proje Adı"
              value={proj.projectName ?? ''}
              onChange={(e) => updateProject(idx, 'projectName', e.target.value)}
              style={{ width: '100%', marginBottom: '10px', fontWeight: 'bold' }}
            />

            <div className="row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="month"
                style={{ flex: 1 }}
                value={proj.startDate ?? ''}
                onChange={(e) => updateProject(idx, 'startDate', e.target.value)}
              />
              {!proj.isOngoing && (
                <input
                  type="month"
                  style={{ flex: 1 }}
                  value={proj.endDate ?? ''}
                  onChange={(e) => updateProject(idx, 'endDate', e.target.value)}
                />
              )}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={proj.isOngoing || false}
                  onChange={() => toggleProjectOngoing(idx)}
                />{' '}
                Devam ediyor
              </label>
            </div>

            <textarea
              placeholder="Proje Açıklaması: Bu proje ne yapıyor? Sen ne geliştirdin?"
              value={proj.description ?? ''}
              onChange={(e) => updateProject(idx, 'description', e.target.value)}
              rows={3}
              style={{ width: '100%' }}
            />

            <button
              type="button"
              onClick={() => removeProject(idx)}
              style={{
                marginTop: '10px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
              }}
            >
              Sil
            </button>
          </div>
        ))}
        <button type="button" onClick={addProject}>
          + Proje Ekle
        </button>
      </section>

      <hr />

      {/* --- YETENEKLER --- */}
      <section>
        <h3>Yetenekler</h3>
        {(form.skills || []).map((skill, idx) => (
          <div
            key={idx}
            className="row"
            style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}
          >
            <input
              style={{ flex: 2 }}
              placeholder="Yetenek (Java)"
              value={skill.skillName ?? ''}
              onChange={(e) => updateSkill(idx, 'skillName', e.target.value)}
            />
            <select
              style={{ flex: 1 }}
              value={skill.level ?? 'INTERMEDIATE'}
              onChange={(e) => updateSkill(idx, 'level', e.target.value)}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
            <button type="button" onClick={() => removeSkill(idx)}>
              Sil
            </button>
          </div>
        ))}
        <button type="button" onClick={addSkill}>
          + Yetenek Ekle
        </button>
      </section>

      <hr />

      {/* --- DİLLER --- */}
      <section>
        <h3>Yabancı Diller</h3>
        {(form.languages || []).map((lang, idx) => (
          <div
            key={idx}
            className="row"
            style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}
          >
            <input
              style={{ flex: 2 }}
              placeholder="Dil (İngilizce)"
              value={lang.language ?? ''}
              onChange={(e) => updateLanguage(idx, 'language', e.target.value)}
            />
            <select
              style={{ flex: 1 }}
              value={lang.level ?? 'Intermediate'}
              onChange={(e) => updateLanguage(idx, 'level', e.target.value)}
            >
              <option value="Beginner">A1-A2 (Başlangıç)</option>
              <option value="Intermediate">B1-B2 (Orta)</option>
              <option value="Advanced">C1-C2 (İleri)</option>
              <option value="Native">Anadil</option>
            </select>
            <button type="button" onClick={() => removeLanguage(idx)}>
              Sil
            </button>
          </div>
        ))}
        <button type="button" onClick={addLanguage}>
          + Dil Ekle
        </button>
      </section>

      <hr />

      {/* --- SERTİFİKALAR --- */}
      <section>
        <h3>Sertifikalar</h3>
        {(form.certificates || []).map((cert, idx) => (
          <div
            key={idx}
            style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}
          >
            <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
              <input
                style={{ flex: 1 }}
                placeholder="Sertifika Adı"
                value={cert.name ?? ''}
                onChange={(e) => updateCertificate(idx, 'name', e.target.value)}
              />
              <input
                style={{ flex: 1 }}
                placeholder="Veren Kurum"
                value={cert.issuer ?? ''}
                onChange={(e) => updateCertificate(idx, 'issuer', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                style={{ flex: 1 }}
                placeholder="Tarih"
                value={cert.date ?? ''}
                onChange={(e) => updateCertificate(idx, 'date', e.target.value)}
              />
              <input
                style={{ flex: 2 }}
                placeholder="Sertifika URL"
                value={cert.url ?? ''}
                onChange={(e) => updateCertificate(idx, 'url', e.target.value)}
              />
              <button type="button" onClick={() => removeCertificate(idx)}>
                Sil
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addCertificate}>
          + Sertifika Ekle
        </button>
      </section>

      <hr />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
      </button>
    </div>
  );
}

export default ProfilePage;
