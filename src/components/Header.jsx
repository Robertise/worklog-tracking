function Header({ totalHours, entryCount }) {
  return (
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
        <small>{entryCount} entries today</small>
      </aside>
    </header>
  )
}

export default Header
