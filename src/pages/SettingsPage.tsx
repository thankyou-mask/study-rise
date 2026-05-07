import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const COLORS: Record<string, string> = {
  英語: '#FF6B35', 数学: '#4ECDC4', 国語: '#FFD93D', 理科: '#6BCB77', 社会: '#A78BFA',
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [tab, setTab]                   = useState<'profile' | 'mypage'>('mypage')
  const [profile, setProfile]           = useState<any>(null)
  const [records, setRecords]           = useState<any[]>([])
  const [universityName, setUniversityName] = useState('')
  const [examDate, setExamDate]         = useState('')
  const [dailyGoalHours, setDailyGoalHours] = useState(6)
  const [displayName, setDisplayName]   = useState('')
  const [saved, setSaved]               = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setProfile(d)
        setUniversityName(d.universityName ?? '')
        setExamDate(d.examDate ?? '')
        setDailyGoalHours(d.dailyGoalHours ?? 6)
        setDisplayName(d.displayName ?? '')
      }
    })
    fetchRecords()
  }, [user])

  async function fetchRecords() {
    if (!user) return
    const q = query(
      collection(db, 'studyRecords'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function handleSave() {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), {
      universityName, examDate,
      dailyGoalHours: Number(dailyGoalHours),
      displayName,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalMinutes = records.reduce((a, r) => a + r.minutes, 0)
  const streak = calcStreak(records)
  const byDate = records.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})

  function calcStreak(recs: any[]) {
    const days = [...new Set(recs.map(r => r.date))].sort().reverse()
    let s = 0
    const d = new Date()
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().slice(0, 10)
      if (days.includes(key)) { s++; d.setDate(d.getDate() - 1) }
      else break
    }
    return s
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8] pb-24">

      {/* ヘッダー */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-black">マイページ</h1>
      </div>

      {/* プロフィールカード */}
      <div className="mx-5 bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#2A2A35] flex items-center justify-center text-2xl flex-shrink-0">
          🎯
        </div>
        <div>
          <p className="font-bold text-base">{displayName || user?.email}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <p className="text-xs text-[#FF6B35] mt-1">無料プラン</p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-2 px-5 mb-4">
        {[['mypage', '学習記録'], ['profile', '設定']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: tab === id ? 'linear-gradient(135deg, #FF6B35, #FF3A00)' : '#13131A',
              color: tab === id ? '#fff' : '#666',
              border: tab === id ? 'none' : '1px solid #2A2A35',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* マイページタブ */}
      {tab === 'mypage' && (
        <div className="px-5">

          {/* 統計 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-[#FF6B35]">{streak}🔥</p>
              <p className="text-[10px] text-gray-500 mt-1">連続日数</p>
            </div>
            <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-3 text-center">
              <p className="text-xl font-black text-[#4ECDC4]">{Math.floor(totalMinutes / 60)}h</p>
              <p className="text-[10px] text-gray-500 mt-1">累計時間</p>
            </div>
            <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-3 text-center">
              <p className="text-xl font-black text-[#FFD93D]">{new Set(records.map(r => r.date)).size}日</p>
              <p className="text-[10px] text-gray-500 mt-1">学習日数</p>
            </div>
          </div>

          {/* 最近の記録 */}
          <p className="text-xs font-bold text-gray-400 mb-2">最近の記録</p>
          {Object.entries(byDate).slice(0, 10).map(([date, recs]) => {
            const total = (recs as any[]).reduce((a, r) => a + r.minutes, 0)
            return (
              <div key={date} className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold">{date}</p>
                  <p className="text-xs text-gray-500">計 {Math.floor(total / 60)}h{total % 60}m</p>
                </div>
                {(recs as any[]).map(r => (
                  <div key={r.id} className="py-2 border-t border-[#2A2A35]">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold" style={{ color: COLORS[r.subject] }}>{r.subject}</span>
                      <span className="text-xs text-gray-500">{r.minutes}分</span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-gray-400 mt-1">💬 {r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          })}

          {records.length === 0 && (
            <div className="text-center text-gray-600 mt-10">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-sm">まだ記録がありません</p>
            </div>
          )}
        </div>
      )}

      {/* 設定タブ */}
      {tab === 'profile' && (
        <div className="px-5">
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
                1日の目標：<span className="text-[#FF6B35] font-bold">{dailyGoalHours}時間</span>
              </p>
              <input
                type="range" min={1} max={16} value={dailyGoalHours}
                onChange={e => setDailyGoalHours(Number(e.target.value))}
                className="w-full accent-[#FF6B35]"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1時間</span><span>16時間</span>
              </div>
            </div>
          </div>

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

          <button
            onClick={logout}
            className="w-full py-4 rounded-2xl font-bold text-sm border border-[#2A2A35] text-red-400"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  )
}