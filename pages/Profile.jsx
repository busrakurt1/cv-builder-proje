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
  educationSchool: '',
  educationDegree: '',
  educationDepartment: '',
  educationStartYear: '',
  educationEndYear: '',
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
          // Temel alanlar
          fullName: data.fullName ?? prev.fullName,
          email: data.email ?? prev.email,
          phone: data.phone ?? '',
          location: data.location ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
          githubUrl: data.githubUrl ?? '',
          websiteUrl: data.websiteUrl ?? '',
          title: data.title ?? '',
          totalExperienceYear: data.totalExperienceYear ?? 0,
          summary: data.summary ?? '',
          educationSchool: data.educationSchool ?? '',
          educationDegree: data.educationDegree ?? '',
          educationDepartment: data.educationDepartment ?? '',
          educationStartYear: data.educationStartYear ?? '',
          educationEndYear: data.educationEndYear ?? '',

          // Listeler
          skills: Array.isArray(data.skills) ? data.skills : [],
          experiences: Array.isArray(data.experiences) ? data.experiences : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          certificates: Array.isArray(data.certificates) ? data.certificates : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
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
      skills: [
        ...(prev.skills || []),
        { skillName: '', level: 'INTERMEDIATE', years: 0 },
      ],
    }));
  };

  const updateSkill = (index, field, value) => {
    setForm((prev) => {
      const list = [...(prev.skills || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, skills: list };
    });
  };

  const removeSkill = (index) => {
    setForm((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index),
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
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }));
  };

  const updateExperience = (index, field, value) => {
    setForm((prev) => {
      const list = [...(prev.experiences || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, experiences: list };
    });
  };

  const removeExperience = (index) => {
    setForm((prev) => ({
      ...prev,
      experiences: (prev.experiences || []).filter((_, i) => i !== index),
    }));
  };

  // ---------------- LANGUAGES ----------------
  const addLanguage = () => {
    setForm((prev) => ({
      ...prev,
      languages: [
        ...(prev.languages || []),
        { language: '', level: 'Intermediate' },
      ],
    }));
  };

  const updateLanguage = (index, field, value) => {
    setForm((prev) => {
      const list = [...(prev.languages || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, languages: list };
    });
  };

  const removeLanguage = (index) => {
    setForm((prev) => ({
      ...prev,
      languages: (prev.languages || []).filter((_, i) => i !== index),
    }));
  };

  // ---------------- CERTIFICATES ----------------
  const addCertificate = () => {
    setForm((prev) => ({
      ...prev,
      certificates: [
        ...(prev.certificates || []),
        { name: '', issuer: '', date: '', url: '' },
      ],
    }));
  };

  const updateCertificate = (index, field, value) => {
    setForm((prev) => {
      const list = [...(prev.certificates || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, certificates: list };
    });
  };

  const removeCertificate = (index) => {
    setForm((prev) => ({
      ...prev,
      certificates: (prev.certificates || []).filter((_, i) => i !== index),
    }));
  };

  // ---------------- PROJECTS ----------------
  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { projectName: '', startDate: '', endDate: '', isOngoing: false },
      ],
    }));
  };

  const updateProject = (index, field, value) => {
    setForm((prev) => {
      const list = [...(prev.projects || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, projects: list };
    });
  };

  const toggleProjectOngoing = (index) => {
    setForm((prev) => {
      const list = [...(prev.projects || [])];
      const current = list[index] || {};
      const newIsOngoing = !current.isOngoing;
      list[index] = {
        ...current,
        isOngoing: newIsOngoing,
        endDate: newIsOngoing ? '' : current.endDate || '',
      };
      return { ...prev, projects: list };
    });
  };

  const removeProject = (index) => {
    setForm((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }));
  };

  // ---------------- SAVE PROFILE ----------------
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        fullName: form.fullName || '',
        email: form.email || '',
        phone: form.phone || '',
        location: form.location || '',
        linkedinUrl: form.linkedinUrl || '',
        githubUrl: form.githubUrl || '',
        websiteUrl: form.websiteUrl || '',
        title: form.title || '',
        totalExperienceYear: Number(form.totalExperienceYear || 0),
        summary: form.summary || '',
        educationSchool: form.educationSchool || '',
        educationDegree: form.educationDegree || '',
        educationDepartment: form.educationDepartment || '',
        educationStartYear: form.educationStartYear || '',
        educationEndYear: form.educationEndYear || '',

        skills: (form.skills || []).map((s) => ({
          skillName: s.skillName || '',
          level: s.level || 'INTERMEDIATE',
          years: Number(s.years || 0),
        })),

        experiences: (form.experiences || []).map((e) => ({
          position: e.position || '',
          company: e.company || '',
          city: e.city || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          description: e.description || '',
        })),

        languages: (form.languages || []).map((l) => ({
          language: l.language || '',
          level: l.level || 'Intermediate',
        })),

        certificates: (form.certificates || []).map((c) => ({
          name: c.name || '',
          issuer: c.issuer || '',
          date: c.date || '',
          url: c.url || '',
        })),

        projects: (form.projects || []).map((p) => ({
          projectName: p.projectName || '',
          startDate: p.startDate || '',
          endDate: p.isOngoing ? '' : p.endDate || '',
          isOngoing: Boolean(p.isOngoing),
        })),
      };

      const res = await profileAPI.updateMe(payload);

      setForm((prev) => ({
        ...prev,
        ...(res.data || {}),
      }));

      alert('Profil güncellendi! Dashboard’a yönlendiriliyorsunuz...');
      navigate('/dashboard');
    } catch (err) {
      alert('Hata oluştu — console’a bak');
      console.error('Profil kaydetme hatası:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Profil yükleniyor...</div>;

  return (
    <div
      className="container"
      style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}
    >
      <h2>Profil Bilgileri (CV İçin)</h2>

      {/* ---------------- KİŞİSEL BİLGİLER ---------------- */}
      <section>
        <h3>Kişisel Bilgiler</h3>

        <label>Ad Soyad</label>
        <input
          name="fullName"
          value={form.fullName ?? ''}
          onChange={handleChange}
        />

        <label>Email</label>
        <input value={form.email ?? ''} disabled />

        <label>Telefon</label>
        <input
          name="phone"
          value={form.phone ?? ''}
          onChange={handleChange}
        />

        <label>Lokasyon</label>
        <input
          name="location"
          value={form.location ?? ''}
          onChange={handleChange}
        />

        <label>LinkedIn</label>
        <input
          name="linkedinUrl"
          value={form.linkedinUrl ?? ''}
          onChange={handleChange}
        />

        <label>GitHub</label>
        <input
          name="githubUrl"
          value={form.githubUrl ?? ''}
          onChange={handleChange}
        />

        <label>Website</label>
        <input
          name="websiteUrl"
          value={form.websiteUrl ?? ''}
          onChange={handleChange}
        />
      </section>

      <hr />

      {/* ---------------- PROFESYONEL ÖZET ---------------- */}
      {/* <section>
        <h3>Profil Özeti</h3>

        <label>Ünvan / Başlık</label>
        <input
          name="title"
          value={form.title ?? ''}
          onChange={handleChange}
        />

        <label>Toplam Deneyim (Yıl)</label>
        <input
          type="number"
          name="totalExperienceYear"
          value={form.totalExperienceYear ?? 0}
          onChange={handleChange}
        />

        <label>Kısa Özet</label>
        <textarea
          name="summary"
          value={form.summary ?? ''}
          onChange={handleChange}
          rows={4}
        />
      </section>

      <hr /> */}

      {/* ---------------- EĞİTİM ---------------- */}
      <section>
        <h3>Eğitim</h3>

        <label>Okul</label>
        <input
          name="educationSchool"
          value={form.educationSchool ?? ''}
          onChange={handleChange}
        />

        {/* <label>Derece</label>
        <input
          name="educationDegree"
          value={form.educationDegree ?? ''}
          onChange={handleChange}
        /> */}

        {/* <label>Bölüm</label>
        <input
          name="educationDepartment"
          value={form.educationDepartment ?? ''}
          onChange={handleChange}
        /> */}

        <label>Başlangıç</label>
        <input
          name="educationStartYear"
          value={form.educationStartYear ?? ''}
          onChange={handleChange}
        />

        <label>Bitiş (Devam ediyorsa mezuniyet yılı)</label>
        <input
          name="educationEndYear"
          value={form.educationEndYear ?? ''}
          onChange={handleChange}
        />
      </section>

      <hr />

      {/* ---------------- DENEYİMLER ---------------- */}
      <section>
        <h3>Deneyimler</h3>

        {(form.experiences || []).length === 0 && (
          <p>Henüz deneyim eklenmemiş.</p>
        )}

        {(form.experiences || []).map((exp, idx) => (
          <div
            key={idx}
            className="row"
            style={{
              border: '1px solid #ddd',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <input
              placeholder="Pozisyon (Backend Developer)"
              value={exp.position ?? ''}
              onChange={(e) =>
                updateExperience(idx, 'position', e.target.value)
              }
            />
            <input
              placeholder="Şirket (ABC Şirketi)"
              value={exp.company ?? ''}
              onChange={(e) =>
                updateExperience(idx, 'company', e.target.value)
              }
            />
            
            
            <input
              placeholder="Başlangıç (2023-01)"
              value={exp.startDate ?? ''}
              onChange={(e) =>
                updateExperience(idx, 'startDate', e.target.value)
              }
            />
            <input
              placeholder="Bitiş (2024-01 veya DEVAM)"
              value={exp.endDate ?? ''}
              onChange={(e) =>
                updateExperience(idx, 'endDate', e.target.value)
              }
            />
            {/* <textarea
              placeholder="İş tanımı / Sorumluluklar..."
              value={exp.description ?? ''}
              onChange={(e) =>
                updateExperience(idx, 'description', e.target.value)
              }
              rows={3}
              style={{ width: '100%', marginTop: '5px' }}
            /> */}
            <button type="button" onClick={() => removeExperience(idx)}>
              Deneyimi Sil
            </button>
          </div>
        ))}

        <button type="button" onClick={addExperience}>
          + Deneyim Ekle
        </button>
      </section>

      <hr />

      {/* ---------------- SKILLS ---------------- */}
      <section>
        <h3>Yetenekler</h3>
        {(form.skills || []).map((skill, idx) => (
          <div key={idx} className="row">
            <input
              type="text"
              placeholder="Örn: Java"
              value={skill.skillName ?? ''}
              onChange={(e) => updateSkill(idx, 'skillName', e.target.value)}
            />
            <select
              value={skill.level ?? 'INTERMEDIATE'}
              onChange={(e) => updateSkill(idx, 'level', e.target.value)}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <input
              type="number"
              value={skill.years ?? 0}
              onChange={(e) => updateSkill(idx, 'years', e.target.value)}
            />
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

      {/* ---------------- LANGUAGES ---------------- */}
      <section>
        <h3>Yabancı Diller</h3>
        {(form.languages || []).map((lang, idx) => (
          <div key={idx} className="row">
            <input
              type="text"
              placeholder="Dil (İngilizce, Almanca...)"
              value={lang.language ?? ''}
              onChange={(e) => updateLanguage(idx, 'language', e.target.value)}
            />
            <select
              value={lang.level ?? 'Intermediate'}
              onChange={(e) => updateLanguage(idx, 'level', e.target.value)}
            >
              <option value="Beginner">Başlangıç (A1-A2)</option>
              <option value="Intermediate">Orta (B1-B2)</option>
              <option value="Advanced">İleri (C1-C2)</option>
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

      {/* ---------------- CERTIFICATES ---------------- */}
      <section>
        <h3>Sertifikalar</h3>
        {(form.certificates || []).map((cert, idx) => (
          <div
            key={idx}
            className="row"
            style={{
              border: '1px solid #ddd',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <input
              placeholder="Sertifika Adı"
              value={cert.name ?? ''}
              onChange={(e) => updateCertificate(idx, 'name', e.target.value)}
            />
            <input
              placeholder="Veren Kurum"
              value={cert.issuer ?? ''}
              onChange={(e) =>
                updateCertificate(idx, 'issuer', e.target.value)
              }
            />
            <input
              placeholder="Tarih (2023-05)"
              value={cert.date ?? ''}
              onChange={(e) => updateCertificate(idx, 'date', e.target.value)}
            />
            <input
              placeholder="Link (opsiyonel)"
              value={cert.url ?? ''}
              onChange={(e) => updateCertificate(idx, 'url', e.target.value)}
            />
            <button type="button" onClick={() => removeCertificate(idx)}>
              Sil
            </button>
          </div>
        ))}
        <button type="button" onClick={addCertificate}>
          + Sertifika Ekle
        </button>
      </section>

      <hr />

      {/* ---------------- PROJECTS ---------------- */}
      <section>
        <h3>Projeler</h3>
        {(form.projects || []).map((proj, idx) => (
          <div
            key={idx}
            className="row"
            style={{
              border: '1px solid #ddd',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <input
              placeholder="Proje Adı"
              value={proj.projectName ?? ''}
              onChange={(e) =>
                updateProject(idx, 'projectName', e.target.value)
              }
            />
            <input
              placeholder="Başlangıç (2023-02)"
              value={proj.startDate ?? ''}
              onChange={(e) =>
                updateProject(idx, 'startDate', e.target.value)
              }
            />
            {!proj.isOngoing && (
              <input
                placeholder="Bitiş (2023-06)"
                value={proj.endDate ?? ''}
                onChange={(e) =>
                  updateProject(idx, 'endDate', e.target.value)
                }
              />
            )}
            <label>
              <input
                type="checkbox"
                checked={proj.isOngoing || false}
                onChange={() => toggleProjectOngoing(idx)}
              />{' '}
              Devam ediyor
            </label>
            <button type="button" onClick={() => removeProject(idx)}>
              Sil
            </button>
          </div>
        ))}
        <button type="button" onClick={addProject}>
          + Proje Ekle
        </button>
      </section>

      <hr />

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
      </button>
    </div>
  );
}

export default ProfilePage;
