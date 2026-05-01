import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [universityName, setUniversityName] = useState('')
  const [examDate, setExamDate]             = useState('')
  const [dailyGoalHours, setDailyGoalHours] = useState(6)
  const [displayName, setDisplayName]       = useState('')
  const [saved, setSaved]                   = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setUniversityName(d.universityName ?? '')
        setExamDate(d.examDate ?? '')
        setDailyGoalHours(d.dailyGoalHours ?? 6)
        setDisplayName(d.displayName ?? '')
      }
    })
  }, [user])

  async function handleSave() {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), {
      universityName,
      examDate,
      dailyGoalHours: Number(dailyGoalHours),
      displayName,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8] pb-24 px-5">

      <div className="pt-12 pb-6">
        <h1 className="text-2xl font-black">設定</h1>
      </div>

      {/* プロフィール */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#2A2A35] flex items-center justify-center text-2xl flex-shrink-0">
          🎯
        </div>
        <div>
          <p className="font-bold">{displayName || user?.email}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <p className="text-xs text-[#FF6B35] mt-1">無料プラン</p>
        </div>
      </div>

      {/* 目標設定 */}
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">目標設定</p>
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl overflow-hidden mb-3">

        <div className="p-4 border-b border-[#2A2A35]">
          <p className="text-xs text-gray-500 mb-2">ニックネーム</p>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="例：田中 葵"
            className="w-full bg-[#0D0D0F] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35] transition-colors"
          />
        </div>

        <div className="p-4 border-b border-[#2A2A35]">
          <p className="text-xs text-gray-500 mb-2">目標大学</p>
          <input
            value={universityName}
            onChange={e => setUniversityName(e.target.value)}
            placeholder="例：東京大学"
            className="w-full bg-[#0D0D0F] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35] transition-colors"
          />
        </div>

        <div className="p-4 border-b border-[#2A2A35]">
          <p className="text-xs text-gray-500 mb-2">試験日</p>
          <input
            type="date"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            className="w-full bg-[#0D0D0F] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35] transition-colors"
          />
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-500 mb-2">
            1日の目標学習時間：<span className="text-[#FF6B35] font-bold">{dailyGoalHours}時間</span>
          </p>
          <input
            type="range"
            min={1}
            max={16}
            value={dailyGoalHours}
            onChange={e => setDailyGoalHours(Number(e.target.value))}
            className="w-full accent-[#FF6B35]"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1時間</span>
            <span>16時間</span>
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        className="w-full py-4 rounded-2xl font-black text-lg mb-3 transition-all"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #4ECDC4, #2EAF9F)'
            : 'linear-gradient(135deg, #FF6B35, #FF3A00)',
        }}
      >
        {saved ? '✅ 保存しました！' : '保存する'}
      </button>

      {/* ログアウト */}
      <button
        onClick={logout}
        className="w-full py-4 rounded-2xl font-bold text-sm border border-[#2A2A35] text-red-400"
      >
        ログアウト
      </button>

    </div>
  )
}