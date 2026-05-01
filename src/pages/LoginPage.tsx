import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth()
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password)
      } else {
        await registerWithEmail(email, password)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* ロゴ */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[4px] text-gray-500 uppercase mb-2">Study Rise</p>
          <h1 className="text-4xl font-black text-[#FF6B35] leading-tight">
            合格まで、<br />一緒に。
          </h1>
          <p className="text-sm text-gray-500 mt-3">大学受験生のための学習管理アプリ</p>
        </div>

        {/* Googleログイン */}
        <button
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 bg-[#13131A] border border-[#2A2A35] rounded-xl py-3 text-sm font-bold hover:border-[#FF6B35] transition-colors mb-4"
        >
          <span className="text-base">G</span> Googleでログイン
        </button>

        <div className="text-center text-xs text-gray-600 my-4">または</div>

        {/* メールフォーム */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#1E1E28] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35] transition-colors"
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#1E1E28] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35] transition-colors"
          />
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF3A00] rounded-xl py-3 font-black text-sm hover:opacity-90 transition-opacity"
          >
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === 'login' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[#FF6B35] ml-1"
          >
            {mode === 'login' ? '新規登録' : 'ログイン'}
          </button>
        </p>

      </div>
    </div>
  )
}