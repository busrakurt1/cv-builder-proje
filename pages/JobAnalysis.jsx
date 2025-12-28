import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { userManager } from "../services/api"; // ✅ PATH’i projene göre düzelt
import "./JobAnalysis.css";

const JobAnalysis = () => {
  const navigate = useNavigate();

  // ✅ userId: login olmuş kullanıcıdan gelsin, yoksa 1'e düşsün
  const [userId, setUserId] = useState(() => String(userManager.getUserId() ?? 1));

  // TAB
  const [activeTab, setActiveTab] = useState("single");

  // SINGLE JOB ANALYSIS
  const [url, setUrl] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [singleMessage, setSingleMessage] = useState("");

  // MARKET ANALYSIS
  const [area, setArea] = useState("");
  const [marketResult, setMarketResult] = useState(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [marketMessage, setMarketMessage] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  // SUGGESTED AREAS
  const [suggestedAreas] = useState([
    "Yazılım Mühendisliği",
    "Bilgisayar Mühendisliği",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği",
    "Endüstri Mühendisliği",
    "İnşaat Mühendisliği",
    "Yapay Zeka",
    "Machine Learning",
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "DevOps",
    "Data Science",
    "Cybersecurity",
    "Mobile Development",
    "Cloud Computing",
    "Web Development",
    "UI/UX Design",
  ]);

  // ✅ (opsiyonel) profil bilgisini frontend'de örneklemek
  useEffect(() => {
    // Eğer profile/me endpoint’in varsa burada çekebilirsin:
    // api.get("/profile/me").then(res => setUserProfile(res.data));

    // Şimdilik demo: (istersen kaldır)
    setUserProfile({
      department: "Bilgisayar Mühendisliği",
      title: "Öğrenci / Yeni Mezun",
    });
    setArea("Bilgisayar Mühendisliği");
  }, []);

  // ---------------- HELPERS ----------------
  const safe = (v) => (v && String(v).trim() ? String(v).trim() : "Belirtilmemiş");
  const uniq = (arr) =>
    Array.from(new Set((arr || []).map((x) => String(x).trim()).filter(Boolean)));

  // ---------------- SINGLE: ANALYZE BY URL ----------------
  const handleAnalyzeSingle = async (e) => {
    e.preventDefault();

    if (!url || !url.trim()) {
      setSingleMessage("❌ Lütfen bir URL girin");
      return;
    }

    try {
      setLoadingSingle(true);
      setSingleResult(null);
      setSingleMessage("");

      // ✅ BACKEND: POST /api/job/analyze-by-url
      const response = await api.post("/job/analyze-by-url", {
        userId: parseInt(userId, 10),
        url: url.trim(),
      });

      setSingleResult(response.data);
      setSingleMessage("✅ Analiz Başarıyla Tamamlandı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sunucu hatası";
      setSingleMessage("❌ Analiz sırasında bir hata oluştu: " + msg);
      console.error("İlan analizi hatası:", err);
    } finally {
      setLoadingSingle(false);
    }
  };

  // ---------------- MARKET: AUTO ANALYZE ----------------
  const handleAutoAnalyze = async () => {
    try {
      setLoadingMarket(true);
      setMarketResult(null);
      setMarketMessage("");

      // ✅ BACKEND: POST /api/market/analyze (area boş -> otomatik)
      const response = await api.post("/market/analyze", {
        userId: parseInt(userId, 10),
        area: "",
      });

      setMarketResult(response.data);
      setMarketMessage(`✅ "${response.data.area || "Seçilen Alan"}" için otomatik pazar analizi tamamlandı`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sunucu hatası";
      setMarketMessage("❌ Analiz hatası: " + msg);
      console.error("Otomatik pazar analizi hatası:", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  // ---------------- MARKET: MANUAL ANALYZE ----------------
  const handleMarketAnalysis = async (e) => {
    e.preventDefault();

    try {
      setLoadingMarket(true);
      setMarketResult(null);
      setMarketMessage("");

      // ✅ BACKEND: POST /api/market/analyze
      const response = await api.post("/market/analyze", {
        userId: parseInt(userId, 10),
        area: (area ?? "").trim(),
      });

      setMarketResult(response.data);

      if (response.data?.isAutoAnalyzed) {
        setMarketMessage(`✅ "${response.data.area}" alanı için otomatik pazar analizi tamamlandı`);
      } else {
        setMarketMessage(`✅ "${response.data.area}" alanı için özel pazar analizi tamamlandı`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sunucu hatası";
      setMarketMessage("❌ Analiz hatası: " + msg);
      console.error("Pazar analizi hatası:", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  // ---------------- RENDER: SKILLS ----------------
  const renderSkills = (result) => {
    const matched = uniq(result?.matchedSkills || []);
    const missing = uniq(result?.missingSkills || []);

    return (
      <div className="skillsGrid">
        <div className="skillList">
          <p className="skillListTitle successTitle">✓ Eşleşen Teknik Yetenekler</p>
          {matched.length === 0 ? (
            <div className="emptyBox">Eşleşen yetenek bulunamadı.</div>
          ) : (
            matched.map((s, i) => (
              <div key={i} className="skillCard success">
                ✓ {s}
              </div>
            ))
          )}
        </div>

        <div className="skillList">
          <p className="skillListTitle dangerTitle">! Eksik Yetenekler</p>
          {missing.length === 0 ? (
            <div className="emptyBox">Kritik bir eksiklik tespit edilmedi.</div>
          ) : (
            missing.map((s, i) => (
              <div key={i} className="skillCard danger">
                ! {s}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ---------------- RENDER: SINGLE RESULT ----------------
  const renderResult = () => {
    if (!singleResult) return null;

    const {
      position,
      company,
      location,
      workType,
      educationLevel,
      experienceLevel,
      responsibilities,
      matchScore,
      matchedSkills,
      missingSkills,
      formattedAnalysis, // ✅ AI raporu
    } = singleResult;

    const matchedCount = Array.isArray(matchedSkills) ? matchedSkills.length : 0;
    const missingCount = Array.isArray(missingSkills) ? missingSkills.length : 0;

    return (
      <div className="analysisDashboard">
        <div className="jobHeaderCard">
          <div className="badgeIcon">💼</div>
          <h2 className="jobPositionTitle">{safe(position)}</h2>
          <p className="jobCompanyName">{safe(company)}</p>

          <div className="metaRow">
            <div className="metaItem">
              <span className="metaLabel">📍 Konum</span>
              <span className="metaValue">{safe(location)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">💼 Çalışma</span>
              <span className="metaValue">{safe(workType)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">⏳ Deneyim</span>
              <span className="metaValue">{safe(experienceLevel)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">🎓 Eğitim</span>
              <span className="metaValue">{safe(educationLevel)}</span>
            </div>
          </div>

          <div className="statsBar">
            <div className="statBox">
              <span className="statNumber">%{matchScore || 0}</span>
              <span className="statLabel">Uyum</span>
            </div>
            <div className="statBox">
              <span className="statNumber">{matchedCount}</span>
              <span className="statLabel">Eşleşen</span>
            </div>
            <div className="statBox">
              <span className="statNumber">{missingCount}</span>
              <span className="statLabel">Eksik</span>
            </div>
          </div>
        </div>

        <div className="skillsSection">
          <div className="cardHeader">🛠️ YETENEK ANALİZİ</div>
          {renderSkills(singleResult)}
        </div>

        {Array.isArray(responsibilities) && responsibilities.length > 0 && (
          <div className="responsibilitiesCard">
            <div className="cardHeader">📋 SORUMLULUKLAR</div>
            <ul className="responsibilityList">
              {responsibilities.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ✅ AI raporu mutlaka göster
        {formattedAnalysis && String(formattedAnalysis).trim().length > 0 && (
          <div className="aiAnalysisCard singleAiCard">
            <div className="cardHeader">🤖 DETAYLI AI ANALİZİ</div>
            <pre className="singleAiText">{formattedAnalysis}</pre>
          </div>
        )} */}

        <div className="actionArea">
          <button onClick={() => navigate("/cv-builder")} className="ctaButton">
            Profilimi Optimize Et →
          </button>
        </div>
      </div>
    );
  };

  // ---------------- RENDER: MARKET RESULT ----------------
  const renderMarketResult = () => {
    if (!marketResult) return null;

    const { area, userTitle, topSkillsInMarket, userMissingSkills, aiRecommendation, isAutoAnalyzed } = marketResult;

    return (
      <div className="analysisDashboard">
        <div className="marketHeaderCard">
          <div className="badgeIcon">{isAutoAnalyzed ? "🤖" : "📊"}</div>
          <h2 className="marketTitle">
            {isAutoAnalyzed ? `${area} Mezunları İçin Pazar Analizi` : `${area} Alanı Pazar Analizi`}
          </h2>
          <div className={`analysisTypeBadge ${isAutoAnalyzed ? "auto" : "manual"}`}>
            {isAutoAnalyzed ? "Otomatik Analiz" : "Özel Analiz"}
          </div>
          {userTitle && (
            <p className="marketSubtitle">
              Mevcut Unvanınız: <strong>{userTitle}</strong>
            </p>
          )}
        </div>

        <div className="aiAnalysisCard" style={{ borderLeft: "6px solid #4f46e5", background: "#f5f3ff" }}>
          <div className="cardHeader" style={{ color: "#4338ca" }}>
            🤖 Kariyer Danışmanı Önerisi
          </div>
          <div className="aiAnalysisContent" style={{ fontSize: "1.1rem", fontWeight: "500", color: "#1e1b4b" }}>
            <p>"{aiRecommendation}"</p>
          </div>
        </div>

        <div className="marketDataGrid">
          <div className="skillsSection">
            <div className="cardHeader">🔥 Sektörde En Çok Arananlar</div>
            <div className="marketStatsList">
              {topSkillsInMarket &&
                Object.entries(topSkillsInMarket)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([skill, count], index) => (
                    <div key={index} className="marketStatItem">
                      <span className="skillName">{skill}</span>
                      <span className="skillDemand">{count} ilanda geçiyor</span>
                    </div>
                  ))}
            </div>
          </div>

          <div className="skillsSection">
            <div className="cardHeader">⚠️ Sizin İçin Kritik Eksikler</div>
            <div className="missingSkillsList">
              {userMissingSkills && userMissingSkills.length > 0 ? (
                userMissingSkills.map((skill, index) => (
                  <div key={index} className="skillCard danger">
                    ! {skill} <span className="skillHint">(Pazarda Çok Popüler)</span>
                  </div>
                ))
              ) : (
                <div className="emptyBox successBox">✓ Pazarın istediği tüm ana yeteneklere sahipsiniz!</div>
              )}
            </div>
          </div>
        </div>

        <div className="actionArea">
          <div className="actionContent">
            <h3>Eksikleri Tamamla</h3>
            <p>AI'nın önerdiği bu yetenekleri CV'ne eklemek için hemen düzenle.</p>
          </div>
          <button onClick={() => navigate("/cv-builder")} className="ctaButton">
            CV'mi Güncelle →
          </button>
        </div>
      </div>
    );
  };

  // ---------------- RENDER: MARKET TAB ----------------
  const renderMarketTab = () => (
    <>
      {/* <div className="marketIntro">
        <h2>Sektörel Trend Analizi</h2>
        <p>
          {userProfile?.department ? (
            <>
              <strong>{userProfile.department}</strong> bölümü öğrencisi/mezunusunuz. Otomatik analiz ile sektör trendlerini
              görün veya farklı bir alan seçin.
            </>
          ) : (
            "Lütfen bir alan seçin veya otomatik analiz için profil bilgilerinizi güncelleyin."
          )}
        </p>
      </div> */}

      <div className="autoAnalysisSection">
        {userProfile?.department && (
          <>
            <button className="autoAnalyzeButton" onClick={handleAutoAnalyze} disabled={loadingMarket}>
              {loadingMarket ? (
                <>
                  <span className="spinner"></span> Analiz Ediliyor...
                </>
              ) : (
                `🚀 ${userProfile.department} İçin Otomatik Analiz Yap`
              )}
            </button>

            <div className="orDivider">
              <span>veya</span>
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleMarketAnalysis} className="marketForm">
        <div className="formGroup">
          <label htmlFor="area">{userProfile?.department ? "Farklı Bir Alan Analiz Et" : "Analiz Edilecek Alan *"}</label>
          <input
            id="area"
            className="areaInput"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Örn: Yazılım Mühendisliği, Backend Development, Yapay Zeka..."
            list="suggestedAreas"
          />
          <datalist id="suggestedAreas">
            {suggestedAreas.map((areaOption, index) => (
              <option key={index} value={areaOption} />
            ))}
          </datalist>
          <small className="formHint">
            {userProfile?.department
              ? "Mezun olduğunuz bölüm dışında bir alanı analiz etmek isterseniz buraya yazın"
              : "Hangi alanda kariyer yapmak istiyorsanız o alanı yazın"}
          </small>
        </div>

        <button className="marketButton" type="submit" disabled={loadingMarket}>
          {loadingMarket ? (
            <>
              <span className="spinner"></span> Analiz Ediliyor...
            </>
          ) : (
            "📊 Özel Alan Analizi Yap"
          )}
        </button>
      </form>

      {marketMessage && (
        <div className={`messageLine ${marketMessage.includes("✅") ? "success" : "error"}`}>
          {marketMessage}
        </div>
      )}

      {marketResult && renderMarketResult()}
    </>
  );

  // ---------------- MAIN RENDER ----------------
  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <h1>Kariyer Analiz Merkezi</h1>
        <p>İş ilanlarını ve pazar trendlerini yapay zeka ile analiz edin.</p>
      </div>

      {/* (İstersen kullanıcı id gösterme/kontrol alanı ekleyebilirsin) */}
      {/* <div style={{marginBottom: 10}}>UserId: {userId}</div> */}

      <div className="navTabs">
        <button className={`navTab ${activeTab === "single" ? "active" : ""}`} onClick={() => setActiveTab("single")}>
          İlan Analizi
        </button>
        <button className={`navTab ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}>
          Sektörel Trend Analizi
        </button>
      </div>

      {activeTab === "single" ? (
        <>
          <form onSubmit={handleAnalyzeSingle} className="urlForm">
            <input
              className="urlInput"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="İlan linkini yapıştırın (LinkedIn, Kariyer.net, vb.)..."
              required
              disabled={loadingSingle}
            />
            <button className="urlButton" type="submit" disabled={loadingSingle || !url.trim()}>
              {loadingSingle ? "Analiz Ediliyor..." : "Analiz Et"}
            </button>
          </form>

          {singleMessage && (
            <div className={`messageLine ${singleMessage.includes("✅") ? "success" : "error"}`}>{singleMessage}</div>
          )}

          {singleResult && renderResult()}
        </>
      ) : (
        renderMarketTab()
      )}
    </div>
  );
};

export default JobAnalysis;
