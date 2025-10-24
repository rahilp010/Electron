import { Settings, BadgeIndianRupeeIcon, LayoutDashboard } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = [
    { name: 'Dashboard', active: true, path: '/' },
    { name: 'Reports', active: false, path: '/reports' },
    { name: 'Ledger', active: false, path: '/ledger' },
    { name: 'Analytics', active: false, path: '/analytics' }
  ]

  return (
    <nav className="w-full bg-gray-50 px-6 py-3">
      <div className="flex items-center justify-between mx-auto">
        {/* Logo */}
        <div>
          <div className="flex items-center" onClick={() => navigate('/auth')}>
            <div className="bg-white rounded-full px-6 py-2 border border-gray-400">
              <span className="text-lg font-medium text-gray-900">Electron</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Items */}
          {location.pathname === '/' ? (
            <div className="flex items-center space-x-1 border border-gray-300 rounded-4xl p-0.5 tracking-wide cursor-pointer">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  style={{ textDecoration: 'none' }}
                  className={`px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 ${
                    item.active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-black/10'
                  } `}
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          ) : null}

          {/* Right Side Icons */}
          <div className="flex items-center space-x-1 cursor-pointer">
            {location.pathname === '/' ? null : (
              <div
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-all duration-200 border"
                onClick={() => navigate('/')}
              >
                <div className="flex items-center gap-1">
                  <LayoutDashboard size={20} />
                </div>
              </div>
            )}
            <div
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-all duration-200 border"
              onClick={() => navigate('/currencyConverter')}
            >
              <div className="flex items-center gap-1">
                <BadgeIndianRupeeIcon size={20} />
              </div>
            </div>
            <div
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-all duration-200 border"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-1">
                <Settings size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p
        className={`text-3xl font-light mt-8 mx-3 ${
          location.pathname === '/' ? 'block' : 'hidden'
        }`}
      >
        Welcome in, Nixtio
      </p>
    </nav>
  )
}

export default Navbar
