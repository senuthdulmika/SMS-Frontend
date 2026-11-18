import useData from "../hooks/useData"
import Icon from "./Icon"

const Toasts = () => {
  const { toasts, dismissToast } = useData()

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto animate-toast flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-2xl shadow-black/60 ${
            t.kind === "level"
              ? "border-crimson-400 bg-linear-to-r from-crimson-700 to-crimson-500 text-white"
              : t.kind === "xp"
                ? "border-crimson-600 bg-ink-900 text-crimson-300"
                : t.kind === "error"
                  ? "border-crimson-700 bg-crimson-900 text-crimson-300"
                  : "border-ink-600 bg-ink-800 text-ink-100"
          }`}
        >
          <Icon name={t.kind === "level" ? "trophy" : t.kind === "xp" ? "zap" : t.kind === "error" ? "alert" : "check"} size={16} />
          {t.text}
        </button>
      ))}
    </div>
  )
}

export default Toasts
