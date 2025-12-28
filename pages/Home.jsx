import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Login from '../components/auth/Login'
import Register from '../components/auth/Register'  // 👈 BU SATIRI EKLE
import TestAPI from '../components/common/TestAPI'

const Home = () => {
  const [currentView, setCurrentView] = useState('home')
  const [count, setCount] = useState(0)
  const navigate = useNavigate()

  return (
    <div className="App">
      <h1>🎯 CV Builder Pro</h1>
      <p>Akıllı CV Oluşturucuya Hoş Geldiniz!</p>
      
      {/* Navigasyon */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setCurrentView('home')}>🏠 Ana Sayfa</button>
        <button onClick={() => setCurrentView('test')}>🔧 API Test</button>
        <button onClick={() => setCurrentView('login')}>🔐 Giriş Yap</button>
        <button onClick={() => setCurrentView('register')}>📝 Kayıt Ol</button>
        
      </div>

      {/* İçerik */}
      {currentView === 'home' && (
        <>
          <div className="card">
            <button onClick={() => setCount(count + 1)}>
              Test Butonu - Tıklandı: {count}
            </button>
            <p>Proje başarıyla kuruldu! 🚀</p>
          </div>
          
          <div style={{marginTop: '20px'}}>
            <h3>🎯 Yapılacaklar:</h3>
            <ul>
              <li>✅ Frontend kuruldu</li>
              <li>✅ Backend çalışıyor</li>
              <li>✅ Kullanıcı girişi çalışıyor</li>
              <li>⬜ Kullanıcı kaydı</li>
              <li>⬜ Dashboard sayfası</li>
              <li>⬜ CV generator</li>
            </ul>
          </div>
        </>
      )}
      
      {currentView === 'test' && <TestAPI />}
      {currentView === 'login' && <Login onSwitchToRegister={() => setCurrentView('register')} />}
      {currentView === 'register' && <Register onSwitchToLogin={() => setCurrentView('login')} />}
    </div>
  )
}

export default Home