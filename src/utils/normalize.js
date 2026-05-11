import { createId } from './id'
import {
  STATUS_OPTIONS,
  TODO_PRIORITIES,
  DEFAULT_CHECKIN,
  DEFAULT_CHECKOUT,
} from '../constants'

export const normalizeEntry = (entry) => ({
  id: entry?.id || createId(),
  startTime: entry?.startTime || '',
  endTime: entry?.endTime || '',
  project: entry?.project || '',
  task: entry?.task || '',
  status: STATUS_OPTIONS.includes(entry?.status)
    ? entry.status
    : STATUS_OPTIONS[0],
  notes: entry?.notes || '',
})

export const normalizeTodo = (todo) => ({
  id: todo?.id || createId(),
  task: todo?.task || '',
  completed: Boolean(todo?.completed),
  priority: TODO_PRIORITIES.includes(todo?.priority)
    ? todo.priority
    : TODO_PRIORITIES[1],
  dueDate: todo?.dueDate || '',
  notes: todo?.notes || '',
})

export const normalizeProfile = (profile) => ({
  fullName: profile?.fullName || '',
  studentId: profile?.studentId || '',
  email: profile?.email || '',
})

export const normalizeDay = (day, fallbackId) => {
  const id = day?.id || day?.label || fallbackId
  return {
    id,
    label: day?.label || id,
    entries: Array.isArray(day?.entries)
      ? day.entries.map(normalizeEntry)
      : [],
    checkIn:
      typeof day?.checkIn === 'string' && day.checkIn
        ? day.checkIn
        : DEFAULT_CHECKIN,
    checkOut:
      typeof day?.checkOut === 'string' && day.checkOut
        ? day.checkOut
        : DEFAULT_CHECKOUT,
    todos: Array.isArray(day?.todos) ? day.todos.map(normalizeTodo) : [],
  }
}
