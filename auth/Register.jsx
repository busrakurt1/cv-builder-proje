import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userManager } from '../../services/api'; // ✅ userManager eklendi

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    phone: '',
    educationLevel: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  // Türkiye Şehirleri Listesi
  const turkiyeSehirleri = [
    '', // Boş seçenek
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
    'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
    'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
    'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep',
    'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul',
    'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli',
    'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
    'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
    'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa',
    'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
    'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova',
    'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Şifre kontrolü
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Şifreler eşleşmiyor!');
      setLoading(false);
      return;
    }

    // Backend'e gönderilecek data
    const userData = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      location: formData.location,
      phone: formData.phone,
      educationLevel: formData.educationLevel,
      enabled: true
    };

    try {
      console.log('🔄 Register denemesi:', userData);
      const response = await authAPI.register(userData);
      
      // ✅ Başarılı kayıt - kullanıcıyı localStorage'a kaydet
      if (response.data.success) {
        const userData = response.data.data;
        userManager.setUser(userData);
        
        setMessage('✅ Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
        
        // 2 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } else {
        setMessage('❌ Kayıt başarısız: ' + (response.data.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('❌ Register hatası:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Kayıt sırasında hata oluştu!';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '450px', 
      margin: '20px auto',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      backgroundColor: 'white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '25px', 
        color: '#333',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        📝 CV Builder'a Kayıt Ol
      </h2>
      
      {message && (
        <div style={{
          padding: '12px',
          margin: '15px 0',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '6px',
          color: message.includes('✅') ? '#155724' : '#721c24',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Ad Soyad:
          </label>
          <input 
            type="text" 
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
            placeholder="Adınız ve soyadınız"
            required
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Email:
          </label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
            placeholder="email@example.com"
            required
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>
        
        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Şifre:
          </label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
            placeholder="Şifreniz"
            required
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Şifre Tekrar:
          </label>
          <input 
            type="password" 
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
            placeholder="Şifrenizi tekrar girin"
            required
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* KONUM - TÜRKİYE ŞEHİRLERİ DROPDOWN */}
        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Konum:
          </label>
          <select 
            name="location"
            value={formData.location}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'white',
              transition: 'border-color 0.2s'
            }}
            required
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          >
            {turkiyeSehirleri.map((sehir, index) => (
              <option key={index} value={sehir}>
                {sehir === '' ? 'Şehrinizi seçin' : sehir}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Telefon:
          </label>
          <input 
            type="tel" 
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
            placeholder="555-123-4567"
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <div style={{ marginBottom: '25px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
            Eğitim Seviyesi:
          </label>
          <select 
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'white',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          >
            <option value="">Eğitim seviyenizi seçin</option>
            <option value="İlkokul">İlkokul</option>
            <option value="Ortaokul">Ortaokul</option>
            <option value="Lise">Lise</option>
            <option value="Ön Lisans">Ön Lisans</option>
            <option value="Lisans">Lisans</option>
            <option value="Yüksek Lisans">Yüksek Lisans</option>
            <option value="Doktora">Doktora</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: loading ? '#6c757d' : '#28a745', 
            color: 'white', 
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#218838')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#28a745')}
        >
          {loading ? '⏳ Kayıt Yapılıyor...' : '📝 Kayıt Ol'}
        </button>
      </form>
      
      <p style={{ 
        marginTop: '20px', 
        fontSize: '14px', 
        textAlign: 'center',
        color: '#666',
        borderTop: '1px solid #eee',
        paddingTop: '15px'
      }}>
        Zaten hesabınız var mı? {' '}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            onSwitchToLogin();
          }}
          style={{ 
            color: '#007bff', 
            cursor: 'pointer',
            fontWeight: '500',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          Giriş Yapın
        </a>
      </p>
    </div>
  );
};

export default Register;