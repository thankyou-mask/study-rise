import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import AvatarPage from './pages/AvatarPage'
import RecordsPage from './pages/RecordsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('home')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#FF6B35] text-4xl font-black animate-pulse">SR</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div className="relative">
      {tab === 'home'     && <HomePage />}
      {tab === 'avatar'   && <AvatarPage onExit={() => setTab('home')} />}
      {tab === 'records'  && <RecordsPage />}
      {tab === 'settings' && <SettingsPage />}

      {/* avatarタブのときはナビを非表示 */}
      {tab !== 'avatar' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E18] border-t border-[#2A2A35] flex h-16 z-50">
          {[
            { id: 'home',     icon: '🏠', label: 'ホーム' },
            { id: 'avatar',   icon: '👤', label: '一緒に勉強' },
            { id: 'records',  icon: '📊', label: '記録' },
            { id: 'settings', icon: '⚙️', label: '設定' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors"
              style={{ color: tab === t.id ? '#FF6B35' : '#555' }}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default App