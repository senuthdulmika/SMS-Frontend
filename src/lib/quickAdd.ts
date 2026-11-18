import type { Priority, Subject } from "../types"
import { addDays, startOfDay } from "./dates"

// NATURAL-LANGUAGE QUICK ADD
//   "Finish lab report fri 5pm !high #lab @cs"
//   !urgent !high !med !low  -> priority      #tag -> tag
//   @math -> subject (name prefix or code)
//   today, tomorrow, mon..sun, 3d (in 3 days), 5pm / 17:30 -> due date

export type QuickParsed = {
  title: string
  priority?: Priority
  tags: string[]
  subjectId?: string
  dueDate?: string
  chips: string[]
}

const PRIORITY_TOKENS: Record<string, Priority> = {
  urgent: "URGENT",
  u: "URGENT",
  high: "HIGH",
  h: "HIGH",
  med: "MEDIUM",
  medium: "MEDIUM",
  m: "MEDIUM",
  low: "LOW",
  l: "LOW"
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
const WEEKDAYS_FULL = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const parseTime = (tok: string): { h: number; m: number } | null => {
  const match = tok.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/)
  if (match) {
    let h = Number(match[1])
    const m = Number(match[2] ?? 0)
    if (h < 1 || h > 12 || m > 59) return null
    if (match[3] === "pm" && h !== 12) h += 12
    if (match[3] === "am" && h === 12) h = 0
    return { h, m }
  }
  const h24 = tok.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (h24) return { h: Number(h24[1]), m: Number(h24[2]) }
  return null
}

// @cs -> "CS101" (code prefix), "Computer Science" (initials), @math -> "Mathematics" (name prefix)
const matchSubject = (subjects: Subject[], key: string): Subject | undefined => {
  const compact = (s: string) => s.toLowerCase().replace(/\s+/g, "")
  const initials = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join("")
      .toLowerCase()

  return (
    subjects.find((s) => s.code.toLowerCase() === key) ??
    subjects.find((s) => initials(s.name) === key) ??
    subjects.find((s) => s.code.toLowerCase().startsWith(key)) ??
    subjects.find((s) => compact(s.name).startsWith(key))
  )
}

export const parseQuickAdd = (text: string, subjects: Subject[], now = new Date()): QuickParsed => {
  const result: QuickParsed = { title: "", tags: [], chips: [] }
  const words: string[] = []
  let day: Date | null = null
  let clock: { h: number; m: number } | null = null

  for (const raw of text.trim().split(/\s+/).filter(Boolean)) {
    const tok = raw.toLowerCase()

    if (tok.startsWith("!") && PRIORITY_TOKENS[tok.slice(1)]) {
      result.priority = PRIORITY_TOKENS[tok.slice(1)]
      continue
    }
    if (tok.startsWith("#") && tok.length > 1) {
      result.tags.push(tok.slice(1))
      continue
    }
    if (tok.startsWith("@") && tok.length > 1) {
      const key = tok.slice(1)
      const found = matchSubject(subjects, key)
      if (found) {
        result.subjectId = found.id
        continue
      }
    }
    if (tok === "today" || tok === "tod") {
      day = startOfDay(now)
      continue
    }
    if (tok === "tomorrow" || tok === "tmr" || tok === "tom") {
      day = addDays(startOfDay(now), 1)
      continue
    }
    const wd = WEEKDAYS.indexOf(tok.slice(0, 3))
    if (wd >= 0 && (tok === WEEKDAYS[wd] || tok === WEEKDAYS_FULL[wd])) {
      let diff = (wd - now.getDay() + 7) % 7
      if (diff === 0) diff = 7
      day = addDays(startOfDay(now), diff)
      continue
    }
    const inDays = tok.match(/^(\d{1,3})d$/)
    if (inDays) {
      day = addDays(startOfDay(now), Number(inDays[1]))
      continue
    }
    const t = parseTime(tok)
    if (t) {
      clock = t
      continue
    }
    words.push(raw)
  }

  result.title = words.join(" ")

  if (day || clock) {
    const d = day ? new Date(day) : startOfDay(now)
    if (clock) d.setHours(clock.h, clock.m, 0, 0)
    else d.setHours(23, 59, 0, 0)
    // "5pm" with no day: if it already passed today, mean tomorrow
    if (!day && clock && d.getTime() < now.getTime()) d.setDate(d.getDate() + 1)
    result.dueDate = d.toISOString()
  }

  if (result.priority) result.chips.push(`${result.priority.toLowerCase()} priority`)
  if (result.subjectId) {
    const s = subjects.find((x) => x.id === result.subjectId)
    if (s) result.chips.push(s.name)
  }
  if (result.dueDate) {
    result.chips.push(
      new Date(result.dueDate).toLocaleString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
      })
    )
  }
  result.tags.forEach((t) => result.chips.push(`#${t}`))
  return result
}
