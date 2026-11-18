import { useEffect, type ReactNode } from "react"
import Icon from "./Icon"

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

const Modal = ({ title, onClose, children, wide = false }: ModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`card relative flex max-h-[92vh] w-full animate-pop flex-col overflow-hidden rounded-b-none shadow-2xl shadow-black sm:rounded-b-2xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h2 className="heading text-lg font-semibold">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
