import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        console.log('📋 User Data from localStorage:', userObj); // Debug
        
        if (!userObj.id) {
          console.error('❌ User ID not found in localStorage');
          setMessage('❌ Kullanıcı bilgileri yüklenemedi. Lütfen tekrar giriş yapın.');
          return;
        }

        setUser(userObj);
        
        setFormData({
          // Kişisel Bilgiler
          fullName: userObj.fullName || '',
          email: userObj.email || '',
          phone: userObj.phone || '',
          location: userObj.location || '',
          linkedinUrl: userObj.linkedinUrl || '',
          githubUrl: userObj.githubUrl || '', 
          portfolioUrl: userObj.portfolioUrl || '',

          // Eğitim Bilgileri
          educationLevel: userObj.educationLevel || '',
          university: userObj.university || '',
          department: userObj.department || '',
          graduationYear: userObj.graduationYear || '',
          education: userObj.education || '',

          // Teknik Beceriler
          technicalSkills: userObj.technicalSkills || '',
          programmingLanguages: userObj.programmingLanguages || '',
          frameworks: userObj.frameworks || '', 
          tools: userObj.tools || '',          
          languages: userObj.languages || '',

          // Profesyonel Bilgiler
          workExperience: userObj.workExperience || '',
          projects: userObj.projects || '',
          certifications: userObj.certifications || '',
          summary: userObj.summary || '',
          achievements: userObj.achievements || '',
          preferredJobRoles: userObj.preferredJobRoles || '',

          // CV Özelleştirme
          cvTemplate: userObj.cvTemplate || 'modern',
          cvColorScheme: userObj.cvColorScheme || 'blue'
        });
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        setMessage('❌ Kullanıcı verileri okunamadı. Lütfen tekrar giriş yapın.');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // ✅ Kullanıcı ID kontrolü
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.');
      }

      console.log('🔄 Updating user with ID:', userId); // Debug

      const userRequest = {
        // Kişisel Bilgiler
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,

        // Eğitim Bilgileri
        educationLevel: formData.educationLevel,
        university: formData.university,
        department: formData.department,
        graduationYear: formData.graduationYear,
        education: formData.education,

        // Teknik Beceriler
        technicalSkills: formData.technicalSkills,
        programmingLanguages: formData.programmingLanguages,
        frameworks: formData.frameworks,
        tools: formData.tools,
        languages: formData.languages,

        // Profesyonel Bilgiler
        workExperience: formData.workExperience,
        projects: formData.projects,
        certifications: formData.certifications,
        summary: formData.summary,
        achievements: formData.achievements,
        preferredJobRoles: formData.preferredJobRoles,

        // CV Özelleştirme
        cvTemplate: formData.cvTemplate,
        cvColorScheme: formData.cvColorScheme
      };

      console.log('📤 Sending update request:', { userId, userRequest }); // Debug

      // ✅ updateUser metodunu kullan (ID'yi number olarak gönder)
      const response = await userAPI.updateUser(Number(userId), userRequest);
      
      console.log('✅ Update successful:', response.data);
      
      // ✅ Güncellenmiş kullanıcı verisini kaydet
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage('✅ Profil başarıyla güncellendi!');
      
      // ✅ 3 saniye sonra mesajı temizle
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Update error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage('❌ Profil güncelleme hatası: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    const processedValue = type === 'number' ? (value === '' ? '' : parseInt(value)) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  if (!user) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2>Profil Yükleniyor...</h2>
        <p>Kullanıcı bilgileri alınıyor, lütfen bekleyin.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>👤 Profil ve CV Düzenleme</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Kullanıcı ID: <strong>{user.id}</strong> | Email: <strong>{user.email}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ 
              padding: '10px 20px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Dashboard'a Dön
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '10px 20px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Çıkış Yap
          </button>
        </div>
      </div>
      
      {/* MESSAGE */}
      {message && (
        <div style={{
          padding: '15px',
          margin: '20px 0',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: message.includes('✅') ? '#155724' : '#721c24',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        
        {/* BÖLÜM 1: KİŞİSEL BİLGİLER */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            borderBottom: '3px solid #007bff', 
            paddingBottom: '10px', 
            marginBottom: '25px',
            color: '#007bff',
            fontSize: '24px'
          }}>
            📝 1. Temel Bilgiler
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '25px' 
          }}>
            {[
              { label: 'Ad Soyad', name: 'fullName', type: 'text', required: true, placeholder: 'Adınız ve soyadınız' },
              { label: 'Email', name: 'email', type: 'email', disabled: true, placeholder: 'Email adresiniz' },
              { label: 'Telefon', name: 'phone', type: 'tel', placeholder: '555-123-4567' },
              { label: 'Konum', name: 'location', type: 'text', placeholder: 'İstanbul, Türkiye' },
              { label: 'LinkedIn URL', name: 'linkedinUrl', type: 'url', placeholder: 'https://linkedin.com/in/...' },
              { label: 'GitHub URL', name: 'githubUrl', type: 'url', placeholder: 'https://github.com/...' },
              { label: 'Portfolyo URL', name: 'portfolioUrl', type: 'url', placeholder: 'https://projem.com' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  disabled={field.disabled}
                  required={field.required}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${field.disabled ? '#ccc' : '#ddd'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    background: field.disabled ? '#f8f9fa' : 'white',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder={field.placeholder}
                  onFocus={(e) => !field.disabled && (e.target.style.borderColor = '#007bff')}
                  onBlur={(e) => !field.disabled && (e.target.style.borderColor = '#ddd')}
                />
              </div>
            ))}
          </div>
        </section>

        {/* BÖLÜM 2: EĞİTİM BİLGİLERİ */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            borderBottom: '3px solid #28a745', 
            paddingBottom: '10px', 
            marginBottom: '25px',
            color: '#28a745',
            fontSize: '24px'
          }}>
            🎓 2. Eğitim Bilgileri
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '25px',
            marginBottom: '25px'
          }}>
            {[
              { 
                label: 'Eğitim Seviyesi', 
                name: 'educationLevel', 
                type: 'select',
                options: ['', 'Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora']
              },
              { label: 'Üniversite', name: 'university', type: 'text', placeholder: 'İstanbul Teknik Üniversitesi' },
              { label: 'Bölüm', name: 'department', type: 'text', placeholder: 'Bilgisayar Mühendisliği' },
              { label: 'Mezuniyet Yılı', name: 'graduationYear', type: 'number', placeholder: '2025' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      background: 'white'
                    }}
                  >
                    {field.options.map(option => (
                      <option key={option} value={option}>
                        {option === '' ? 'Seçiniz' : option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              Eğitim Bilgileri (Detaylı Özet)
            </label>
            <textarea
              name="education"
              value={formData.education || ''}
              onChange={handleChange}
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '100px'
              }}
              placeholder="Örn: %100 burslu okudum, bitirme projem, akademik başarılar..."
            />
          </div>
        </section>

        {/* BÖLÜM 3: TEKNİK BECERİLER */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            borderBottom: '3px solid #ffc107', 
            paddingBottom: '10px', 
            marginBottom: '25px',
            color: '#ffc107',
            fontSize: '24px'
          }}>
            💻 3. Teknik Beceriler
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '25px',
            marginBottom: '25px'
          }}>
            {[
              { label: 'Programlama Dilleri', name: 'programmingLanguages', placeholder: 'Java, Python, JavaScript...' },
              { label: 'Frameworkler/Kütüphaneler', name: 'frameworks', placeholder: 'Spring Boot, React, Django...' },
              { label: 'Geliştirme Araçları', name: 'tools', placeholder: 'Git, Docker, Kubernetes...' },
              { label: 'Diller', name: 'languages', placeholder: 'Türkçe (Anadil), İngilizce (B2)...' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              Genel Teknik Beceriler Özeti
            </label>
            <textarea
              name="technicalSkills"
              value={formData.technicalSkills || ''}
              onChange={handleChange}
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '100px'
              }}
              placeholder="Tüm teknik becerilerinizin kapsamlı özeti..."
            />
          </div>
        </section>

        {/* BÖLÜM 4: PROFESYONEL BİLGİLER */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            borderBottom: '3px solid #dc3545', 
            paddingBottom: '10px', 
            marginBottom: '25px',
            color: '#dc3545',
            fontSize: '24px'
          }}>
            💼 4. Kariyer ve Proje Detayları
          </h2>
          
          {[
            { 
              label: 'Profesyonel Özet', 
              name: 'summary', 
              rows: 4,
              placeholder: 'Kariyer hedeflerinizi, uzmanlık alanlarınızı ve deneyiminizi özetleyin...' 
            },
            { 
              label: 'İş Deneyimleri', 
              name: 'workExperience', 
              rows: 6,
              placeholder: 'Şirket adı, pozisyon, çalışma süresi, sorumluluklar, başarılar...' 
            },
            { 
              label: 'Projeler', 
              name: 'projects', 
              rows: 6,
              placeholder: 'Proje adı, kullanılan teknolojiler, proje açıklaması, sorumluluklarınız...' 
            },
            { 
              label: 'Önemli Başarılar / Ödüller', 
              name: 'achievements', 
              rows: 4,
              placeholder: 'Ödüller, sertifikalar, gönüllü çalışmalar, önemli başarılar...' 
            },
            { 
              label: 'Sertifikalar', 
              name: 'certifications', 
              rows: 4,
              placeholder: 'Sertifika adı, veren kurum, tarih, detaylar...' 
            },
          ].map(field => (
            <div key={field.name} style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                {field.label}
              </label>
              <textarea
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                rows={field.rows}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              Tercih Edilen Pozisyonlar
            </label>
            <input
              type="text"
              name="preferredJobRoles"
              value={formData.preferredJobRoles || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Junior Backend Developer, Full Stack Engineer, DevOps Specialist..."
            />
          </div>
        </section>

        {/* BÖLÜM 5: TASARIM AYARLARI */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            borderBottom: '3px solid #6f42c1', 
            paddingBottom: '10px', 
            marginBottom: '25px',
            color: '#6f42c1',
            fontSize: '24px'
          }}>
            🎨 5. Tasarım Ayarları
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '25px' 
          }}>
            {[
              { 
                label: 'CV Şablonu', 
                name: 'cvTemplate', 
                options: [
                  { value: 'modern', label: 'Modern' },
                  { value: 'classic', label: 'Klasik' },
                  { value: 'creative', label: 'Yaratıcı' },
                  { value: 'minimal', label: 'Minimal' }
                ]
              },
              { 
                label: 'Renk Şeması', 
                name: 'cvColorScheme', 
                options: [
                  { value: 'blue', label: 'Mavi' },
                  { value: 'green', label: 'Yeşil' },
                  { value: 'red', label: 'Kırmızı' },
                  { value: 'purple', label: 'Mor' },
                  { value: 'orange', label: 'Turuncu' }
                ]
              },
            ].map(field => (
              <div key={field.name}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  {field.label}
                </label>
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  {field.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '18px', 
            background: loading ? '#6c757d' : '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#0056b3')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#007bff')}
        >
          {loading ? (
            <>
              <span style={{ marginRight: '10px' }}>⏳</span>
              Veriler Kaydediliyor...
            </>
          ) : (
            <>
              <span style={{ marginRight: '10px' }}>💾</span>
              Profili Kaydet ve Güncelle
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Profile;