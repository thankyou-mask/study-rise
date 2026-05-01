import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
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

export default function TimerPage() {
  const { user } = useAuth()
  const [subject, setSubject] = useState('英語')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [todayRecords, setTodayRecords] = useState<any[]>([])
  const [saved, setSaved] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    fetchToday()
  }, [user])

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  async function fetchToday() {
    if (!user) return
    const q = query(
      collection(db, 'studyRecords'),
      where('uid', '==', user.uid),
      where('date', '==', getToday())
    )
    const snap = await getDocs(q)
    setTodayRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function handleSave() {
    if (!user || seconds < 10) return
    const minutes = Math.round(seconds / 60)
    await addDoc(collection(db, 'studyRecords'), {
      uid:      user.uid,
      subject,
      minutes,
      date:     getToday(),
      createdAt: serverTimestamp(),
    })
    setSeconds(0)
    setRunning(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    fetchToday()
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const todayTotal = todayRecords.reduce((a, r) => a + r.minutes, 0)

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8] pb-24 px-5">

      <div className="pt-12 pb-4 text-center">
        <p className="text-xs text-gray-500 tracking-[3px] uppercase">Focus Mode</p>
      </div>

      {/* 科目選択 */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className="px-4 py-2 rounded-full text-sm font-bold border transition-all"
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

      {/* タイマー円 */}
      <div
        className="w-48 h-48 rounded-full mx-auto mb-8 flex flex-col items-center justify-center border-4 transition-all duration-500"
        style={{
          borderColor: running ? COLORS[subject] : '#2A2A35',
          boxShadow:   running ? `0 0 40px ${COLORS[subject]}44` : 'none',
        }}
      >
        <p className="text-4xl font-black font-mono" style={{ color: running ? COLORS[subject] : '#F5F0E8' }}>
          {fmt(seconds)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{subject}</p>
      </div>

      {/* ボタン */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setRunning(r => !r)}
          className="flex-1 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-[#FF6B35] to-[#FF3A00]"
        >
          {running ? '⏸ 一時停止' : '▶ スタート'}
        </button>
        {seconds > 0 && !running && (
          <button
            onClick={handleSave}
            className="flex-1 py-4 rounded-2xl font-black text-lg"
            style={{ background: 'linear-gradient(135deg, #4ECDC4, #2EAF9F)' }}
          >
            {saved ? '✅ 保存済み' : '✅ 保存'}
          </button>
        )}
      </div>

      {seconds > 0 && (
        <button
          onClick={() => { setSeconds(0); setRunning(false) }}
          className="w-full py-3 rounded-2xl text-sm text-gray-500 border border-[#2A2A35] mb-4"
        >
          リセット
        </button>
      )}

      {/* 今日の記録 */}
      {todayRecords.length > 0 && (
        <div className="bg-[#13131A] border border-[#2A2A35] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold">今日の記録</p>
            <p className="text-xs text-gray-500">計 {Math.floor(todayTotal / 60)}h{todayTotal % 60}m</p>
          </div>
          {todayRecords.slice().reverse().map(r => (
            <div key={r.id} className="flex justify-between py-2 border-t border-[#2A2A35]">
              <span className="text-sm font-bold" style={{ color: COLORS[r.subject] }}>{r.subject}</span>
              <span className="text-sm text-gray-500">{r.minutes}分</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}