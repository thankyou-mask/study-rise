import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const SUBJECTS = ['英語', '数学', '国語', '理科', '社会']
const COLORS: Record<string, string> = {
  英語: '#FF6B35',
  数学: '#4ECDC4',
  国語: '#FFD93D',
  理科: '#6BCB77',
  社会: '#A78BFA',
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function RecordsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<any[]>([])

  useEffect(() => {
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

  // 科目別合計
  const subjectTotals = SUBJECTS.map(s => ({
    subject: s,
    minutes: records.filter(r => r.subject === s).reduce((a, r) => a + r.minutes, 0),
  }))
  const maxMinutes = Math.max(...subjectTotals.map(s => s.minutes), 1)

  // 日別グループ
  const byDate = records.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})

  // 過去14日のカレンダー
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })

  const totalMinutes = records.reduce((a, r) => a + r.minutes, 0)

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8] pb-24 px-5">

      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-black">学習記録</h1>
      </div>

      {/* 累計 */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3 text-center">
        <p className="text-xs text-gray-500 mb-1">累計学習時間</p>
        <p className="text-4xl font-black text-[#FF6B35]">
          {Math.floor(totalMinutes / 60)}
          <span className="text-lg">h</span>
          {totalMinutes % 60}
          <span className="text-lg">m</span>
        </p>
      </div>

      {/* カレンダー */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3">
        <p className="text-xs font-bold text-gray-400 mb-3">過去14日</p>
        <div className="grid grid-cols-7 gap-1">
          {last14.map(date => {
            const mins = (byDate[date] || []).reduce((a: number, r: any) => a + r.minutes, 0)
            const isToday = date === getToday()
            return (
              <div
                key={date}
                className="h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: isToday
                    ? '#FF6B35'
                    : mins >= 60 ? '#FF6B3588'
                    : mins > 0  ? '#FF6B3533'
                    : '#1E1E28',
                  color: isToday ? '#fff' : mins > 0 ? '#FF6B35' : '#444',
                  border: isToday ? '2px solid #FF6B35' : '2px solid transparent',
                }}
              >
                {new Date(date).getDate()}
              </div>
            )
          })}
        </div>
      </div>

      {/* 科目別バー */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3">
        <p className="text-xs font-bold text-gray-400 mb-3">科目別合計</p>
        {subjectTotals.map(({ subject, minutes }) => (
          <div key={subject} className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>{subject}</span>
              <span className="text-gray-500">
                {Math.floor(minutes / 60)}h{minutes % 60}m
              </span>
            </div>
            <div className="bg-[#0D0D0F] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(minutes / maxMinutes) * 100}%`,
                  background: COLORS[subject],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 日別リスト */}
      <p className="text-xs font-bold text-gray-400 mb-2">最近の記録</p>
      {Object.entries(byDate).slice(0, 10).map(([date, recs]) => {
        const total = (recs as any[]).reduce((a, r) => a + r.minutes, 0)
        return (
          <div key={date} className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold">{date}</p>
              <p className="text-xs text-gray-500">
                計 {Math.floor(total / 60)}h{total % 60}m
              </p>
            </div>
            {(recs as any[]).map(r => (
              <div key={r.id} className="flex justify-between py-1 border-t border-[#2A2A35]">
                <span className="text-sm font-bold" style={{ color: COLORS[r.subject] }}>
                  {r.subject}
                </span>
                <span className="text-xs text-gray-500">{r.minutes}分</span>
              </div>
            ))}
          </div>
        )
      })}

      {records.length === 0 && (
        <div className="text-center text-gray-600 mt-10">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">まだ記録がありません</p>
          <p className="text-xs mt-1">学習タイマーで記録を始めよう！</p>
        </div>
      )}
    </div>
  )
}