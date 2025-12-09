// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';

// Boş profil objesi
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
        console.log('🔄 Profil verisi çekiliyor...');
        const res = await profileAPI.getMe();
        console.log('✅ API Yanıtı TAMAMI:', res.data);

        // ÖZELLİKLE projeleri kontrol et
        console.log('📋 Gelen projeler:', res.data?.projects);
        console.log('📋 Projeler var mı?', res.data?.projects ? 'EVET' : 'HAYIR');
        console.log('📋 Projeler uzunluğu:', res.data?.projects?.length || 0);

        const data = res.data || {};

        // API'den gelen projeleri işle
        let projectsData = [];
        if (Array.isArray(data.projects)) {
          projectsData = data.projects.map((p) => ({
            id: p.id,
            projectName: p.projectName || '',
            startDate: p.startDate || '',
            endDate: p.endDate || '',
            isOngoing: p.isOngoing || false,
          }));
        }

        console.log('🔍 İşlenmiş projeler:', projectsData);

        setForm({
          // Temel bilgiler
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          linkedinUrl: data.linkedinUrl || '',
          githubUrl: data.githubUrl || '',
          websiteUrl: data.websiteUrl || '',
          title: data.title || '',
          summary: data.summary || '',
          educationSchool: data.educationSchool || '',
          educationDegree: data.educationDegree || '',
          educationDepartment: data.educationDepartment || '',
          educationStartYear: data.educationStartYear || '',
          educationEndYear: data.educationEndYear || '',
          totalExperienceYear: data.totalExperienceYear || 0,

          // Listeler
          skills: Array.isArray(data.skills) ? data.skills : [],
          experiences: Array.isArray(data.experiences) ? data.experiences : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          certificates: Array.isArray(data.certificates) ? data.certificates : [],

          // PROJELER - en önemli kısım
          projects: projectsData,
        });
      } catch (err) {
        console.error('❌ Profil yükleme hatası:', err);
        alert('Profil yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ---------------- INPUT HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Checkbox için özel işleme (genel)
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    }
    // Number input için
    else if (name === 'totalExperienceYear') {
      setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    }
    // Diğer inputlar
    else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- SKILL FONKSİYONLARI ---
  const addSkill = () => {
    setForm((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          skillName: '',
          level: 'INTERMEDIATE',
          years: 0,
        },
      ],
    }));
  };

  const updateSkill = (idx, field, val) => {
    setForm((prev) => {
      const newSkills = [...prev.skills];
      newSkills[idx] = { ...newSkills[idx], [field]: val };
      return { ...prev, skills: newSkills };
    });
  };

  const removeSkill = (idx) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx),
    }));
  };

  // --- EXPERIENCE FONKSİYONLARI ---
  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
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

  const updateExperience = (idx, field, val) => {
    setForm((prev) => {
      const newExperiences = [...prev.experiences];
      newExperiences[idx] = { ...newExperiences[idx], [field]: val };
      return { ...prev, experiences: newExperiences };
    });
  };

  const removeExperience = (idx) => {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== idx),
    }));
  };

  // --- LANGUAGES HANDLERS ---
  const addLanguage = () => {
    setForm((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        {
          language: '',
          level: 'Intermediate',
        },
      ],
    }));
  };

  const updateLanguage = (idx, field, val) => {
    setForm((prev) => {
      const newLanguages = [...prev.languages];
      newLanguages[idx] = { ...newLanguages[idx], [field]: val };
      return { ...prev, languages: newLanguages };
    });
  };

  const removeLanguage = (idx) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== idx),
    }));
  };

  // --- CERTIFICATES HANDLERS ---
  const addCertificate = () => {
    setForm((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
          name: '',
          issuer: '',
          date: '',
          url: '',
        },
      ],
    }));
  };

  const updateCertificate = (idx, field, val) => {
    setForm((prev) => {
      const newCertificates = [...prev.certificates];
      newCertificates[idx] = { ...newCertificates[idx], [field]: val };
      return { ...prev, certificates: newCertificates };
    });
  };

  const removeCertificate = (idx) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== idx),
    }));
  };

  // --- PROJELER HANDLERS ---
  const addProject = () => {
    console.log('➕ Proje ekleniyor...');
    setForm((prev) => {
      const newProject = {
        projectName: '',
        startDate: '',
        endDate: '',
        isOngoing: false,
      };
      const newProjects = [...prev.projects, newProject];
      console.log('📋 Yeni projeler:', newProjects);
      return { ...prev, projects: newProjects };
    });
  };

  const updateProject = (idx, field, val) => {
    console.log(`🔄 Proje güncelleniyor: ${idx}, ${field}, ${val}`);
    setForm((prev) => {
      const newProjects = [...prev.projects];
      newProjects[idx] = { ...newProjects[idx], [field]: val };
      console.log('📋 Güncellenmiş projeler:', newProjects);
      return { ...prev, projects: newProjects };
    });
  };

  const removeProject = (idx) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  // ---------------- SAVE ----------------
  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Kaydedilecek form:', form);

      // Payload'ı daha güvenli şekilde hazırlayalım
      const payload = {
        fullName: form.fullName || '',
        email: form.email || '',
        phone: form.phone || '',
        location: form.location || '',
        linkedinUrl: form.linkedinUrl || '',
        githubUrl: form.githubUrl || '',
        websiteUrl: form.websiteUrl || '',
        title: form.title || '',
        summary: form.summary || '',
        educationSchool: form.educationSchool || '',
        educationDegree: form.educationDegree || '',
        educationDepartment: form.educationDepartment || '',
        educationStartYear: form.educationStartYear || '',
        educationEndYear: form.educationEndYear || '',
        totalExperienceYear: Number(form.totalExperienceYear) || 0,

        // Array'leri güvenli şekilde hazırla
        skills: (form.skills || []).map((skill) => ({
          skillName: skill.skillName || '',
          level: skill.level || 'INTERMEDIATE',
          years: Number(skill.years) || 0,
        })),

        experiences: (form.experiences || []).map((exp) => ({
          position: exp.position || '',
          company: exp.company || '',
          city: exp.city || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          description: exp.description || '',
        })),

        languages: (form.languages || []).map((lang) => ({
          language: lang.language || '',
          level: lang.level || 'Intermediate',
        })),

        certificates: (form.certificates || []).map((cert) => ({
          name: cert.name || '',
          issuer: cert.issuer || '',
          date: cert.date || '',
          url: cert.url || '',
        })),

        projects: (form.projects || []).map((project) => ({
          projectName: project.projectName || '',
          startDate: project.startDate || '',
          endDate: project.isOngoing ? '' : project.endDate || '',
          isOngoing: Boolean(project.isOngoing),
        })),
      };

      console.log("📤 API'ye gönderilecek payload:", JSON.stringify(payload, null, 2));

      // API çağrısı yap
      console.log('🔄 API çağrısı yapılıyor...');
      const res = await profileAPI.updateMe(payload);
      console.log('✅ API yanıtı:', res);
      console.log('✅ Kayıt başarılı, yanıt verisi:', res.data);

      // Yanıttan gelen veriyi form'a set et
      if (res.data) {
        setForm((prev) => {
          const updated = {
            ...prev,
            ...res.data,
            // Array'leri güvenli şekilde güncelle
            skills: Array.isArray(res.data.skills) ? res.data.skills : prev.skills,
            experiences: Array.isArray(res.data.experiences)
              ? res.data.experiences
              : prev.experiences,
            languages: Array.isArray(res.data.languages)
              ? res.data.languages
              : prev.languages,
            certificates: Array.isArray(res.data.certificates)
              ? res.data.certificates
              : prev.certificates,
            projects: Array.isArray(res.data.projects) ? res.data.projects : prev.projects,
          };
          console.log('🔄 Form güncellendi:', updated);
          return updated;
        });
      }

      alert('Profil başarıyla güncellendi!');

      // Dashboard'a yönlendirmeden önce kısa bekle
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('❌ Profil kaydetme hatası:', err);
      console.error('❌ Hata mesajı:', err.message);
      console.error('❌ Hata stack:', err.stack);

      if (err.response) {
        console.error('❌ Hata status:', err.response.status);
        console.error('❌ Hata data:', err.response.data);
        console.error('❌ Hata headers:', err.response.headers);

        let errorMessage = 'Kaydedilirken hata oluştu! ';

        if (err.response.status === 400) {
          errorMessage += 'Geçersiz veri gönderildi. ';
        } else if (err.response.status === 401) {
          errorMessage += 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın. ';
        } else if (err.response.status === 403) {
          errorMessage += 'Bu işlem için yetkiniz yok. ';
        } else if (err.response.status === 500) {
          errorMessage += 'Sunucu hatası. ';
        }

        if (err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage += err.response.data;
          } else if (err.response.data.message) {
            errorMessage += err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage += err.response.data.error;
          }
        }

        alert(errorMessage);
      } else if (err.request) {
        console.error('❌ İstek yapıldı ama yanıt alınamadı:', err.request);
        alert('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.');
      } else {
        console.error('❌ İstek hazırlanırken hata:', err.message);
        alert('İstek hazırlanırken hata oluştu: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------------- DEBUG BUTTON ----------------
  const debugForm = () => {
    console.log('=== DEBUG: FORM STATE ===');
    console.log('form.projects:', form.projects);
    console.log('form.projects length:', form.projects.length);
    console.log('form.projects[0]:', form.projects[0]);
    console.log('Tüm form:', JSON.stringify(form, null, 2));

    alert(
      `Projeler: ${form.projects.length} adet\nİlk proje: ${JSON.stringify(
        form.projects[0] || {}
      )}`
    );
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        Profil yükleniyor...
      </div>
    );

  return (
    <div
      className="container"
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* DEBUG BUTTON */}
      <button
        onClick={debugForm}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#ff9800',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        🔍 Debug Form
      </button>

      <h1
        style={{
          borderBottom: '2px solid #1890ff',
          paddingBottom: '10px',
          marginBottom: '30px',
        }}
      >
        Profil Bilgileri
      </h1>

      {/* --- KİŞİSEL BİLGİLER --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ color: '#1890ff', marginBottom: '15px' }}>Kişisel Bilgiler</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
          }}
        >
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              Ad Soyad
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              Telefon
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              Lokasyon
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              name="location"
              value={form.location}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              Email
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#f5f5f5',
              }}
              value={form.email}
              disabled
            />
          </div>
        </div>

        <div
          style={{
            marginTop: '15px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
          }}
        >
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              LinkedIn URL
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="https://linkedin.com/in/username"
              name="linkedinUrl"
              value={form.linkedinUrl}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              GitHub URL
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="https://github.com/username"
              name="githubUrl"
              value={form.githubUrl}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
            >
              Website URL
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="https://example.com"
              name="websiteUrl"
              value={form.websiteUrl}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <hr
        style={{
          margin: '30px 0',
          border: 'none',
          borderTop: '1px solid #eee',
        }}
      />

      {/* --- ÖZET & EĞİTİM --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ color: '#1890ff', marginBottom: '15px' }}>Özet & Eğitim</h3>

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            Ünvan
          </label>
          <input
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            placeholder="Örn: Backend Developer, Frontend Engineer"
            name="title"
            value={form.title}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            Toplam Deneyim (Yıl)
          </label>
          <input
            type="number"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            name="totalExperienceYear"
            value={form.totalExperienceYear}
            onChange={handleChange}
            min="0"
            max="50"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            Profesyonel Özet
          </label>
          <textarea
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minHeight: '100px',
            }}
            placeholder="Kısa profesyonel özetiniz..."
            name="summary"
            value={form.summary}
            onChange={handleChange}
          />
        </div>

        <h4
          style={{
            marginTop: '20px',
            marginBottom: '15px',
            color: '#666',
          }}
        >
          Eğitim Bilgisi
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
          }}
        >
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}
            >
              Okul Adı
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="Üniversite adı"
              name="educationSchool"
              value={form.educationSchool}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}
            >
              Derece
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="Lisans, Yüksek Lisans, Doktora"
              name="educationDegree"
              value={form.educationDegree}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}
            >
              Bölüm
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="Bilgisayar Mühendisliği"
              name="educationDepartment"
              value={form.educationDepartment}
              onChange={handleChange}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}
              >
                Başlangıç Yılı
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                placeholder="2018"
                name="educationStartYear"
                value={form.educationStartYear}
                onChange={handleChange}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}
              >
                Bitiş Yılı
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                placeholder="2022"
                name="educationEndYear"
                value={form.educationEndYear}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </section>

      <hr
        style={{
          margin: '30px 0',
          border: 'none',
          borderTop: '1px solid #eee',
        }}
      />

      {/* --- YETENEKLER --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ color: '#1890ff', margin: 0 }}>Yetenekler</h3>
          <button
            type="button"
            onClick={addSkill}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Yetenek Ekle
          </button>
        </div>

        {form.skills.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              border: '1px dashed #ddd',
              borderRadius: '5px',
              background: 'white',
              color: '#666',
            }}
          >
            Henüz yetenek eklenmemiş. Yeni yetenek eklemek için butona tıklayın.
          </div>
        ) : (
          form.skills.map((skill, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '15px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: 'white',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                placeholder="Yetenek (Java, React)"
                value={skill.skillName || ''}
                onChange={(e) => updateSkill(idx, 'skillName', e.target.value)}
              />

              <select
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                value={skill.level || 'INTERMEDIATE'}
                onChange={(e) => updateSkill(idx, 'level', e.target.value)}
              >
                <option value="BEGINNER">Başlangıç</option>
                <option value="INTERMEDIATE">Orta</option>
                <option value="ADVANCED">İleri</option>
              </select>

              <input
                type="number"
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                placeholder="Yıl"
                value={skill.years || 0}
                onChange={(e) =>
                  updateSkill(idx, 'years', parseInt(e.target.value) || 0)
                }
                min="0"
                max="50"
              />

              <button
                type="button"
                onClick={() => removeSkill(idx)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Sil
              </button>
            </div>
          ))
        )}
      </section>

      <hr
        style={{
          margin: '30px 0',
          border: 'none',
          borderTop: '1px solid #eee',
        }}
      />

      {/* --- DİLLER --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ color: '#1890ff', margin: 0 }}>Yabancı Diller</h3>
          <button
            type="button"
            onClick={addLanguage}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Dil Ekle
          </button>
        </div>

        {form.languages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              border: '1px dashed #ddd',
              borderRadius: '5px',
              background: 'white',
              color: '#666',
            }}
          >
            Henüz dil eklenmemiş.
          </div>
        ) : (
          form.languages.map((lang, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '10px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: 'white',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr auto',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                placeholder="Dil (İngilizce, Almanca...)"
                value={lang.language || ''}
                onChange={(e) =>
                  updateLanguage(idx, 'language', e.target.value)
                }
              />

              <select
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                value={lang.level || 'Intermediate'}
                onChange={(e) => updateLanguage(idx, 'level', e.target.value)}
              >
                <option value="Beginner">Başlangıç (A1-A2)</option>
                <option value="Intermediate">Orta (B1-B2)</option>
                <option value="Advanced">İleri (C1-C2)</option>
                <option value="Native">Anadil</option>
              </select>

              <button
                type="button"
                onClick={() => removeLanguage(idx)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Sil
              </button>
            </div>
          ))
        )}
      </section>

      <hr
        style={{
          margin: '30px 0',
          border: 'none',
          borderTop: '1px solid #eee',
        }}
      />

      {/* --- SERTİFİKALAR --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ color: '#1890ff', margin: 0 }}>Sertifikalar</h3>
          <button
            type="button"
            onClick={addCertificate}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Sertifika Ekle
          </button>
        </div>

        {form.certificates.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              border: '1px dashed #ddd',
              borderRadius: '5px',
              background: 'white',
              color: '#666',
            }}
          >
            Henüz sertifika eklenmemiş.
          </div>
        ) : (
          form.certificates.map((cert, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '15px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: 'white',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                    }}
                  >
                    Sertifika Adı
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="AWS Certified Developer"
                    value={cert.name || ''}
                    onChange={(e) =>
                      updateCertificate(idx, 'name', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                    }}
                  >
                    Veren Kurum
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="Amazon"
                    value={cert.issuer || ''}
                    onChange={(e) =>
                      updateCertificate(idx, 'issuer', e.target.value)
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr auto',
                  gap: '10px',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                    }}
                  >
                    Tarih
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid ' +
                        '#ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="2023-05"
                    value={cert.date || ''}
                    onChange={(e) =>
                      updateCertificate(idx, 'date', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                    }}
                  >
                    Link (Opsiyonel)
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="https://example.com/certificate"
                    value={cert.url || ''}
                    onChange={(e) =>
                      updateCertificate(idx, 'url', e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCertificate(idx)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    height: '36px',
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <hr
        style={{
          margin: '30px 0',
          border: 'none',
          borderTop: '1px solid #eee',
        }}
      />

      {/* --- PROJELER --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ color: '#1890ff', margin: 0 }}>Projeler</h3>
          <button
            type="button"
            onClick={addProject}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Proje Ekle
          </button>
        </div>

        <p
          style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          Tamamladığınız veya devam eden projelerinizi ekleyin.
        </p>

        {form.projects.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              border: '2px dashed #ddd',
              borderRadius: '8px',
              background: 'white',
              color: '#666',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '10px',
              }}
            >
              📂
            </div>
            <h4
              style={{
                margin: '0 0 10px 0',
                color: '#666',
              }}
            >
              Henüz proje eklenmemiş
            </h4>
            <p style={{ margin: 0 }}>
              "Proje Ekle" butonuna tıklayarak ilk projenizi ekleyin.
            </p>
          </div>
        ) : (
          form.projects.map((project, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '15px',
                  marginBottom: '15px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                    }}
                  >
                    Proje Adı
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="Örn: E-Ticaret Sitesi"
                    value={project.projectName || ''}
                    onChange={(e) =>
                      updateProject(idx, 'projectName', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                    }}
                  >
                    Başlangıç Tarihi
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="2023-02"
                    value={project.startDate || ''}
                    onChange={(e) =>
                      updateProject(idx, 'startDate', e.target.value)
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '15px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={project.isOngoing || false}
                    onChange={(e) =>
                      updateProject(idx, 'isOngoing', e.target.checked)
                    }
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Devam ediyor
                  </span>
                </label>

                {!project.isOngoing && (
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                      }}
                    >
                      Bitiş Tarihi
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                      placeholder="2023-06"
                      value={project.endDate || ''}
                      onChange={(e) =>
                        updateProject(idx, 'endDate', e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => removeProject(idx)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Projeyi Sil
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <hr
        style={{
          margin: '30px 0',
          border: 'none',
          borderTop: '1px solid #eee',
        }}
      />

      {/* --- DENEYİMLER --- */}
      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ color: '#1890ff', margin: 0 }}>Deneyimler</h3>
          <button
            type="button"
            onClick={addExperience}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Deneyim Ekle
          </button>
        </div>

        {form.experiences.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              border: '1px dashed #ddd',
              borderRadius: '5px',
              background: 'white',
              color: '#666',
            }}
          >
            Henüz deneyim eklenmemiş.
          </div>
        ) : (
          form.experiences.map((exp, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '15px',
                  marginBottom: '15px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Pozisyon
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="Backend Developer"
                    value={exp.position || ''}
                    onChange={(e) =>
                      updateExperience(idx, 'position', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Şirket
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="ABC Şirketi"
                    value={exp.company || ''}
                    onChange={(e) =>
                      updateExperience(idx, 'company', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Şehir
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    placeholder="İstanbul"
                    value={exp.city || ''}
                    onChange={(e) =>
                      updateExperience(idx, 'city', e.target.value)
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px',
                  marginBottom: '15px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Başlangıç Tarihi
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    type="text"
                    placeholder="2023-01"
                    value={exp.startDate || ''}
                    onChange={(e) =>
                      updateExperience(idx, 'startDate', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Bitiş Tarihi
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    type="text"
                    placeholder="2024-01 veya Devam"
                    value={exp.endDate || ''}
                    onChange={(e) =>
                      updateExperience(idx, 'endDate', e.target.value)
                    }
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Açıklama
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    minHeight: '80px',
                  }}
                  placeholder="İş tanımı ve sorumluluklar..."
                  value={exp.description || ''}
                  onChange={(e) =>
                    updateExperience(idx, 'description', e.target.value)
                  }
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => removeExperience(idx)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontWeight: '500',
                  }}
                >
                  Deneyimi Sil
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* --- SAVE BUTTON --- */}
      <div
        style={{
          position: 'sticky',
          bottom: '0',
          background: 'white',
          padding: '20px 0',
          borderTop: '1px solid #eee',
          marginTop: '30px',
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: '600',
            background: saving ? '#6c757d' : '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
          }}
        >
          {saving ? (
            <span>
              <span style={{ marginRight: '8px' }}>⏳</span>
              Kaydediliyor...
            </span>
          ) : (
            <span>
              <span style={{ marginRight: '8px' }}>💾</span>
              Tüm Değişiklikleri Kaydet
            </span>
          )}
        </button>

        <div
          style={{
            textAlign: 'center',
            marginTop: '10px',
            color: '#666',
            fontSize: '14px',
          }}
        >
          Kaydet butonuna tıkladığınızda tüm bilgiler kaydedilecek ve dashboard'a
          yönlendirileceksiniz.
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
