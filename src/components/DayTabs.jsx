function DayTabs({ days, activeDayId, onSelectDay, onAddDay, readOnly, pendingDate }) {
  return (
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
              onClick={() => onSelectDay(day.id)}
            >
              {day.label}
            </button>
          ))}
        </div>
        <div className="tab-actions">
          <button
            className="button outline"
            type="button"
            onClick={onAddDay}
            disabled={readOnly || !pendingDate}
          >
            Add day
          </button>
        </div>
      </div>
    </section>
  )
}

export default DayTabs
