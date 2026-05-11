import { Sun, Moon } from 'lucide-react'

function Toolbar({
  onSave,
  onImport,
  onExportDay,
  onExportAll,
  readOnly,
  onReadOnlyChange,
  fileInputRef,
  onFileChange,
  pendingDate,
  onPendingDateChange,
  theme,
  onThemeChange,
}) {
  return (
    <section className="toolbar-panel">
      <div className="header-actions">
        <button className="button primary" type="button" onClick={onSave}>
          Save file
        </button>
        <button className="button primary" type="button" onClick={onImport}>
          Import file
        </button>
        <button className="button secondary" type="button" onClick={onExportDay}>
          Export day
        </button>
        <button className="button secondary" type="button" onClick={onExportAll}>
          Export all
        </button>
        <label className="toggle">
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(event) => onReadOnlyChange(event.target.checked)}
          />
          <span>View-only</span>
        </label>
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept="application/json"
          onChange={onFileChange}
        />
      </div>

      <div className="toolbar-side">
        <label className="date-control">
          <span className="field-label">Worklog date</span>
          <input
            type="date"
            value={pendingDate}
            onChange={(event) => onPendingDateChange(event.target.value)}
            disabled={readOnly}
          />
        </label>

        <div className="theme-switcher" role="group" aria-label="Theme">
          <button
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            type="button"
            onClick={() => onThemeChange('light')}
          >
            <Sun size={16} />
          </button>
          <button
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            type="button"
            onClick={() => onThemeChange('dark')}
          >
            <Moon size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Toolbar
