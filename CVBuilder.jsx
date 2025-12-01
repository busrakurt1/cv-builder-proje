import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CVPreview from '../components/cv/CVPreview';
import PDFService from '../services/pdfService'; 

const CVBuilder = () => {
  const [user, setUser] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Görsel PDF Dışa Aktarma Fonksiyonu (HTML'den Görüntü Alır)
  const handleExportPDF = async () => {
    if (!user) return;
    
    setPdfLoading(true);
    
    try {
      // PDFService'in bu fonksiyonu CVPreview'daki id="cv-preview" elementini kullanmalı.
      await PDFService.generateCVPDF(user); 
    } catch (error) {
      console.error('Görsel PDF oluşturma hatası:', error);
      alert('Görsel PDF oluşturulurken hata oluştu.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Basit PDF Dışa Aktarma Fonksiyonu (Metin tabanlı PDF oluşturur)
  const handleExportSimplePDF = async () => {
    if (!user) return;
    
    setPdfLoading(true);
    
    try {
      await PDFService.generateSimplePDF(user);
    } catch (error) {
      console.error('Basit PDF hatası:', error);
      alert('Basit PDF oluşturulurken hata oluştu.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  if (!user) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HEADER VE BUTONLAR */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '1px solid #ddd'
      }}>
        <div>
          <h1>📄 CV Oluşturucu</h1>
          <p>Profesyonel CV şablonu</p>
        </div>
        <div>
          <button 
            onClick={handleEditProfile}
            style={{ marginRight: '10px', padding: '10px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✏️ Profili Düzenle
          </button>
          
          <button 
            onClick={handleExportPDF}
            disabled={pdfLoading}
            style={{
              padding: '10px 15px',
              background: pdfLoading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {pdfLoading ? '⏳ Hazırlanıyor...' : '🖼️ Görsel PDF İndir'}
          </button>

          <button 
            onClick={handleExportSimplePDF}
            disabled={pdfLoading}
            style={{
              padding: '10px 15px',
              background: pdfLoading ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pdfLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {pdfLoading ? '⏳ Hazırlanıyor...' : '📄 Basit PDF İndir'}
          </button>
        </div>
      </div>

      {/* CV PREVIEW */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '850px', // CV'nin max genişliğine ayarlandı
          background: 'white',
          padding: '0', // CVPreview'ın kendi padding'i var
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <CVPreview user={user} />
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;