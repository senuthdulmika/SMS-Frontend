import type { ReactNode } from "react"

type RingProps = {
  value: number // 0..1
  size?: number
  stroke?: number
  children?: ReactNode
  className?: string
}

const Ring = ({ value, size = 96, stroke = 8, children, className = "" }: RingProps) => {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const gradId = `ring-${size}-${stroke}`

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4d5e" />
            <stop offset="100%" stopColor="#a8121f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-700)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.4s ease", filter: "drop-shadow(0 0 6px rgba(239,43,61,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export default Ring
