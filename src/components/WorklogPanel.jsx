import CheckinBar from './CheckinBar'
import EntryCard from './EntryCard'
import { DEFAULT_CHECKIN, DEFAULT_CHECKOUT } from '../constants'

function WorklogPanel({ activeDay, onUpdateEntry, onDeleteEntry, onAddEntry, onUpdateDayField, readOnly }) {
  return (
    <>
      <CheckinBar
        checkIn={activeDay?.checkIn || DEFAULT_CHECKIN}
        checkOut={activeDay?.checkOut || DEFAULT_CHECKOUT}
        onUpdate={onUpdateDayField}
        readOnly={readOnly}
      />

      <div className="entry-list" role="region" aria-live="polite">
        {activeDay?.entries.length ? (
          activeDay.entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={index}
              onUpdate={onUpdateEntry}
              onDelete={onDeleteEntry}
              readOnly={readOnly}
            />
          ))
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
          onClick={onAddEntry}
          disabled={readOnly}
        >
          Add entry
        </button>
        <p className="hint">
          Time uses 24-hour format with 10-minute steps (for example, 13:20).
          Duration auto-calculates when the end time is later than the start
          time.
        </p>
      </div>
    </>
  )
}

export default WorklogPanel
