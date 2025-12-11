import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerPage from './pages/CustomerPage'
import AgentLoginPage from './pages/AgentLoginPage'
import AgentDashboard from './pages/AgentDashboard'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* 고객 페이지 */}
      <Route path="/" element={<CustomerPage />} />
      <Route path="/customer" element={<CustomerPage />} />

      {/* 상담원 페이지 */}
      <Route path="/agent/login" element={<AgentLoginPage />} />
      <Route
        path="/agent/dashboard"
        element={
          <ProtectedRoute>
            <AgentDashboard />
          </ProtectedRoute>
        }
      />

      {/* 기본 리다이렉트 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
