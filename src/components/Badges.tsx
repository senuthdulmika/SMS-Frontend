import { PRIORITY_META } from "../lib/constants"
import type { Priority, Subject } from "../types"

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide ${PRIORITY_META[priority].cls}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[priority].dot}`} />
    {PRIORITY_META[priority].label}
  </span>
)

export const SubjectTag = ({ subject }: { subject?: Subject | null }) => {
  if (!subject) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-200">
      <span className="h-2 w-2 rounded-full" style={{ background: subject.color }} />
      {subject.name}
    </span>
  )
}
