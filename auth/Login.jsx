// src/components/auth/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userManager } from "../../services/api"; // ✅ 2 seviye yukarı

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.login(email, password);
      
      // ✅ Kullanıcı bilgilerini localStorage'a kaydet
      const userData = response.data.data;
      userManager.setUser(userData);
      
      setMessage('✅ Giriş başarılı!');
      
      // Dashboard'a yönlendir
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Giriş başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '100px auto', 
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Giriş Yap</h2>
      
      {message && (
        <div style={{
          padding: '10px',
          margin: '10px 0',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: message.includes('✅') ? '#155724' : '#721c24',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="ornek@email.com"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            Şifre:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Şifrenizi girin"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#0056b3')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#007bff')}
        >
          {loading ? '⏳ Giriş Yapılıyor...' : '🔑 Giriş Yap'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: 0, color: '#666' }}>
          Hesabınız yok mu?{' '}
          <a 
            href="/register" 
            style={{ 
              color: '#007bff', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Kayıt Olun
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;