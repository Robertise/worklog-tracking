import { TIME_STEP_MINUTES, TIME_START_HOUR, TIME_END_HOUR } from '../constants'

export const buildTimeOptions = (startHour, endHour) =>
  Array.from(
    { length: (endHour - startHour) * (60 / TIME_STEP_MINUTES) + 1 },
    (_, index) => {
      const totalMinutes = startHour * 60 + index * TIME_STEP_MINUTES
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    },
  )

export const TIME_OPTIONS = buildTimeOptions(TIME_START_HOUR, TIME_END_HOUR)
export const CHECKIN_OPTIONS = buildTimeOptions(8, 18)

export const calculateDurationHours = (startTime, endTime) => {
  if (!startTime || !endTime) return null
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) {
    return null
  }
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  if (endTotal <= startTotal) return null
  return (endTotal - startTotal) / 60
}
