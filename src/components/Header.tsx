import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Header() {
  const location = useLocation()
  const { isAuthenticated, agent, logout } = useAuthStore()
  const isAgentPage = location.pathname.startsWith('/agent')

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">HYUNDAI</span>
              <span className="ml-2 text-sm text-gray-600 border-l border-gray-300 pl-2">
                인증중고차
              </span>
            </div>
          </Link>

          {/* 네비게이션 */}
          <nav className="flex items-center space-x-6">
            {!isAgentPage ? (
              <>
                <span className="text-primary font-medium">내차팔기</span>
                <Link
                  to="/agent/login"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  상담원 로그인
                </Link>
              </>
            ) : (
              <>
                {isAuthenticated && agent && (
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600 text-sm">
                      {agent.name} ({agent.employeeId})
                    </span>
                    <button
                      onClick={logout}
                      className="text-gray-600 hover:text-accent transition-colors text-sm"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
