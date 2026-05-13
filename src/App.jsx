import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx-js-style'

import {
  FILE_VERSION,
  STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from './constants'
import { todayStamp } from './utils/id'
import { calculateDurationHours } from './utils/time'
import { normalizeDay, normalizeProfile } from './utils/normalize'
import { createEntry, createTodo, createDay } from './utils/factories'
import { loadFromStorage, loadProfileFromStorage, getPreferredTheme } from './utils/storage'
import { buildSheet, sanitizeSheetName } from './utils/excel'

import Header from './components/Header'
import Toolbar from './components/Toolbar'
import ProfilePanel from './components/ProfilePanel'
import DayTabs from './components/DayTabs'
import DayPanel from './components/DayPanel'
import Notice from './components/Notice'

function App() {
  const initialDate = todayStamp()
  const initialData = useMemo(() => loadFromStorage(), [])
  
  // Reset to current day if stored data is from a previous day
  const shouldResetToToday = initialData && initialData.activeDayId !== initialDate
  
  const [days, setDays] = useState(() => {
    if (shouldResetToToday) {
      // Start fresh with today's worklog
      return [createDay(initialDate, true)]
    }
    return initialData?.days || [createDay(initialDate, true)]
  })
  const [activeDayId, setActiveDayId] = useState(
    () => shouldResetToToday ? initialDate : (initialData?.activeDayId || initialDate),
  )
  const [pendingDate, setPendingDate] = useState(
    () => shouldResetToToday ? initialDate : (initialData?.pendingDate || initialDate),
  )
  const [profile, setProfile] = useState(() => loadProfileFromStorage())
  const [theme, setTheme] = useState(getPreferredTheme)
  const [readOnly, setReadOnly] = useState(false)
  const [activePanel, setActivePanel] = useState('worklog')
  const [notice, setNotice] = useState(null)
  const fileInputRef = useRef(null)

  const activeDay = useMemo(
    () => days.find((day) => day.id === activeDayId) || days[0],
    [days, activeDayId],
  )

  const totalHours = useMemo(() => {
    if (!activeDay) return 0
    return activeDay.entries.reduce((sum, entry) => {
      const duration = calculateDurationHours(entry.startTime, entry.endTime)
      return sum + (duration || 0)
    }, 0)
  }, [activeDay])

  // Persist worklog data
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    const payload = {
      version: FILE_VERSION,
      savedAt: new Date().toISOString(),
      activeDayId,
      pendingDate,
      days,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [days, activeDayId, pendingDate])

  // Persist profile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profile),
    )
  }, [profile])

  // Apply theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme])

  /* ── Entry actions ─────────────────────── */

  const updateEntry = (entryId, field, value) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== activeDay.id) return day
        return {
          ...day,
          entries: day.entries.map((entry) =>
            entry.id === entryId ? { ...entry, [field]: value } : entry,
          ),
        }
      }),
    )
  }

  const addEntry = () => {
    setDays((prevDays) =>
      prevDays.map((day) =>
        day.id === activeDay.id
          ? { ...day, entries: [...day.entries, createEntry()] }
          : day,
      ),
    )
  }

  const deleteEntry = (entryId) => {
    setDays((prevDays) =>
      prevDays.map((day) =>
        day.id === activeDay.id
          ? {
              ...day,
              entries: day.entries.filter((entry) => entry.id !== entryId),
            }
          : day,
      ),
    )
  }

  /* ── Todo actions ──────────────────────── */

  const updateTodo = (todoId, field, value) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== activeDay.id) return day
        return {
          ...day,
          todos: day.todos.map((todo) =>
            todo.id === todoId ? { ...todo, [field]: value } : todo,
          ),
        }
      }),
    )
  }

  const addTodo = () => {
    setDays((prevDays) =>
      prevDays.map((day) =>
        day.id === activeDay.id
          ? { ...day, todos: [...day.todos, createTodo()] }
          : day,
      ),
    )
  }

  const deleteTodo = (todoId) => {
    setDays((prevDays) =>
      prevDays.map((day) =>
        day.id === activeDay.id
          ? {
              ...day,
              todos: day.todos.filter((todo) => todo.id !== todoId),
            }
          : day,
      ),
    )
  }

  /* ── Day / profile actions ─────────────── */

  const updateDayField = (field, value) => {
    setDays((prevDays) =>
      prevDays.map((day) =>
        day.id === activeDay.id ? { ...day, [field]: value } : day,
      ),
    )
  }

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const addDay = () => {
    if (!pendingDate || readOnly) return
    setDays((prevDays) => {
      const exists = prevDays.some((day) => day.id === pendingDate)
      if (exists) return prevDays
      const nextDays = [
        ...prevDays,
        createDay(pendingDate, false),
      ].sort((a, b) => a.id.localeCompare(b.id))
      return nextDays
    })
    setActiveDayId(pendingDate)
  }

  const deleteDay = (dayId) => {
    if (readOnly) return
    if (days.length <= 1) {
      setNotice({ type: 'error', text: 'Keep at least one day in the log.' })
      return
    }
    const nextDays = days.filter((day) => day.id !== dayId)
    const nextActiveId =
      dayId === activeDayId ? nextDays[0].id : activeDayId
    setDays(nextDays)
    setActiveDayId(nextActiveId)
    if (pendingDate === dayId) {
      setPendingDate(nextActiveId)
    }
    setNotice({ type: 'success', text: 'Day deleted.' })
  }

  const confirmDeleteDay = (dayId) => {
    if (!dayId || readOnly) return
    const targetLabel = days.find((day) => day.id === dayId)?.label || dayId
    const confirmed = window.confirm(
      `Delete ${targetLabel} and all entries for that day?`,
    )
    if (!confirmed) return
    deleteDay(dayId)
  }

  /* ── File IO ───────────────────────────── */

  const triggerSave = () => {
    const payload = {
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      activeDayId,
      profile,
      days,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `worklog-${todayStamp()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice({ type: 'success', text: 'Worklog saved to file.' })
  }

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!Array.isArray(parsed?.days) || parsed.days.length === 0) {
          throw new Error('Invalid file format.')
        }
        const normalizedDays = parsed.days.map((day, index) =>
          normalizeDay(day, `Imported-${index + 1}`),
        )
        const nextActive = normalizedDays.some(
          (day) => day.id === parsed.activeDayId,
        )
          ? parsed.activeDayId
          : normalizedDays[0].id

        setProfile((prevProfile) =>
          parsed?.profile ? normalizeProfile(parsed.profile) : prevProfile,
        )

        setDays(normalizedDays)
        setActiveDayId(nextActive)
        const nextPending = /^\d{4}-\d{2}-\d{2}$/.test(nextActive)
          ? nextActive
          : todayStamp()
        setPendingDate(nextPending)
        setNotice({ type: 'success', text: 'Worklog imported.' })
      } catch (error) {
        setNotice({
          type: 'error',
          text: error.message || 'Unable to import that file.',
        })
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const exportWorkbook = (scope) => {
    const workbook = XLSX.utils.book_new()
    const targetDays =
      scope === 'active' ? [activeDay].filter(Boolean) : days

    targetDays.forEach((day) => {
      const sheet = buildSheet(day, profile)
      XLSX.utils.book_append_sheet(workbook, sheet, sanitizeSheetName(day.id))
    })

    const filename =
      scope === 'active'
        ? `worklog-${activeDay?.id || todayStamp()}.xlsx`
        : `worklog-all-${todayStamp()}.xlsx`
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx', cellStyles: true })
    setNotice({ type: 'success', text: 'XLSX export ready.' })
  }

  /* ── Render ────────────────────────────── */

  return (
    <div className="app-shell">
      <div className="app-glow app-glow-one" aria-hidden="true" />
      <div className="app-glow app-glow-two" aria-hidden="true" />

      <div className="app">
        <Header
          totalHours={totalHours}
          entryCount={activeDay?.entries.length || 0}
        />

        <Toolbar
          onSave={triggerSave}
          onImport={triggerImport}
          onExportDay={() => exportWorkbook('active')}
          onExportAll={() => exportWorkbook('all')}
          readOnly={readOnly}
          onReadOnlyChange={setReadOnly}
          fileInputRef={fileInputRef}
          onFileChange={handleImport}
          pendingDate={pendingDate}
          onPendingDateChange={setPendingDate}
          theme={theme}
          onThemeChange={setTheme}
        />

        <Notice notice={notice} />

        <ProfilePanel
          profile={profile}
          onUpdateField={updateProfileField}
          readOnly={readOnly}
        />

        <DayTabs
          days={days}
          activeDayId={activeDayId}
          onSelectDay={setActiveDayId}
          onAddDay={addDay}
          readOnly={readOnly}
          pendingDate={pendingDate}
        />

        <DayPanel
          activeDay={activeDay}
          days={days}
          activePanel={activePanel}
          onSetActivePanel={setActivePanel}
          onDeleteDay={confirmDeleteDay}
          onUpdateEntry={updateEntry}
          onDeleteEntry={deleteEntry}
          onAddEntry={addEntry}
          onUpdateDayField={updateDayField}
          onUpdateTodo={updateTodo}
          onDeleteTodo={deleteTodo}
          onAddTodo={addTodo}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}

export default App
