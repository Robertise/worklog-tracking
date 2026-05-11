import { TODO_PRIORITIES } from '../constants'
import StatusToggle from './StatusToggle'

const COMPLETED_OPTIONS = [
  { label: 'Pending', value: false },
  { label: 'Done', value: true },
]

function TodoCard({ todo, index, onUpdate, onDelete, readOnly }) {
  return (
    <article className="todo-card" style={{ '--i': index }}>
      <div className="entry-grid">
        <label className="entry-field entry-field-wide todo-task-field">
          <span className="field-caption">Task</span>
          <input
            type="text"
            placeholder="Task"
            value={todo.task}
            onChange={(event) =>
              onUpdate(todo.id, 'task', event.target.value)
            }
            disabled={readOnly}
          />
        </label>

        <div className="entry-field entry-field-compact todo-completed-field">
          <span className="field-caption">Completed</span>
          <StatusToggle
            options={COMPLETED_OPTIONS}
            value={todo.completed}
            onChange={(value) => onUpdate(todo.id, 'completed', value)}
            disabled={readOnly}
          />
        </div>

        <label className="entry-field entry-field-compact todo-priority-field">
          <span className="field-caption">Priority</span>
          <select
            value={todo.priority}
            onChange={(event) =>
              onUpdate(todo.id, 'priority', event.target.value)
            }
            disabled={readOnly}
          >
            {TODO_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label className="entry-field entry-field-compact todo-date-field">
          <span className="field-caption">Due date</span>
          <input
            type="date"
            value={todo.dueDate}
            onChange={(event) =>
              onUpdate(todo.id, 'dueDate', event.target.value)
            }
            disabled={readOnly}
          />
        </label>

        <label className="entry-field entry-field-full">
          <span className="field-caption">Notes</span>
          <textarea
            rows="2"
            placeholder="Notes"
            value={todo.notes}
            onChange={(event) =>
              onUpdate(todo.id, 'notes', event.target.value)
            }
            disabled={readOnly}
          />
        </label>
      </div>

      <div className="entry-card-footer">
        <span className="entry-index">Task {index + 1}</span>
        <button
          className="button danger"
          type="button"
          onClick={() => onDelete(todo.id)}
          disabled={readOnly}
        >
          Remove
        </button>
      </div>
    </article>
  )
}

export default TodoCard
