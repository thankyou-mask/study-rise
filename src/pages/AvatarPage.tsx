import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import PraiseModal from '../components/PraiseModal'

const SUBJECTS = ['英語', '数学', '国語', '理科', '社会']
const COLORS: Record<string, string> = {
  英語: '#FF6B35', 数学: '#4ECDC4', 国語: '#FFD93D', 理科: '#6BCB77', 社会: '#A78BFA',
}

const MESSAGES = {
  start: ['「さあ、始めよう！」', '「一緒に頑張ろう！」', '「集中していこう！」'],
  mid:   ['「いい調子だよ！」', '「その調子！」', '「頑張ってるね！」'],
  long:  ['「すごい集中力！」', '「もう少しで休憩しよう」', '「よく頑張ってる！」'],
  night: ['「夜遅いね、無理しないで」', '「睡眠も大事だよ」', '「あと少しにしようね」'],
  break: ['「少し休もう」', '「目を休めてね」', '「また一緒に頑張ろう」'],
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getMessage(seconds: number): string {
  const hour = new Date().getHours()
  const pool =
    hour >= 23 || hour < 5 ? MESSAGES.night :
    seconds < 15 * 60      ? MESSAGES.start :
    seconds < 45 * 60      ? MESSAGES.mid   : MESSAGES.long
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function AvatarPage({ onExit }: { onExit: () => void }) {
  const { user } = useAuth()
  const [subject, setSubject] = useState('英語')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('「一緒に頑張ろう！」')
  const [praise,  setPraise]  = useState<{ minutes: number; subject: string } | null>(null)
  const [isBreak, setIsBreak] = useState(false)
  const [showUI,  setShowUI]  = useState(true)
  const intervalRef    = useRef<number | null>(null)
  const msgIntervalRef = useRef<number | null>(null)
  const uiTimerRef     = useRef<number | null>(null)
  const videoRef       = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
      msgIntervalRef.current = window.setInterval(() => {
        setMessage(getMessage(seconds))
      }, 15000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current)
    }
  }, [running])

  function handleTap() {
    setShowUI(true)
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    if (running) {
      uiTimerRef.current = window.setTimeout(() => setShowUI(false), 4000)
    }
  }

  function handleStart() {
    setRunning(true)
    setIsBreak(false)
    setMessage(MESSAGES.start[Math.floor(Math.random() * MESSAGES.start.length)])
    videoRef.current?.play()
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    uiTimerRef.current = window.setTimeout(() => setShowUI(false), 4000)
  }

  function handleBreak() {
    setRunning(false)
    setIsBreak(true)
    setShowUI(true)
    setMessage(MESSAGES.break[Math.floor(Math.random() * MESSAGES.break.length)])
    videoRef.current?.pause()
  }

  async function handleSave() {
    if (!user || seconds < 10) return
    const minutes = Math.round(seconds / 60)
    await addDoc(collection(db, 'studyRecords'), {
      uid: user.uid, subject, minutes,
      date: getToday(), createdAt: serverTimestamp(),
    })
    setSeconds(0)
    setRunning(false)
    setIsBreak(false)
    setShowUI(true)
    setPraise({ minutes, subject })
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black" onClick={handleTap}>

      {/* 全画面動画（縦長・全身表示） */}
      <video
        ref={videoRef}
        src="/avatars/avatar-idle.mp4"
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          filter: isBreak ? 'brightness(0.4)' : 'brightness(1)',
          transition: 'filter 0.5s',
          background: '#0D0D0F',
        }}
      />

      {/* グラデーション */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.9) 100%)' }}
      />

      {/* 上部：ステータス */}
      <div
        className="absolute top-0 left-0 right-0 px-5 pt-12 pb-4 transition-opacity duration-500"
        style={{ opacity: showUI ? 1 : 0 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {running && <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />}
            <span className="text-xs text-white font-bold tracking-widest">
              {running ? '勉強中' : isBreak ? '休憩中' : '準備中'}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white">{fmt(seconds)}</div>
        </div>
      </div>

      {/* 科目選択（未開始時のみ） */}
      {!running && !isBreak && (
        <div className="absolute top-28 left-0 right-0 flex flex-wrap gap-2 justify-center px-5">
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); setSubject(s) }}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
              style={{
                borderColor: subject === s ? COLORS[s] : 'rgba(255,255,255,0.3)',
                color:       subject === s ? COLORS[s] : 'rgba(255,255,255,0.7)',
                background:  subject === s ? `${COLORS[s]}33` : 'rgba(0,0,0,0.4)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* セリフ */}
      <div
        className="absolute left-5 right-5 transition-opacity duration-500"
        style={{ bottom: '140px', opacity: showUI || !running ? 1 : 0 }}
      >
        <div className="bg-black bg-opacity-60 rounded-2xl px-4 py-3">
          <p className="text-sm text-white font-bold leading-relaxed">{message}</p>
        </div>
      </div>

      {/* 下部：ボタン */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-10 transition-opacity duration-500"
        style={{ opacity: showUI ? 1 : 0 }}
      >
        {!running && !isBreak && (
          <button
            onClick={e => { e.stopPropagation(); handleStart() }}
            className="w-full py-4 rounded-2xl font-black text-lg"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3A00)' }}
          >
            ▶ 一緒に勉強開始
          </button>
        )}

        {running && (
          <div className="flex gap-3">
            <button
              onClick={e => { e.stopPropagation(); handleBreak() }}
              className="flex-1 py-4 rounded-2xl font-bold text-sm text-white border border-white border-opacity-30"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              ☕ 休憩
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleSave() }}
              className="flex-1 py-4 rounded-2xl font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #4ECDC4, #2EAF9F)' }}
            >
              ✅ 終了・保存
            </button>
          </div>
        )}

        {isBreak && (
          <div className="flex gap-3">
            <button
              onClick={e => { e.stopPropagation(); handleStart() }}
              className="flex-1 py-4 rounded-2xl font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3A00)' }}
            >
              ▶ 再開
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleSave() }}
              className="flex-1 py-4 rounded-2xl font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #4ECDC4, #2EAF9F)' }}
            >
              ✅ 終了・保存
            </button>
          </div>
        )}

        {/* 戻るボタン */}
        {!running && (
          <button
            onClick={e => { e.stopPropagation(); onExit() }}
            className="w-full mt-3 py-3 rounded-2xl text-xs text-white border border-white border-opacity-20"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            ← ホームに戻る
          </button>
        )}
      </div>

      {/* 休憩オーバーレイ */}
      {isBreak && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-5xl mb-3">☕</p>
            <p className="text-white font-bold text-lg">休憩中...</p>
          </div>
        </div>
      )}

      {/* ねぎらいモーダル */}
      {praise && (
        <PraiseModal
          minutes={praise.minutes}
          subject={praise.subject}
          onClose={() => { setPraise(null); onExit() }}
        />
      )}
    </div>
  )
}