// src/pages/CVBuilder.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CVPreview from "../components/cv/CVPreview";
import PDFService from "../services/pdfService";
import { profileAPI } from "../services/api"; // 🔥 PROFIL API

const CVBuilder = () => {
  const [user, setUser] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const navigate = useNavigate();

  // 🔥 Auth user + UserProfile birlikte yüklensin
  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        navigate("/");
        return;
      }

      const authUser = JSON.parse(userData); // { id, fullName, email, token ... }

      try {
        // UserProfile'ı backend'den çek
        const res = await profileAPI.getMe();
        const profile = res.data || {};

        // Hem authUser hem profile tek obje içinde
        setUser({
          ...authUser,   // id, fullName, email, token...
          profile,       // user.profile.linkedinUrl vs
          ...profile     // user.linkedinUrl, user.githubUrl, educationSchool...
        });
      } catch (err) {
        console.error("Profil yüklenemedi, sadece auth user kullanılacak:", err);
        setUser(authUser);
      }
    };

    init();
  }, [navigate]);

  // 🔥 AI ENTEGRASYONU
  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const authUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = authUser?.id;

      if (!userId) {
        alert("Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.");
        navigate("/login");
        return;
      }

      const jobId = 1;

      const response = await axios.post(
        `http://localhost:8080/api/cv-generator/create?userId=${userId}&jobId=${jobId}`
      );

      if (response.data) {
        console.log("AI Response:", response.data);
        const responseData = response.data.data || response.data;

        setAiData({
          summary: responseData.tailoredSummary,
          skills: responseData.prioritizedSkills,
          optimizedExperiences: responseData.optimizedExperiences || [],
          optimizedProjects: responseData.optimizedProjects || [],
          optimizedUserProjects: responseData.optimizedUserProjects || [],
          languages: responseData.optimizedLanguages || [],
          certificates: responseData.optimizedCertificates || [],
          optimizedEducation: responseData.optimizedEducation || [],
        });
        alert("CV başarıyla optimize edildi! ✨");
      }
    } catch (error) {
      console.error("AI Hatası:", error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Yapay zeka servisine ulaşılamadı: ${errorMsg}`);
    } finally {
      setAiLoading(false);
    }
  };

  // PDF işlemleri
  // src/pages/CVBuilder.jsx ...

const handleExportPDF = async () => {
  if (!user) return;
  setPdfLoading(true);
  try {
    const base = aiData
      ? {
          ...user,
          summary: aiData.summary,
          skills: aiData.skills,
          experiences: aiData.optimizedExperiences || user.experiences,
          projects: aiData.optimizedUserProjects || user.projects,
          languages: aiData.languages || user.languages,
          certificates: aiData.certificates || user.certificates,
        }
      : user;

    // 🔥 Sosyal linkleri profile'dan da al
    const dataToPrint = {
      ...base,
      linkedinUrl:
        base.linkedinUrl || base.profile?.linkedinUrl || base.linkedin || '',
      githubUrl:
        base.githubUrl || base.profile?.githubUrl || base.github || '',
      websiteUrl:
        base.websiteUrl || base.profile?.websiteUrl || base.website || '',
    };

    await PDFService.generateCVPDF(dataToPrint);
  } catch (error) {
    console.error('PDF Hatası:', error);
  } finally {
    setPdfLoading(false);
  }
};


  const handleEditProfile = () => {
    navigate("/profile");
  };

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: '"Segoe UI", sans-serif',
      }}
    >
      {/* ÜST PANEL */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <div>
          <h1 style={{ fontSize: "30px", marginBottom: "4px" }}>📄 CV Oluşturucu</h1>
          <p style={{ color: "#666", margin: 0 }}>Profesyonel ve AI Destekli CV</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* 🔥 AI BUTONU */}
          <button
            onClick={handleAiGenerate}
            disabled={aiLoading}
            style={{
              padding: "10px 16px",
              background: aiLoading ? "#6c757d" : "#6f42c1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: aiLoading ? "wait" : "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {aiLoading ? "Analiz Ediliyor..." : "✨ AI İle Optimize Et"}
          </button>

          <button
            onClick={handleEditProfile}
            style={{
              padding: "10px 16px",
              background: "#495057",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ✏️ Düzenle
          </button>

          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            style={{
              padding: "10px 16px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: pdfLoading ? "not-allowed" : "pointer",
            }}
          >
            {pdfLoading ? "⏳ Hazırlanıyor..." : "🖼 PDF İndir"}
          </button>
        </div>
      </div>

      {/* CV ÖNİZLEME ALANI */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <div
          style={{
            width: "850px",
            background: "white",
            borderRadius: "10px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          }}
        >
          <CVPreview user={user} aiData={aiData} />
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
