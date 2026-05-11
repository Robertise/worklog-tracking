export const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const todayStamp = () => new Date().toISOString().slice(0, 10)

export const formatTitleDate = (dayId) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
    const [year, month, day] = dayId.split('-')
    return `${day}/${month}/${year}`
  }
  return dayId
}
