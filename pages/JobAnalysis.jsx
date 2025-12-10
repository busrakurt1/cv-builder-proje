import { useState } from "react";
import { jobAPI, userManager } from "../services/api";

const JobAnalysisPage = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = userManager.getUser();
  const userId = user?.id;

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMessage("❌ Önce giriş yapmalısınız.");
      return;
    }
    if (!url) {
      setMessage("❌ Lütfen ilan linkini girin.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setResult(null);

      // Backend'e istek atıyoruz
      const { data } = await jobAPI.analyzePosting(userId, url);

      setResult(data);
      setMessage("✅ İlan analizi tamamlandı.");
    } catch (err) {
      console.error("Job analyze error:", err);
      setMessage("❌ İlan analizi sırasında hata oluştu. Linkin geçerli olduğundan emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* --- BAŞLIK KISMI --- */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ color: "#2d3748", fontSize: "28px", marginBottom: "10px" }}>
          📊 Akıllı İş İlanı Analizi
        </h2>
        <p style={{ color: "#718096" }}>
          İlan linkini yapıştırın, yapay zeka destekli analiz raporunuzu oluşturun.
        </p>
      </div>

      {/* --- FORM KISMI --- */}
      <form onSubmit={handleAnalyze} style={{ marginBottom: "30px", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#4a5568" }}>
          İş İlanı Bağlantısı (URL):
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.kariyer.net/is-ilani/..."
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e2e8f0",
              outline: "none",
              fontSize: "16px",
              transition: "border-color 0.2s"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: loading ? "#cbd5e0" : "#3182ce",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "16px",
              transition: "background 0.2s"
            }}
          >
            {loading ? "⏳ Analiz Ediliyor..." : "🔍 Analiz Et"}
          </button>
        </div>
      </form>

      {/* --- DURUM MESAJI --- */}
      {message && (
        <div
          style={{
            marginBottom: "25px",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
            fontWeight: "500",
            background: message.includes("✅") ? "#f0fff4" : "#fff5f5",
            border: `1px solid ${message.includes("✅") ? "#c6f6d5" : "#fed7d7"}`,
            color: message.includes("✅") ? "#2f855a" : "#c53030",
          }}
        >
          {message}
        </div>
      )}

      {/* --- SONUÇ RAPORU (YENİ KISIM) --- */}
      {result && result.formattedAnalysis && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}
        >
          {/* Rapor Başlığı */}
          <div style={{ background: "#f7fafc", padding: "20px 30px", borderBottom: "1px solid #edf2f7" }}>
            <h3 style={{ margin: 0, color: "#2d3748", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              📋 Detaylı Analiz Raporu
            </h3>
          </div>

          {/* Rapor İçeriği */}
          <div style={{ padding: "30px" }}>
            <div 
              style={{ 
                whiteSpace: "pre-wrap", // Java'daki \n karakterlerini algılar
                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', // Rapor havası verir
                fontSize: "15px",
                lineHeight: "1.7",
                color: "#2d3748",
                backgroundColor: "#fafafa", // Hafif gri arka plan (kod bloğu gibi)
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #edf2f7"
              }}
            >
              {result.formattedAnalysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAnalysisPage;