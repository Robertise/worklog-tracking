import WorklogPanel from './WorklogPanel'
import TodoPanel from './TodoPanel'

function DayPanel({
  activeDay,
  days,
  activePanel,
  onSetActivePanel,
  onDeleteDay,
  onUpdateEntry,
  onDeleteEntry,
  onAddEntry,
  onUpdateDayField,
  onUpdateTodo,
  onDeleteTodo,
  onAddTodo,
  readOnly,
}) {
  return (
    <section className="day-panel">
      <div className="day-meta">
        <div>
          <h2>{activeDay?.label || 'No day selected'}</h2>
          <p className="subtle">
            {activePanel === 'todo'
              ? `${activeDay?.todos.length || 0} tasks`
              : `${activeDay?.entries.length || 0} entries`}
          </p>
        </div>
        <div className="day-actions">
          <div className="panel-tabs" role="tablist" aria-label="Day panels">
            <button
              className={`panel-tab ${activePanel === 'worklog' ? 'active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activePanel === 'worklog'}
              onClick={() => onSetActivePanel('worklog')}
            >
              Worklog
            </button>
            <button
              className={`panel-tab ${activePanel === 'todo' ? 'active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activePanel === 'todo'}
              onClick={() => onSetActivePanel('todo')}
            >
              Todo
            </button>
          </div>
          <button
            className="button danger"
            type="button"
            onClick={() => onDeleteDay(activeDay?.id)}
            disabled={readOnly || days.length <= 1}
          >
            Delete day
          </button>
        </div>
      </div>

      {activePanel === 'worklog' ? (
        <WorklogPanel
          activeDay={activeDay}
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
          onAddEntry={onAddEntry}
          onUpdateDayField={onUpdateDayField}
          readOnly={readOnly}
        />
      ) : (
        <TodoPanel
          activeDay={activeDay}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
          onAddTodo={onAddTodo}
          readOnly={readOnly}
        />
      )}
    </section>
  )
}

export default DayPanel
