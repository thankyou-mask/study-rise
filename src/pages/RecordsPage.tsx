import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const SUBJECTS = ['英語', '数学', '国語', '理科', '社会']
const COLORS: Record<string, string> = {
  英語: '#FF6B35', 数学: '#4ECDC4', 国語: '#FFD93D', 理科: '#6BCB77', 社会: '#A78BFA',
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function RecordsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('英語')
  const [hours, setHours]     = useState(0)
  const [mins, setMins]       = useState(30)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => { fetchRecords() }, [user])

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
    setSaving(true)
    const minutes = hours * 60 + mins
    if (minutes === 0) { setSaving(false); return }
    await addDoc(collection(db, 'studyRecords'), {
      uid: user.uid, subject, minutes,
      comment: comment.trim(),
      date: getToday(),
      createdAt: serverTimestamp(),
    })
    setComment('')
    setHours(0)
    setMins(30)
    setShowForm(false)
    setSaving(false)
    fetchRecords()
  }

  const subjectTotals = SUBJECTS.map(s => ({
    subject: s,
    minutes: records.filter(r => r.subject === s).reduce((a, r) => a + r.minutes, 0),
  }))
  const maxMinutes = Math.max(...subjectTotals.map(s => s.minutes), 1)
  const totalMinutes = records.reduce((a, r) => a + r.minutes, 0)

  const byDate = records.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8] pb-24 px-5">

      <div className="pt-12 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-black">学習記録</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl font-black text-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3A00)' }}
        >
          ＋ 記録する
        </button>
      </div>

      {/* 手動入力フォーム */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowForm(false)}>
          <div className="bg-[#13131A] border border-[#2A2A35] rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#2A2A35] rounded-full mx-auto mb-6" />
            <h2 className="text-lg font-black mb-4">学習を記録する</h2>

            {/* 科目選択 */}
            <p className="text-xs text-gray-500 mb-2">科目</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                  style={{
                    borderColor: subject === s ? COLORS[s] : '#2A2A35',
                    color:       subject === s ? COLORS[s] : '#666',
                    background:  subject === s ? `${COLORS[s]}22` : 'transparent',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* 時間入力 */}
            <p className="text-xs text-gray-500 mb-2">学習時間</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-[#0D0D0F] border border-[#2A2A35] rounded-xl p-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hours}
                  onChange={e => setHours(Number(e.target.value))}
                  className="bg-transparent w-full text-center text-2xl font-black outline-none"
                />
                <span className="text-gray-500 text-sm">時間</span>
              </div>
              <div className="flex-1 bg-[#0D0D0F] border border-[#2A2A35] rounded-xl p-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={mins}
                  onChange={e => setMins(Number(e.target.value))}
                  className="bg-transparent w-full text-center text-2xl font-black outline-none"
                />
                <span className="text-gray-500 text-sm">分</span>
              </div>
            </div>

            {/* よく使う時間 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[15, 30, 45, 60, 90, 120].map(m => (
                <button
                  key={m}
                  onClick={() => { setHours(Math.floor(m / 60)); setMins(m % 60) }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-[#2A2A35] text-gray-400"
                >
                  {m >= 60 ? `${m / 60}h` : `${m}分`}
                </button>
              ))}
            </div>

            {/* コメント */}
            <p className="text-xs text-gray-500 mb-2">コメント（任意）</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="今日の一言メモ..."
              rows={2}
              className="w-full bg-[#0D0D0F] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35] transition-colors resize-none mb-4"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-black text-lg"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3A00)' }}
            >
              {saving ? '保存中...' : '記録する'}
            </button>
          </div>
        </div>
      )}

      {/* 累計 */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3 text-center">
        <p className="text-xs text-gray-500 mb-1">累計学習時間</p>
        <p className="text-4xl font-black text-[#FF6B35]">
          {Math.floor(totalMinutes / 60)}<span className="text-lg">h</span>
          {totalMinutes % 60}<span className="text-lg">m</span>
        </p>
      </div>

      {/* カレンダー */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3">
        <p className="text-xs font-bold text-gray-400 mb-3">過去14日</p>
        <div className="grid grid-cols-7 gap-1">
          {last14.map(date => {
            const mins2 = (byDate[date] || []).reduce((a: number, r: any) => a + r.minutes, 0)
            const isToday = date === getToday()
            return (
              <div key={date} className="h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: isToday ? '#FF6B35' : mins2 >= 60 ? '#FF6B3588' : mins2 > 0 ? '#FF6B3533' : '#1E1E28',
                  color: isToday ? '#fff' : mins2 > 0 ? '#FF6B35' : '#444',
                  border: isToday ? '2px solid #FF6B35' : '2px solid transparent',
                }}>
                {new Date(date + 'T00:00:00').getDate()}
              </div>
            )
          })}
        </div>
      </div>

      {/* 科目別バー */}
      <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4 mb-3">
        <p className="text-xs font-bold text-gray-400 mb-3">科目別合計</p>
        {subjectTotals.map(({ subject: s, minutes: m }) => (
          <div key={s} className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>{s}</span>
              <span className="text-gray-500">{Math.floor(m / 60)}h{m % 60}m</span>
            </div>
            <div className="bg-[#0D0D0F] rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(m / maxMinutes) * 100}%`, background: COLORS[s] }} />
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
          <p className="text-xs mt-1">右上の「＋ 記録する」から始めよう！</p>
        </div>
      )}
    </div>
  )
}