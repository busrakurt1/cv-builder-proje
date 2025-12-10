import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '15px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <div>
          <h1>🎯 CV Builder Dashboard</h1>
          <p>
            Hoş geldin, <strong>{user.fullName}</strong>! 👋
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '8px 15px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            👤 Profilim
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 15px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      {/* Hızlı İstatistikler */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            padding: '15px',
            background: '#007bff',
            color: 'white',
            borderRadius: '8px',
          }}
        >
          <h3>📧 Email</h3>
          <p>{user.email}</p>
        </div>
        <div
          style={{
            padding: '15px',
            background: '#28a745',
            color: 'white',
            borderRadius: '8px',
          }}
        >
          <h3>📍 Konum</h3>
          <p>{user.location || 'Belirtilmemiş'}</p>
        </div>
        <div
          style={{
            padding: '15px',
            background: '#ffc107',
            color: 'black',
            borderRadius: '8px',
          }}
        >
          <h3>🎓 Eğitim</h3>
          <p>{user.educationLevel || 'Belirtilmemiş'}</p>
        </div>
        <div
          style={{
            padding: '15px',
            background: '#17a2b8',
            color: 'white',
            borderRadius: '8px',
          }}
        >
          <h3>💼 Durum </h3>
          {/* <p>{user.workExperience ? 'Profil Dolu' }</p> */}
        </div>
      </div>

      {/* Ana İşlem Kartları */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        {/* Profil Yönetimi */}
        <div
          style={{
            border: '1px solid #007bff',
            borderRadius: '8px',
            padding: '25px',
            background: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <h3>👤 Profilimi Düzenle</h3>
          <p>CV bilgilerinizi güncelleyin ve tamamlayın</p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              marginTop: '15px',
              width: '100%',
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Profilimi Düzenle →
          </button>
        </div>

        {/* CV Oluşturucu */}
        <div
          style={{
            border: '1px solid #007bff',
            borderRadius: '8px',
            padding: '25px',
            background: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <h3>📄 CV Oluştur</h3>
          <p>Profil bilgilerinizle otomatik CV oluşturun</p>
          <button
            onClick={() => navigate('/cv-builder')}
            style={{
              marginTop: '15px',
              width: '100%',
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            CV'mi Oluştur →
          </button>
        </div>

        {/* 🔍 İş İlanı Analiz */}
        <div
          style={{
            border: '1px solid #6f42c1',
            borderRadius: '8px',
            padding: '25px',
            background: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <h3>🔍 İş İlanı Analiz</h3>
          <p>CV'niz ile iş ilanını karşılaştırın</p>
          <button
            onClick={() => navigate('/job-analysis')} // 👈 Yönlendirme eklendi
            style={{
              marginTop: '15px',
              width: '100%',
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            İlan Analiz Et →
          </button>
        </div>
      </div>

      {/* Hızlı Erişim */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          background: '#f8f9fa',
        }}
      >
        <h3>⚡ Hızlı Erişim</h3>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '15px',
          }}
        >
          {['🎨 CV Şablonları', '📊 Becerilerim', '💼 Deneyimlerim', '🎓 Eğitim Bilgilerim'].map(
            (item) => (
              <button
                key={item}
                onClick={() => navigate('/profile')}
                style={{
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
