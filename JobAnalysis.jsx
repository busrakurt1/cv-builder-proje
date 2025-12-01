import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisAPI } from '../services/api';
import PDFService from '../services/pdfService';
import OptimizedCVPreview from '../components/cv/OptimizedCVPreview';

const JobAnalysis = () => {
    const [user, setUser] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [optimizedCV, setOptimizedCV] = useState(null);
    const [loading, setLoading] = useState(false);
    const [optimizationLoading, setOptimizationLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('🔍 JobAnalysis useEffect çalışıyor...');
        try {
            const userProfile = localStorage.getItem('user');
            if (userProfile) {
                const userObj = JSON.parse(userProfile);
                console.log('✅ User objesi parse edildi:', userObj);
                setUser(userObj);
            } else {
                console.log('❌ User bulunamadı, yönlendiriliyor...');
                navigate('/login');
            }
        } catch (err) {
            console.error('❌ User yükleme hatası:', err);
            setError('Kullanıcı bilgileri yüklenirken hata oluştu');
        }
    }, [navigate]);

    const handleAnalyze = async () => {
        console.log('🎯 handleAnalyze çağrıldı');
        
        if (!jobDescription.trim()) {
            setMessage('❌ Lütfen iş ilanı metnini yapıştırın!');
            return;
        }

        if (!user?.id) {
            setMessage('❌ Kullanıcı bilgisi bulunamadı!');
            return;
        }

        setLoading(true);
        setMessage('');
        setAnalysis(null);
        setOptimizedCV(null);
        setError(null);

        try {
            console.log('🔍 Analiz başlatılıyor...', { 
                userId: user.id, 
                jobDescLength: jobDescription.length 
            });
            
            const response = await analysisAPI.analyzeJobMatch({ 
                userId: user.id, 
                jobDescription: jobDescription 
            });
            
            console.log('📊 Analiz response alındı:', response);

            // ✅ BASİTLEŞTİRİLMİŞ RESPONSE KONTROLÜ
            let analysisResult;
            
            if (response?.data?.success === true && response.data.data) {
                // { success: true, data: { ... } } formatı
                analysisResult = response.data.data;
            } else if (response?.data) {
                // Direkt data formatı
                analysisResult = response.data;
                console.log('⚠️ Backend direkt data döndü:', analysisResult);
            } else {
                throw new Error('Geçersiz sunucu yanıtı');
            }

            console.log('✅ Analiz başarılı:', analysisResult);
            setAnalysis(analysisResult);
            setMessage('✅ Analiz tamamlandı! CV\'nizi optimize edebilirsiniz.');

        } catch (err) {
            console.error('🔴 Analiz hatası:', err);
            
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.error || 
                               err.message || 
                               'Analiz sırasında beklenmedik bir hata oluştu';
            
            setError(`Analiz hatası: ${errorMessage}`);
            setMessage(`❌ ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimizeCV = async () => {
        console.log('🎯 handleOptimizeCV çağrıldı');
        
        if (!jobDescription.trim() || !analysis) {
            setMessage('❌ Önce iş ilanını analiz ettirin!');
            return;
        }

        if (!user?.id) {
            setMessage('❌ Kullanıcı bilgisi bulunamadı!');
            return;
        }

        setOptimizationLoading(true);
        setMessage('');
        setError(null);

        try {
            console.log('🎯 CV optimizasyonu başlatılıyor...');
            const response = await analysisAPI.optimizeCVForJob({ 
                userId: user.id, 
                jobDescription: jobDescription 
            });
            
            console.log('📥 Optimize response:', response);
            
            // ✅ BASİTLEŞTİRİLMİŞ RESPONSE KONTROLÜ
            let optimizedData;
            
            if (response?.data?.success === true && response.data.data) {
                optimizedData = response.data.data;
            } else if (response?.data) {
                optimizedData = response.data;
                console.log('⚠️ Backend direkt data döndü:', optimizedData);
            } else {
                throw new Error('Geçersiz optimizasyon yanıtı');
            }

            console.log('✅ Optimizasyon başarılı:', optimizedData);
            setOptimizedCV(optimizedData);
            setMessage('🎯 CV başarıyla optimize edildi! PDF olarak indirebilirsiniz.');

        } catch (error) {
            console.error('🔴 Optimizasyon hatası:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'CV optimizasyonu sırasında hata oluştu';
            
            setError(`Optimizasyon hatası: ${errorMessage}`);
            setMessage(`❌ ${errorMessage}`);
        } finally {
            setOptimizationLoading(false);
        }
    };

    const handleExportOptimizedPDF = async () => {
        if (!optimizedCV) {
            alert('Optimize edilmiş CV bulunamadı!');
            return;
        }
        
        try {
            console.log('📄 PDF oluşturuluyor...');
            const optimizedUser = optimizedCV.optimizedUser || optimizedCV;
            await PDFService.generateCVPDF(optimizedUser, 'optimized-cv-preview');
        } catch (error) {
            console.error('❌ PDF hatası:', error);
            alert('PDF oluşturulurken hata oluştu: ' + error.message);
        }
    };

    // Yardımcı fonksiyonlar
    const getScoreColor = (score) => {
        if (score == null) return '#6c757d';
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        if (score >= 40) return '#fd7e14';
        return '#dc3545';
    };

    const getScoreEmoji = (score) => {
        if (score == null) return '❓';
        if (score >= 80) return '🎯';
        if (score >= 60) return '👍';
        if (score >= 40) return '🤔';
        return '📉';
    };

    // Güvenli render fonksiyonları
    const renderSkills = (skills, emptyMessage = "Beceri bulunamadı") => {
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return <p style={{ color: '#6c757d', fontSize: '14px' }}>{emptyMessage}</p>;
        }
        
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {skills.map((skill, index) => (
                    <span 
                        key={index} 
                        style={{
                            background: '#e9ecef',
                            color: '#495057',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: '1px solid #dee2e6'
                        }}
                    >
                        {skill}
                    </span>
                ))}
            </div>
        );
    };

    const renderCategoryScores = (scores) => {
        if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) {
            return <p style={{ color: '#6c757d' }}>Kategori skorları bulunamadı</p>;
        }

        return Object.entries(scores).map(([category, score]) => (
            <div key={category} style={{ marginBottom: '12px' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '14px'
                }}>
                    <span style={{ fontWeight: '500' }}>{category}</span>
                    <span style={{ fontWeight: 'bold', color: getScoreColor(score) }}>
                        %{Math.round(score || 0)}
                    </span>
                </div>
                <div style={{ 
                    height: '6px', 
                    background: '#e9ecef', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        width: `${score || 0}%`, 
                        height: '100%', 
                        background: getScoreColor(score), 
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>
        ));
    };

    const renderRecommendations = (recommendations) => {
        if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
            return <p style={{ color: '#6c757d' }}>Öneri bulunamadı</p>;
        }

        return (
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {recommendations.map((rec, index) => (
                    <li key={index} style={{ margin: '6px 0', fontSize: '14px', lineHeight: '1.4' }}>
                        {rec}
                    </li>
                ))}
            </ul>
        );
    };

    // Ana render
    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>Hata Oluştu</h2>
                <p style={{ marginBottom: '20px', color: '#6c757d' }}>{error}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Sayfayı Yenile
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '10px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Dashboard'a Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3>Kullanıcı bilgileri yükleniyor...</h3>
                <p style={{ color: '#6c757d' }}>Lütfen bekleyin</p>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh'
        }}>
            {/* HEADER */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '2px solid #e9ecef'
            }}>
                <div>
                    <h1 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#343a40',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        🔍 İş İlanı Analizi
                    </h1>
                    <p style={{ 
                        margin: 0, 
                        color: '#6c757d',
                        fontSize: '16px'
                    }}>
                        CV'niz ile iş ilanını karşılaştırın, uyumunuzu ölçün ve CV'nizi optimize edin
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')}
                    style={{
                        padding: '8px 16px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    ← Dashboard'a Dön
                </button>
            </div>

            {/* MESAJ GÖSTERİMİ */}
            {message && (
                <div style={{
                    padding: '12px 16px',
                    margin: '0 0 20px 0',
                    background: message.includes('❌') ? '#f8d7da' : '#d1ecf1',
                    border: `1px solid ${message.includes('❌') ? '#f5c6cb' : '#bee5eb'}`,
                    borderRadius: '6px',
                    color: message.includes('❌') ? '#721c24' : '#0c5460',
                    fontSize: '14px'
                }}>
                    {message}
                </div>
            )}

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '30px',
                alignItems: 'flex-start'
            }}>
                {/* SOL SUTUN - GİRİŞ FORMU */}
                <div>
                    <div style={{ 
                        background: 'white', 
                        padding: '25px', 
                        borderRadius: '10px', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 16px 0',
                            color: '#495057',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            📝 İş İlanını Yapıştırın
                        </h3>
                        
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="İş ilanının tam metnini buraya yapıştırın...
Örnek:
• 3+ yıl Java deneyimi
• Spring Boot tecrübesi
• Docker ve Kubernetes
• AWS cloud servisleri"
                            rows={12}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                minHeight: '200px'
                            }}
                        />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                            <button 
                                onClick={handleAnalyze}
                                disabled={loading}
                                style={{
                                    padding: '12px 20px',
                                    background: loading ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {loading ? '⏳ Analiz Ediliyor...' : '🔍 İlanı Analiz Et'}
                            </button>

                            <button 
                                onClick={handleOptimizeCV}
                                disabled={optimizationLoading || !analysis}
                                style={{
                                    padding: '12px 20px',
                                    background: (optimizationLoading || !analysis) ? '#adb5bd' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: (optimizationLoading || !analysis) ? 'not-allowed' : 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {optimizationLoading ? '⚙️ Optimize Ediliyor...' : '🎯 CV\'yi Optimize Et'}
                            </button>

                            {optimizedCV && (
                                <button
                                    onClick={handleExportOptimizedPDF}
                                    style={{
                                        padding: '12px 20px',
                                        background: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    📄 Optimize CV'yi PDF Olarak İndir
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* SAĞ SUTUN - ANALİZ SONUÇLARI */}
                <div>
                    {analysis ? (
                        <div style={{ 
                            background: 'white', 
                            padding: '25px', 
                            borderRadius: '10px', 
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            border: '1px solid #e9ecef'
                        }}>
                            <h2 style={{ 
                                margin: '0 0 20px 0',
                                color: '#343a40',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                📊 Analiz Sonuçları
                            </h2>
                            
                            {/* SKOR GÖSTERİMİ */}
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '25px', 
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                borderRadius: '10px', 
                                marginBottom: '25px',
                                border: '1px solid #dee2e6'
                            }}>
                                <div style={{ 
                                    fontSize: '48px', 
                                    fontWeight: 'bold', 
                                    color: getScoreColor(analysis.matchScore),
                                    marginBottom: '8px'
                                }}>
                                    {getScoreEmoji(analysis.matchScore)} {analysis.matchScore || 0}%
                                </div>
                                <div style={{ 
                                    color: getScoreColor(analysis.matchScore), 
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    marginBottom: '8px'
                                }}>
                                    {analysis.matchLevel || 'BELİRSİZ'} UYUM
                                </div>
                                {analysis.analysisSummary && (
                                    <p style={{ 
                                        color: '#6c757d',
                                        fontSize: '14px',
                                        margin: 0,
                                        lineHeight: '1.4'
                                    }}>
                                        {analysis.analysisSummary}
                                    </p>
                                )}
                            </div>

                            {/* KATEGORİ SKORLARI */}
                            <div style={{ marginBottom: '25px' }}>
                                <h4 style={{ 
                                    margin: '0 0 16px 0',
                                    color: '#495057',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    📈 Detaylı Puanlama
                                </h4>
                                {renderCategoryScores(analysis.categoryScores)}
                            </div>

                            {/* BECERİ ANALİZİ */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '20px', 
                                marginBottom: '25px' 
                            }}>
                                <div>
                                    <h4 style={{ 
                                        color: '#28a745',
                                        margin: '0 0 12px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        ✅ Eşleşen Beceriler
                                    </h4>
                                    {renderSkills(analysis.matchingSkills, "Eşleşen beceri bulunamadı")}
                                </div>

                                <div>
                                    <h4 style={{ 
                                        color: '#dc3545',
                                        margin: '0 0 12px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        ❌ Eksik Beceriler
                                    </h4>
                                    {renderSkills(analysis.missingSkills, "Eksik beceri bulunamadı")}
                                </div>
                            </div>

                            {/* ÖNERİLER */}
                            <div>
                                <h4 style={{ 
                                    margin: '0 0 12px 0',
                                    color: '#495057',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    💡 Öneriler ve Gelişim Alanları
                                </h4>
                                <div style={{ 
                                    background: '#fff3cd', 
                                    padding: '16px', 
                                    borderRadius: '6px',
                                    border: '1px solid #ffeaa7'
                                }}>
                                    {renderRecommendations(analysis.recommendations)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '40px', 
                            borderRadius: '10px', 
                            textAlign: 'center', 
                            color: '#6c757d',
                            border: '2px dashed #dee2e6'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <h3 style={{ margin: '0 0 12px 0' }}>Analiz Sonuçları</h3>
                            <p style={{ margin: '0 0 8px 0' }}>İş ilanını yapıştırıp analiz et butonuna tıklayın</p>
                            <p style={{ margin: 0 }}>CV'niz ile iş ilanı arasındaki uyumu görün</p>
                        </div>
                    )}
                </div>
            </div>

            {/* OPTIMIZE EDİLMİŞ CV GÖSTERİMİ */}
            {optimizedCV && (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '20px',
                        paddingBottom: '15px',
                        borderBottom: '2px solid #e9ecef'
                    }}>
                        <h2 style={{ 
                            margin: 0,
                            color: '#343a40',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            🎯 Optimize Edilmiş CV
                        </h2>
                        <button 
                            onClick={handleExportOptimizedPDF}
                            style={{
                                padding: '10px 20px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            📄 PDF Olarak İndir
                        </button>
                    </div>

                    <div style={{ 
                        background: 'white', 
                        padding: '25px', 
                        borderRadius: '10px', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef'
                    }}>
                        {optimizedCV.optimizedUser ? (
                            <OptimizedCVPreview 
                                user={optimizedCV.optimizedUser}
                                optimizationTips={optimizedCV.optimizationTips}
                                originalScore={optimizedCV.originalScore}
                                optimizedScore={optimizedCV.optimizedScore}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                                <p>Optimize edilmiş CV verisi bulunamadı</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobAnalysis;