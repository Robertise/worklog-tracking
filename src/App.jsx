import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'
import { Moon, Sun } from 'lucide-react';

const STATUS_OPTIONS = ['Not started', 'In progress', 'Done']
const FILE_VERSION = 1
const STORAGE_KEY = 'worklog-ledger:v1'
const THEME_STORAGE_KEY = 'worklog-ledger:theme'

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const todayStamp = () => new Date().toISOString().slice(0, 10)

const createEntry = () => ({
  id: createId(),
  startTime: '',
  endTime: '',
  project: '',
  task: '',
  status: STATUS_OPTIONS[0],
  notes: '',
})

const calculateDurationHours = (startTime, endTime) => {
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

const sanitizeSheetName = (name) => {
  const cleaned = name.replace(/[\\/*?:\[\]]/g, '').trim()
  return cleaned.slice(0, 31) || 'Worklog'
}

const buildSheet = (entries) => {
  const header = [
    'Start Time',
    'End Time',
    'Project',
    'Task Description',
    'Duration (hrs)',
    'Status',
    'Notes',
  ]

  const rows = entries.map((entry) => {
    const duration = calculateDurationHours(entry.startTime, entry.endTime)
    return [
      entry.startTime,
      entry.endTime,
      entry.project,
      entry.task,
      duration === null ? '' : Number(duration.toFixed(2)),
      entry.status,
      entry.notes,
    ]
  })

  return XLSX.utils.aoa_to_sheet([header, ...rows])
}

const normalizeEntry = (entry) => ({
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

const normalizeDay = (day, fallbackId) => {
  const id = day?.id || day?.label || fallbackId
  return {
    id,
    label: day?.label || id,
    entries: Array.isArray(day?.entries)
      ? day.entries.map(normalizeEntry)
      : [],
  }
}

const loadFromStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.days) || parsed.days.length === 0) {
      return null
    }
    const normalizedDays = parsed.days.map((day, index) =>
      normalizeDay(day, `Stored-${index + 1}`),
    )
    const activeId = normalizedDays.some(
      (day) => day.id === parsed.activeDayId,
    )
      ? parsed.activeDayId
      : normalizedDays[0].id
    const pendingDate = /^\d{4}-\d{2}-\d{2}$/.test(parsed.pendingDate)
      ? parsed.pendingDate
      : activeId
    return { days: normalizedDays, activeDayId: activeId, pendingDate }
  } catch (error) {
    return null
  }
}

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const savedTheme = window.localStorage?.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function App() {
  const initialDate = todayStamp()
  const initialData = useMemo(() => loadFromStorage(), [])
  const [days, setDays] = useState(() =>
    initialData?.days || [
      { id: initialDate, label: initialDate, entries: [createEntry()] },
    ],
  )
  const [activeDayId, setActiveDayId] = useState(
    () => initialData?.activeDayId || initialDate,
  )
  const [pendingDate, setPendingDate] = useState(
    () => initialData?.pendingDate || initialDate,
  )
  const [theme, setTheme] = useState(getPreferredTheme)
  const [readOnly, setReadOnly] = useState(false)
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

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme])

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

  const addDay = () => {
    if (!pendingDate || readOnly) return
    setDays((prevDays) => {
      const exists = prevDays.some((day) => day.id === pendingDate)
      if (exists) return prevDays
      const nextDays = [
        ...prevDays,
        { id: pendingDate, label: pendingDate, entries: [] },
      ].sort((a, b) => a.id.localeCompare(b.id))
      return nextDays
    })
    setActiveDayId(pendingDate)
  }

  const triggerSave = () => {
    const payload = {
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      activeDayId,
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
      const sheet = buildSheet(day.entries)
      XLSX.utils.book_append_sheet(workbook, sheet, sanitizeSheetName(day.id))
    })

    const filename =
      scope === 'active'
        ? `worklog-${activeDay?.id || todayStamp()}.xlsx`
        : `worklog-all-${todayStamp()}.xlsx`
    XLSX.writeFile(workbook, filename)
    setNotice({ type: 'success', text: 'XLSX export ready.' })
  }

  return (
    <div className="app-shell">
      <div className="app-glow app-glow-one" aria-hidden="true" />
      <div className="app-glow app-glow-two" aria-hidden="true" />

      <div className="app">
        <header className="app-header">
          <div className="hero-copy">
            <p className="eyebrow">Worklog Studio</p>
            <h1>Daily Worklog Ledger</h1>
            <p className="subtle">
              Track your day in timed blocks. Auto-saves to this browser and
              exports Excel-ready sheets when needed.
            </p>
          </div>

          <aside className="summary-card" aria-label="Total hours summary">
            <span>Total Hours</span>
            <strong>{totalHours.toFixed(2)}</strong>
            <small>{activeDay?.entries.length || 0} entries today</small>
          </aside>
        </header>

        <section className="toolbar-panel">
          <div className="header-actions">
            <button className="button primary" type="button" onClick={triggerSave}>
              Save file
            </button>
            <button
              className="button primary"
              type="button"
              onClick={triggerImport}
            >
              Import file
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => exportWorkbook('active')}
            >
              Export day
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => exportWorkbook('all')}
            >
              Export all
            </button>
            <label className="toggle">
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(event) => setReadOnly(event.target.checked)}
              />
              <span>View-only</span>
            </label>
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="application/json"
              onChange={handleImport}
            />
          </div>

          <div className="toolbar-side">
            <label className="date-control">
              <span className="field-label">Worklog date</span>
              <input
                type="date"
                value={pendingDate}
                onChange={(event) => setPendingDate(event.target.value)}
                disabled={readOnly}
              />
            </label>

            <div className="theme-switcher" role="group" aria-label="Theme">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                type="button"
                onClick={() => setTheme('light')}
              >
                <Sun size={16} /> 
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                type="button"
                onClick={() => setTheme('dark')}
              >
                <Moon size={16} />
              </button>
            </div>
          </div>
        </section>

        {notice && (
          <div className={`notice ${notice.type}`} role="status">
            {notice.text}
          </div>
        )}

        <section className="tabs-panel">
          <div className="tab-row">
            <div className="tab-list" role="tablist" aria-label="Worklog days">
              {days.map((day) => (
                <button
                  key={day.id}
                  className={`tab ${day.id === activeDayId ? 'active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={day.id === activeDayId}
                  onClick={() => setActiveDayId(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="tab-actions">
              <button
                className="button outline"
                type="button"
                onClick={addDay}
                disabled={readOnly || !pendingDate}
              >
                Add day
              </button>
            </div>
          </div>
        </section>

        <section className="day-panel">
          <div className="day-meta">
            <div>
              <h2>{activeDay?.label || 'No day selected'}</h2>
              <p className="subtle">{activeDay?.entries.length || 0} entries</p>
            </div>
          </div>

          <div className="entry-list" role="region" aria-live="polite">
            {activeDay?.entries.length ? (
              activeDay.entries.map((entry, index) => {
                const duration = calculateDurationHours(
                  entry.startTime,
                  entry.endTime,
                )
                const durationLabel =
                  duration === null ? '--' : duration.toFixed(2)
                const invalidRange =
                  entry.startTime &&
                  entry.endTime &&
                  duration === null
                return (
                  <article
                    key={entry.id}
                    className={`entry-card ${invalidRange ? 'invalid' : ''}`}
                    style={{ '--i': index }}
                  >
                    <div className="entry-grid">
                      <label className="entry-field entry-field-compact">
                        <span className="field-caption">Start time</span>
                        <input
                          type="time"
                          step="300"
                          value={entry.startTime}
                          onChange={(event) =>
                            updateEntry(entry.id, 'startTime', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </label>

                      <label className="entry-field entry-field-compact">
                        <span className="field-caption">End time</span>
                        <input
                          type="time"
                          step="300"
                          value={entry.endTime}
                          onChange={(event) =>
                            updateEntry(entry.id, 'endTime', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </label>

                      <div className="entry-field duration-card">
                        <span className="field-caption">Duration</span>
                        <div className="duration">
                          <strong>{durationLabel}</strong>
                          <span>hours</span>
                          {invalidRange && (
                            <small>End time must be after start time.</small>
                          )}
                        </div>
                      </div>

                      <label className="entry-field">
                        <span className="field-caption">Status</span>
                        <select
                          value={entry.status}
                          onChange={(event) =>
                            updateEntry(entry.id, 'status', event.target.value)
                          }
                          disabled={readOnly}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="entry-field entry-field-wide">
                        <span className="field-caption">Project</span>
                        <input
                          type="text"
                          placeholder="Project"
                          value={entry.project}
                          onChange={(event) =>
                            updateEntry(entry.id, 'project', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </label>

                      <label className="entry-field entry-field-wide">
                        <span className="field-caption">Task description</span>
                        <input
                          type="text"
                          placeholder="What did you work on?"
                          value={entry.task}
                          onChange={(event) =>
                            updateEntry(entry.id, 'task', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </label>

                      <label className="entry-field entry-field-full">
                        <span className="field-caption">Notes</span>
                        <textarea
                          rows="3"
                          placeholder="Notes"
                          value={entry.notes}
                          onChange={(event) =>
                            updateEntry(entry.id, 'notes', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </label>
                    </div>

                    <div className="entry-card-footer">
                      <span className="entry-index">Entry {index + 1}</span>
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => deleteEntry(entry.id)}
                        disabled={readOnly}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="empty-state">
                No entries yet. Add your first time block below.
              </div>
            )}
          </div>

          <div className="table-actions">
            <button
              className="button add-entry"
              type="button"
              onClick={addEntry}
              disabled={readOnly}
            >
              Add entry
            </button>
            <p className="hint">
              Time uses 24-hour format (for example, 13:00). Duration
              auto-calculates when the end time is later than the start time.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
