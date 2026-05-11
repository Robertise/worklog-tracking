import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

const STATUS_OPTIONS = ['Not started', 'In progress', 'Done']
const FILE_VERSION = 1
const STORAGE_KEY = 'worklog-ledger:v1'

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
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Worklog Studio</p>
          <h1>Daily Worklog Ledger</h1>
          <p className="subtle">
            Track your day in timed blocks. Auto-saves to this browser and
            exports Excel-ready sheets when needed.
          </p>
        </div>
        <div className="header-actions">
          <button className="button primary" type="button" onClick={triggerSave}>
            Save file
          </button>
          <button className="button outline" type="button" onClick={triggerImport}>
            Import file
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={() => exportWorkbook('active')}
          >
            Export day
          </button>
          <button
            className="button ghost"
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
      </header>

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
            <label>
              <span className="field-label">Add day</span>
              <input
                type="date"
                value={pendingDate}
                onChange={(event) => setPendingDate(event.target.value)}
                disabled={readOnly}
              />
            </label>
            <button
              className="button outline"
              type="button"
              onClick={addDay}
              disabled={readOnly || !pendingDate}
            >
              Add
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
          <div className="totals">
            <span>Total hours</span>
            <strong>{totalHours.toFixed(2)}</strong>
          </div>
        </div>

        <div className="table-shell" role="region" aria-live="polite">
          <table className="worklog-table">
            <thead>
              <tr>
                <th>Start time</th>
                <th>End time</th>
                <th>Project</th>
                <th>Task description</th>
                <th>Duration (hrs)</th>
                <th>Status</th>
                <th>Notes</th>
                <th aria-label="Row actions"></th>
              </tr>
            </thead>
            <tbody>
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
                    <tr
                      key={entry.id}
                      className={`entry-row ${invalidRange ? 'invalid' : ''}`}
                      style={{ '--i': index }}
                    >
                      <td>
                        <input
                          type="time"
                          step="300"
                          value={entry.startTime}
                          onChange={(event) =>
                            updateEntry(entry.id, 'startTime', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          step="300"
                          value={entry.endTime}
                          onChange={(event) =>
                            updateEntry(entry.id, 'endTime', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Project"
                          value={entry.project}
                          onChange={(event) =>
                            updateEntry(entry.id, 'project', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="What did you work on?"
                          value={entry.task}
                          onChange={(event) =>
                            updateEntry(entry.id, 'task', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <div className="duration">
                          <span>{durationLabel}</span>
                          {invalidRange && (
                            <small>End must be after start</small>
                          )}
                        </div>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <textarea
                          rows="2"
                          placeholder="Notes"
                          value={entry.notes}
                          onChange={(event) =>
                            updateEntry(entry.id, 'notes', event.target.value)
                          }
                          disabled={readOnly}
                        />
                      </td>
                      <td className="row-actions">
                        <button
                          className="button danger"
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          disabled={readOnly}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No entries yet. Add your first time block below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-actions">
          <button
            className="button primary"
            type="button"
            onClick={addEntry}
            disabled={readOnly}
          >
            Add entry
          </button>
          <p className="hint">
            Time is in 24-hour format (e.g., 13:00). Duration auto-calculates.
          </p>
        </div>
      </section>
    </div>
  )
}

export default App
