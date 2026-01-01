import { NavLink } from 'react-router-dom'

function Navigation({ onLogout }) {
  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="nav-brand">Amber Smart Monitor</div>
        <ul className="nav-links">
          <li>
            <NavLink to="/live" className={({ isActive }) => isActive ? 'active' : ''}>
              Live Usage
            </NavLink>
          </li>
          <li>
            <NavLink to="/daily" className={({ isActive }) => isActive ? 'active' : ''}>
              Daily Report
            </NavLink>
          </li>
        </ul>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navigation
