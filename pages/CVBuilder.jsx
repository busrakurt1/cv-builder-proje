// src/pages/CVBuilder.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // useLocation Eklendi
import axios from "axios";
import CVPreview from "../components/cv/CVPreview";
import PDFService from "../services/pdfService";
import { profileAPI, cvAPI, jobAPI } from "../services/api";

const CVBuilder = () => {
  // ================= STATE YÖNETİMİ =================
  const [originalUser, setOriginalUser] = useState(null); // TR orijinal veri
  const [translatedUser, setTranslatedUser] = useState(null); // EN çevrilmiş veri
  const [aiData, setAiData] = useState(null); // AI tarafından üretilen veri
  const [latestJob, setLatestJob] = useState(null); // Kullanıcının son analiz ettiği iş ilanı

  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false); // İlan yükleme durumu

  const [language, setLanguage] = useState("tr"); // "tr" | "en"
  
  const navigate = useNavigate();
  const location = useLocation(); // Location hook'u (Sayfa değişimlerini dinlemek için)

  // ================= BAŞLANGIÇ VERİLERİNİ YÜKLE =================
  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        navigate("/");
        return;
      }

      const authUser = JSON.parse(userData);

      try {
        // 1. Profil Verisini Çek
        const res = await profileAPI.getMe();
        const profile = res.data || {};
        setOriginalUser({
          ...authUser,
          profile,
          ...profile
        });

        // 2. En Son İş İlanını Çek
        await loadLatestJob(authUser.id);

        // LocalStorage temizliği (İş analizi sayfasından gelindiyse flag'i temizle)
        localStorage.removeItem("lastJobAnalyzed");

      } catch (err) {
        console.error("Profil yüklenemedi:", err);
        setOriginalUser(authUser);
      }
    };

    init();
    
    // location dependency: Sayfaya geri dönüldüğünde useEffect tekrar çalışır
  }, [navigate, location]);

  // En son iş ilanını yükleyen fonksiyon (Geliştirilmiş Sıralama)
  const loadLatestJob = async (userId) => {
    try {
      setLoadingJob(true);
      const response = await jobAPI.getUserJobs(userId);
      
      if (response.data && response.data.length > 0) {
        // En son eklenen ilanı al (createdAt'e göre sırala: yeniden eskiye)
        const sorted = [...response.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        console.log("Son analiz edilen ilan:", sorted[0].position);
        setLatestJob(sorted[0]);
      } else {
        setLatestJob(null);
      }
    } catch (error) {
      console.error("İş ilanı yüklenemedi:", error);
    } finally {
      setLoadingJob(false);
    }
  };

  // Manuel İlan Yenileme
  const handleRefreshJob = () => {
    if (originalUser?.id) {
      loadLatestJob(originalUser.id);
    }
  };

  // ================= DİL DEĞİŞTİRME =================
  const handleLanguageChange = async (targetLang) => {
    if (targetLang === language) return;
    setLanguage(targetLang);

    if (targetLang === "tr") {
      return;
    }

    // EN seçildiyse ve daha önce çevrilmemişse çevir
    if (targetLang === "en" && !translatedUser) {
      await translateCVData();
    }
  };

  // ================= ÇEVİRİ FONKSİYONU =================
  const translateCVData = async () => {
    if (!originalUser) {
      alert("Önce profilinizin yüklenmesini bekleyin.");
      return;
    }

    setIsTranslating(true);
    try {
      // payload: originalUser kopyası
      let payload = JSON.parse(JSON.stringify(originalUser));

      // Eğer aiData varsa, AI tarafından düzenlenen alanları üstüne yaz
      if (aiData) {
        if (aiData.summary) payload.summary = aiData.summary;

        if (aiData.optimizedExperiences && aiData.optimizedExperiences.length > 0) {
          payload.experiences = aiData.optimizedExperiences;
        }

        if (aiData.optimizedProjects && aiData.optimizedProjects.length > 0) {
          payload.projects = aiData.optimizedProjects;
        } else if (aiData.optimizedUserProjects && aiData.optimizedUserProjects.length > 0) {
          payload.projects = aiData.optimizedUserProjects;
        }

        if (aiData.skills && aiData.skills.length > 0) payload.skills = aiData.skills;
        if (aiData.languages && aiData.languages.length > 0) payload.languages = aiData.languages;
        if (aiData.certificates && aiData.certificates.length > 0) payload.certificates = aiData.certificates;
        if (aiData.optimizedEducation && aiData.optimizedEducation.length > 0) payload.education = aiData.optimizedEducation;
      }

      // Backend API'ye gönder
      const response = await axios.post(
        `http://localhost:8080/api/cv-generator/translate?lang=en`,
        payload
      );

      if (response.data) {
        console.log("Çeviri Başarılı:", response.data);
        setTranslatedUser(response.data);
      }
    } catch (error) {
      console.error("Çeviri hatası:", error);
      alert("Çeviri servisine ulaşılamadı.");
      setLanguage("tr");
    } finally {
      setIsTranslating(false);
    }
  };

  // ================= AI OPTIMIZE FONKSİYONU =================
  const handleAiGenerate = async () => {
    if (!originalUser?.id) {
      alert("Kullanıcı bilgisi bulunamadı.");
      return;
    }

    // Eğer hiç iş ilanı yoksa uyar
    if (!latestJob) {
      alert("Lütfen önce 'İş Analizi' sayfasından bir ilan analiz edin.");
      navigate("/job-analysis");
      return;
    }

    setAiLoading(true);
    try {
      const userId = originalUser.id;
      
      // Backend'e sadece userId gönderiyoruz. 
      // Backend otomatik olarak 'null' job ID varsayımıyla en son ilanı kullanacak.
      const response = await cvAPI.generateCV(userId); 

      if (response.data) {
        const data = response.data.data || response.data;
        const summaries = data.tailoredSummaries || [];

        setAiData({
          summaries: summaries,
          summary: data.tailoredSummary || (summaries.length > 0 ? summaries[0] : ""),
          skills: data.prioritizedSkills || [],
          optimizedExperiences: data.optimizedExperiences || [],
          optimizedProjects: data.optimizedProjects || [],
          optimizedUserProjects: data.optimizedUserProjects || [],
          languages: data.optimizedLanguages || [],
          certificates: data.optimizedCertificates || [],
          optimizedEducation: data.optimizedEducation || [],
          jobUsed: latestJob // UI'da göstermek için kullanılan ilanı sakla
        });

        // AI yeni içerik ürettiği için eski İngilizce çeviriyi sıfırla
        setTranslatedUser(null);

        alert(`CV başarıyla optimize edildi! ✨\nKullanılan İlan: ${latestJob?.position}`);
      }
    } catch (error) {
      console.error("AI Hatası:", error);
      alert("AI servisine ulaşılamadı. Backend konsolunu kontrol edin.");
    } finally {
      setAiLoading(false);
    }
  };

  // ================= PDF İNDİRME =================
  const handleExportPDF = async () => {
    if (!originalUser) return;
    setPdfLoading(true);
    try {
      // Aktif veri: eğer EN ve translatedUser varsa onu, değilse aiData veya originalUser
      const activeData = (language === "en" && translatedUser) ? translatedUser : (aiData || originalUser);

      const dataToPrint = {
        ...activeData,
        language: language,
        linkedinUrl: activeData.linkedinUrl || activeData.profile?.linkedinUrl,
        githubUrl: activeData.githubUrl || activeData.profile?.githubUrl,
        websiteUrl: activeData.websiteUrl || activeData.profile?.websiteUrl,
      };

      await PDFService.generateCVPDF(dataToPrint);
    } catch (error) {
      console.error("PDF Hatası:", error);
      alert("PDF oluşturulurken hata oluştu.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEditProfile = () => navigate("/profile");

  if (!originalUser) return <div style={{ padding: "20px", textAlign: "center" }}>Yükleniyor...</div>;

  // Preview'de gösterilecek aktif kullanıcı verisi
  const activeUser = (language === "en" && translatedUser) ? translatedUser : originalUser;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: '"Segoe UI", sans-serif' }}>
      
      {/* --- ÜST PANEL --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid #e0e0e0" }}>
        
        {/* SOL: BAŞLIK VE DURUM */}
        <div>
          <h1 style={{ fontSize: "30px", marginBottom: "4px" }}>📄 CV Oluşturucu</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <p style={{ color: "#666", margin: 0 }}>
              Profesyonel ve AI Destekli CV
            </p>
            
            {/* İLAN DURUMU GÖSTERGESİ (SOL TARAF) */}
            {loadingJob ? (
              <span style={{ fontSize: "14px", color: "#666", padding: "4px 8px", background: "#f3f4f6", borderRadius: "4px" }}>
                ⏳ İlan yükleniyor...
              </span>
            ) : latestJob ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ 
                  fontSize: "14px", 
                  background: "#10b981", 
                  color: "white", 
                  padding: "4px 8px", 
                  borderRadius: "4px",
                  display: "flex", alignItems: "center", gap: "5px"
                }}>
                  ✓ İlan analiz edildi
                </span>
                <span style={{ fontSize: "14px", color: "#4b5563", fontWeight: "600" }}>
                  {latestJob.position}
                </span>
                <button 
                  onClick={handleRefreshJob}
                  style={{ padding: "2px 6px", fontSize: "12px", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", color: "#6b7280", cursor: "pointer" }}
                  title="İlanı yenile"
                >
                  🔄
                </button>
              </div>
            ) : (
              <span style={{ 
                fontSize: "14px", 
                background: "#f59e0b", 
                color: "#92400e", 
                padding: "4px 8px", 
                borderRadius: "4px",
                display: "flex", alignItems: "center", gap: "5px"
              }}>
                ⚠️ İlan analiz edilmedi
              </span>
            )}
          </div>
        </div>

        {/* SAĞ: BUTON GRUBU */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          
          {/* ANALİZ ET BUTONU */}
          <button 
            onClick={() => navigate("/job-analysis")}
            style={{ 
              padding: "10px 16px", 
              background: "#3b82f6", 
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px"
            }}
          >
            📊 Yeni İlan Analiz Et
          </button>

          {/* DİL SEÇİMİ */}
          <div className="language-switch" style={{ marginRight: "15px", display: "flex", gap: "5px", background: "#f8f9fa", padding: "5px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <button
              onClick={() => handleLanguageChange("tr")}
              style={{ fontWeight: language === "tr" ? "bold" : "normal", cursor: "pointer", border: "none", background: "none", color: language === "tr" ? "#000" : "#888" }}
            >
              🇹🇷 TR
            </button>
            <span style={{ color: "#ccc" }}>|</span>
            <button
              onClick={() => handleLanguageChange("en")}
              disabled={isTranslating}
              style={{ fontWeight: language === "en" ? "bold" : "normal", cursor: isTranslating ? "wait" : "pointer", border: "none", background: "none", color: language === "en" ? "#000" : "#888" }}
            >
              {isTranslating ? "↻ Çeviriliyor..." : "🇬🇧 EN"}
            </button>
          </div>

          {/* AI OPTIMIZE BUTONU */}
          <button 
            onClick={handleAiGenerate} 
            disabled={aiLoading || !latestJob}
            style={{ 
              padding: "10px 16px", 
              background: (!latestJob || aiLoading) ? "#9ca3af" : "#6f42c1", 
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              cursor: (!latestJob || aiLoading) ? "not-allowed" : "pointer",
              position: "relative",
              minWidth: "140px"
            }}
            title={!latestJob ? "Önce iş ilanı analiz etmelisiniz" : "En son analiz edilen ilan ile CV'yi optimize et"}
          >
            {aiLoading ? "⏳ Optimize Ediliyor..." : "✨ AI Optimize"}
            {latestJob && (
              <span style={{ 
                position: "absolute", 
                top: "-8px", 
                right: "-8px", 
                background: "#10b981", 
                color: "white", 
                fontSize: "10px", 
                padding: "2px 6px", 
                borderRadius: "10px",
                border: "2px solid white"
              }}>
                ✓
              </span>
            )}
          </button>

          {/* DÜZENLE BUTONU */}
          <button onClick={handleEditProfile} style={{ padding: "10px 16px", background: "#495057", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            ✏️ Düzenle
          </button>

          {/* PDF İNDİR BUTONU */}
          <button onClick={handleExportPDF} disabled={pdfLoading} style={{ padding: "10px 16px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: pdfLoading ? "not-allowed" : "pointer" }}>
            {pdfLoading ? "⏳" : " PDF İndir"}
          </button>
        </div>
      </div>

      {/* --- UYARI KUTUSU (EĞER HİÇ İLAN YOKSA) --- */}
      {!loadingJob && !latestJob && (
        <div style={{
          background: "#fffbeb",
          border: "1px solid #f59e0b",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "24px" }}>⚠️</div>
            <div>
              <h3 style={{ margin: 0, color: "#92400e", fontSize: "16px" }}>CV'nizi optimize etmek için iş ilanı analiz edin</h3>
              <p style={{ margin: "5px 0 0 0", color: "#b45309", fontSize: "14px" }}>
                AI ile CV'nizi optimize etmek için önce bir iş ilanı linki analiz etmelisiniz.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/job-analysis")}
            style={{
              padding: "10px 20px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Hemen Analiz Et
          </button>
        </div>
      )}

      {/* --- CV ÖNİZLEME ALANI --- */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <div style={{ width: "850px", background: "white", borderRadius: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
          {isTranslating ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#666" }}>
              <h3>CV İngilizceye Çevriliyor...</h3>
              <p>Lütfen bekleyin, yapay zeka verilerinizi işliyor...</p>
            </div>
          ) : (
            <CVPreview
              user={activeUser}
              aiData={language === "en" ? null : aiData}
              language={language}
            />
          )}
        </div>
      </div>

      {/* --- ALT BİLGİ: KULLANILAN İLAN --- */}
      {aiData?.jobUsed && (
        <div style={{ marginTop: "20px", padding: "15px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ background: "#0ea5e9", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
              ℹ️
            </span>
            <div>
              <div style={{ fontWeight: "600", color: "#0369a1" }}>
                Bu CV şu iş ilanına göre optimize edildi:
              </div>
              <div style={{ color: "#0c4a6e", marginTop: "4px" }}>
                <strong>{aiData.jobUsed.position}</strong>
                {aiData.jobUsed.company && ` • ${aiData.jobUsed.company}`}
                {aiData.jobUsed.requiredSkills && (
                  <span style={{ marginLeft: "10px", fontSize: "14px" }}>
                    📌 Gereken Yetenekler: {aiData.jobUsed.requiredSkills}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CVBuilder;