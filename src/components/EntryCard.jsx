import { STATUS_OPTIONS } from '../constants'
import { TIME_OPTIONS, calculateDurationHours } from '../utils/time'
import TimePicker from './TimePicker'
import StatusToggle from './StatusToggle'

const STATUS_TOGGLE_OPTIONS = STATUS_OPTIONS.map((s) => ({ label: s, value: s }))

function EntryCard({ entry, index, onUpdate, onDelete, readOnly }) {
  const duration = calculateDurationHours(entry.startTime, entry.endTime)
  const durationLabel = duration === null ? '--' : duration.toFixed(2)
  const invalidRange =
    entry.startTime && entry.endTime && duration === null

  return (
    <article
      className={`entry-card ${invalidRange ? 'invalid' : ''}`}
      style={{ '--i': index }}
    >
      <div className="entry-grid">
        <label className="entry-field entry-field-compact">
          <span className="field-caption">Start time</span>
          <TimePicker
            value={entry.startTime}
            options={TIME_OPTIONS}
            onChange={(value) => onUpdate(entry.id, 'startTime', value)}
            disabled={readOnly}
            placeholder="--:--"
            ariaLabel="Start time"
          />
        </label>

        <label className="entry-field entry-field-compact">
          <span className="field-caption">End time</span>
          <TimePicker
            value={entry.endTime}
            options={TIME_OPTIONS}
            onChange={(value) => onUpdate(entry.id, 'endTime', value)}
            disabled={readOnly}
            placeholder="--:--"
            ariaLabel="End time"
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

        <label className="entry-field entry-status-field">
          <span className="field-caption">Status</span>
          <StatusToggle
            options={STATUS_TOGGLE_OPTIONS}
            value={entry.status}
            onChange={(value) => onUpdate(entry.id, 'status', value)}
            disabled={readOnly}
          />
        </label>

        <label className="entry-field entry-field-wide">
          <span className="field-caption">Project</span>
          <input
            type="text"
            placeholder="Project"
            value={entry.project}
            onChange={(event) =>
              onUpdate(entry.id, 'project', event.target.value)
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
              onUpdate(entry.id, 'task', event.target.value)
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
              onUpdate(entry.id, 'notes', event.target.value)
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
          onClick={() => onDelete(entry.id)}
          disabled={readOnly}
        >
          Remove
        </button>
      </div>
    </article>
  )
}

export default EntryCard
