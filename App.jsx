import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import CVBuilder from './pages/CVBuilder'
import JobAnalysis from './pages/JobAnalysis'  

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cv-builder" element={<CVBuilder />} />
        <Route path="/job-analysis" element={<JobAnalysis />} />  
      </Routes>
    </div>
  )
}

export default App