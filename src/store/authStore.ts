import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent } from '../types'

// 하드코딩된 상담원 계정
const HARDCODED_AGENTS = [
  { id: 'agent1', employeeId: 'EMP001', password: 'admin123', name: '김상담' },
  { id: 'agent2', employeeId: 'EMP002', password: 'admin123', name: '이상담' },
  { id: 'agent3', employeeId: 'EMP003', password: 'admin123', name: '박상담' },
]

interface AuthState {
  isAuthenticated: boolean
  agent: Agent | null
  login: (employeeId: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      agent: null,

      login: (employeeId: string, password: string) => {
        const foundAgent = HARDCODED_AGENTS.find(
          (a) => a.employeeId === employeeId && a.password === password
        )

        if (foundAgent) {
          set({
            isAuthenticated: true,
            agent: {
              id: foundAgent.id,
              name: foundAgent.name,
              employeeId: foundAgent.employeeId,
            },
          })
          return true
        }
        return false
      },

      logout: () => {
        set({
          isAuthenticated: false,
          agent: null,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
