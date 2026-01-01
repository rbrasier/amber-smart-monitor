import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Login from './pages/Login'
import LiveUsage from './pages/LiveUsage'
import DailyReport from './pages/DailyReport'
import { isAuthenticated, logout } from './services/auth'
import './App.css'

function App() {
  const [isAuth, setIsAuth] = useState(isAuthenticated())

  const handleLogout = () => {
    logout()
    setIsAuth(false)
  }

  const handleLogin = () => {
    setIsAuth(true)
  }

  return (
    <Router>
      <div className="app">
        {isAuth && <Navigation onLogout={handleLogout} />}
        <div className="main-content">
          <Routes>
            <Route
              path="/login"
              element={!isAuth ? <Login onLogin={handleLogin} /> : <Navigate to="/live" />}
            />
            <Route
              path="/live"
              element={isAuth ? <LiveUsage /> : <Navigate to="/login" />}
            />
            <Route
              path="/daily"
              element={isAuth ? <DailyReport /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={isAuth ? "/live" : "/login"} />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
