// src/pages/CVBuilder.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CVPreview from "../components/cv/CVPreview";
import PDFService from "../services/pdfService";
import { profileAPI } from "../services/api";

const CVBuilder = () => {
  // STATE
  const [originalUser, setOriginalUser] = useState(null); // TR orijinal veri
  const [translatedUser, setTranslatedUser] = useState(null); // EN çevrilmiş veri
  const [aiData, setAiData] = useState(null); // AI tarafından üretilen/optimize edilen veri

  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [language, setLanguage] = useState("tr"); // "tr" | "en"
  const navigate = useNavigate();

  // 1) Kullanıcı verisini yükle
  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        navigate("/");
        return;
      }

      const authUser = JSON.parse(userData);

      try {
        const res = await profileAPI.getMe();
        const profile = res.data || {};
        setOriginalUser({
          ...authUser,
          profile,
          ...profile
        });
      } catch (err) {
        console.error("Profil yüklenemedi:", err);
        setOriginalUser(authUser);
      }
    };

    init();
  }, [navigate]);

  // 2) Dil değişikliği
  const handleLanguageChange = async (targetLang) => {
    if (targetLang === language) return;
    setLanguage(targetLang);

    if (targetLang === "tr") {
      // TR'ye dönerken ekstra iş yok
      return;
    }

    // EN seçildiyse ve daha önce çevrilmemişse çevir
    if (targetLang === "en" && !translatedUser) {
      await translateCVData();
    }
  };

  // 3) Çeviri fonksiyonu (orijinal + aiData ile payload oluşturup backend'e gönderir)
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
      alert("Çeviri servisine ulaşılamadı. Backend'in çalıştığından ve API anahtarlarının doğru olduğundan emin olun.");
      setLanguage("tr");
    } finally {
      setIsTranslating(false);
    }
  };

  // AI Optimize fonksiyonu
  const handleAiGenerate = async () => {
    if (!originalUser?.id) {
      alert("Kullanıcı bilgisi bulunamadı.");
      return;
    }

    setAiLoading(true);
    try {
      const userId = originalUser.id;
      const jobId = 1; // gerekirse dinamikleştir
      const response = await axios.post(
        `http://localhost:8080/api/cv-generator/create?userId=${userId}&jobId=${jobId}`
      );

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
        });

        // AI çıktı sonrasında önceki İngilizce çeviriyi kaldır (içerik değişti)
        setTranslatedUser(null);

        alert("CV başarıyla optimize edildi! ✨");
      }
    } catch (error) {
      console.error("AI Hatası:", error);
      alert("AI servisine ulaşılamadı.");
    } finally {
      setAiLoading(false);
    }
  };

  // PDF indirme
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

  // Hangi veri preview'de gösterilecek
  const activeUser = (language === "en" && translatedUser) ? translatedUser : originalUser;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: '"Segoe UI", sans-serif' }}>
      {/* ÜST PANEL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid #e0e0e0" }}>
        <div>
          <h1 style={{ fontSize: "30px", marginBottom: "4px" }}>📄 CV Oluşturucu</h1>
          <p style={{ color: "#666", margin: 0 }}>Profesyonel ve AI Destekli CV</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* DİL BUTONLARI */}
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

          <button onClick={handleAiGenerate} disabled={aiLoading} style={{ padding: "10px 16px", background: aiLoading ? "#6c757d" : "#6f42c1", color: "white", border: "none", borderRadius: "6px", cursor: aiLoading ? "wait" : "pointer" }}>
            {aiLoading ? "Analiz..." : "✨ AI Optimize"}
          </button>

          <button onClick={handleEditProfile} style={{ padding: "10px 16px", background: "#495057", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            ✏️ Düzenle
          </button>

          <button onClick={handleExportPDF} disabled={pdfLoading} style={{ padding: "10px 16px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: pdfLoading ? "not-allowed" : "pointer" }}>
            {pdfLoading ? "⏳" : "🖼 PDF İndir"}
          </button>
        </div>
      </div>

      {/* CV ÖNİZLEME */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <div style={{ width: "850px", background: "white", borderRadius: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
          {isTranslating ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#666" }}>
              <h3>CV İngilizceye Çevriliyor...</h3>
              <p>Lütfen bekleyin, yapay zeka verilerinizi işliyor...</p>
            </div>
          ) : (
            /* Eğer dil EN ise aiData null gönderiyoruz; böylece CVPreview translatedUser'ı kullanır.
               TR için ise aiData'yı gönderiyoruz ki optimize edilmiş içerik preview'de görünsün. */
            <CVPreview
              user={activeUser}
              aiData={language === "en" ? null : aiData}
              language={language}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
