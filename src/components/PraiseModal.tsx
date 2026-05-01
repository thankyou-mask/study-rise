const PRAISE_MESSAGES = [
  { emoji: '🔥', text: 'よく頑張った！その積み重ねが合格を呼ぶ。' },
  { emoji: '⚡', text: 'お疲れ様！今日も一歩、夢に近づいたね。' },
  { emoji: '💪', text: 'すごい！継続こそが最強の武器だよ。' },
  { emoji: '🌟', text: 'よくやった！自分を褒めてあげて。' },
  { emoji: '🎯', text: '着実に前進中！この調子で行こう。' },
  { emoji: '✨', text: '今日の努力は絶対に裏切らない。' },
  { emoji: '🏆', text: 'さすが！合格への道を歩んでいるね。' },
  { emoji: '💡', text: '頭も心もフル回転、お疲れ様でした！' },
  { emoji: '🚀', text: 'どんどん成長してる。止まらないで！' },
  { emoji: '🌈', text: '休憩も忘れずに。また明日も一緒に頑張ろう！' },
]

type Props = {
  minutes: number
  subject: string
  onClose: () => void
}

export default function PraiseModal({ minutes, subject, onClose }: Props) {
  const msg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#13131A] border border-[#2A2A35] rounded-3xl p-8 w-full max-w-sm text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{msg.emoji}</div>
        <div className="bg-[#0D0D0F] rounded-2xl px-4 py-3 mb-5">
          <p className="text-xs text-gray-500 mb-1">記録完了</p>
          <p className="text-2xl font-black text-[#FF6B35]">{minutes}<span className="text-sm ml-1">分</span></p>
          <p className="text-xs text-gray-400 mt-1">{subject}</p>
        </div>
        <p className="text-base font-bold leading-relaxed mb-6">{msg.text}</p>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-[#FF6B35] to-[#FF3A00]"
        >
          ありがとう！
        </button>
      </div>
    </div>
  )
}