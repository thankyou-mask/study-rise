import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const QUOTES = [
  { text: '今日の努力が、明日の自分を作る。', author: '受験の心得' },
  { text: '諦めた瞬間、試合終了だ。', author: '― 安西先生' },
  { text: '努力は必ず報われる。', author: '― 王貞治' },
  { text: '夢を持ち、その夢を信じること。', author: '― 松下幸之助' },
]

function daysUntil(dateStr: string) {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [quoteIdx, setQuoteIdx] = useState(0)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data())
    })
    setQuoteIdx(Math.floor(Math.random() * QUOTES.length))
  }, [user])

  const daysLeft = profile ? daysUntil(profile.examDate) : 0

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8] pb-24">

      {/* ヘッダー */}
      <div className="flex justify-between items-start px-5 pt-12 pb-4">
        <div>
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-1">おはよう</p>
          <h1 className="text-xl font-black">{profile?.displayName ?? user?.email}</h1>
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-600 border border-[#2A2A35] rounded-lg px-3 py-2"
        >
          ログアウト
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3">

        {/* カウントダウン */}
        <div className="bg-[#13131A] border border-[#FF6B3533] rounded-2xl p-5 text-center">
          <p className="text-xs text-gray-500 tracking-widest mb-1">
            {profile?.universityName ?? '志望校'} 合格まで
          </p>
          <p className="text-6xl font-black text-[#FF6B35] leading-none">{daysLeft}</p>
          <p className="text-xs text-gray-500 mt-1">日</p>
        </div>

        {/* 統計3つ */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-[#FF6B35]">0🔥</p>
            <p className="text-[10px] text-gray-500 mt-1">連続日数</p>
          </div>
          <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-[#4ECDC4]">0h</p>
            <p className="text-[10px] text-gray-500 mt-1">今日</p>
          </div>
          <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-[#FFD93D]">0h</p>
            <p className="text-[10px] text-gray-500 mt-1">累計</p>
          </div>
        </div>

        {/* 今日の目標 */}
        <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold">今日の目標</p>
            <p className="text-xs text-gray-500">{profile?.dailyGoalHours ?? 6}時間目標</p>
          </div>
          <div className="bg-[#0D0D0F] rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFD93D] rounded-full w-0" />
          </div>
          <p className="text-xs text-[#FF6B35] text-right mt-1">0% 達成</p>
        </div>

        {/* 名言 */}
        <button
          onClick={() => setQuoteIdx((quoteIdx + 1) % QUOTES.length)}
          className="bg-[#13131A] border-l-4 border-[#FF6B35] border-y border-r border-[#2A2A35] rounded-2xl p-4 text-left w-full"
        >
          <p className="text-[10px] text-[#FF6B35] tracking-widest mb-2">TODAY'S FUEL</p>
          <p className="text-sm italic leading-relaxed">「{QUOTES[quoteIdx].text}」</p>
          <p className="text-[10px] text-gray-500 mt-2">{QUOTES[quoteIdx].author}</p>
        </button>

        {/* 学習開始ボタン */}
        <button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF3A00] rounded-2xl py-4 font-black text-lg shadow-lg shadow-orange-900/30">
          ⚡ 今すぐ学習開始
        </button>

      </div>
    </div>
  )
}